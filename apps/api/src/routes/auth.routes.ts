import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma";
import { generateToken, AUTH_COOKIE_NAME, authCookieOptions } from "../lib/jwt";
import { validateRegisterInput, validateLoginInput } from "../lib/validation";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// POST /auth/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateRegisterInput(req.body);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: validation.errors[0],
        errors: validation.errors,
      });
      return;
    }

    const { name, email, password, role } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: "An account with this email address already exists.",
      });
      return;
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and profile transactionally
    const userRole = role === "CLIENT" ? UserRole.CLIENT : UserRole.FREELANCER;
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: userRole,
        profile: {
          create: {
            headline: userRole === UserRole.CLIENT ? "Project Owner" : "Professional Freelancer",
            bio: "",
            location: "Remote",
            hourlyRate: 0,
            experienceLevel: "INTERMEDIATE",
            availability: userRole === UserRole.CLIENT ? "HIRING" : "FULL_TIME",
            rating: 0,
            completedJobs: 0,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        profile: {
          select: {
            headline: true,
            bio: true,
            location: true,
            hourlyRate: true,
            rating: true,
            completedJobs: true,
          },
        },
      },
    });

    // Generate JWT
    const token = generateToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Set HTTP-only cookie
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);

    res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      user: newUser,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred during registration. Please try again.",
    });
  }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateLoginInput(req.body);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: validation.errors[0],
      });
      return;
    }

    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: {
          select: {
            headline: true,
            bio: true,
            location: true,
            hourlyRate: true,
            rating: true,
            completedJobs: true,
          },
        },
      },
    });

    // Generic timing-safe error if user does not exist or password is wrong
    if (!user) {
      // Dummy compare to mitigate timing attacks
      await bcrypt.compare("dummy_password", "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890123456789012");
      res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
      return;
    }

    // Check account status
    if (user.status === "SUSPENDED") {
      res.status(403).json({
        success: false,
        error: "Your account is currently suspended. Please contact platform support.",
      });
      return;
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
      return;
    }

    // Generate JWT
    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Set HTTP-only cookie
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);

    // Sanitize user object (exclude passwordHash)
    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      profile: user.profile,
    };

    res.status(200).json({
      success: true,
      message: "Login successful.",
      user: sanitizedUser,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred during login. Please try again.",
    });
  }
});

// POST /auth/logout
router.post("/logout", (req: Request, res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

// GET /auth/me
router.get("/me", authenticate, (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;
