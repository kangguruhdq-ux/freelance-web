import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { verifyToken, AUTH_COOKIE_NAME } from "../lib/jwt";
import prisma from "../lib/prisma";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  avatarUrl: string | null;
  profile: any | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    // 2. Check Cookie (auth_token)
    if (!token && req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
      token = req.cookies[AUTH_COOKIE_NAME];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Authentication required. Please log in.",
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired session. Please log in again.",
      });
      return;
    }

    // Lookup user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
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

    if (!user || user.status === "SUSPENDED") {
      res.status(401).json({
        success: false,
        error: "User account not found or suspended.",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Internal authentication error.",
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "Access denied. Insufficient permissions for this resource.",
      });
      return;
    }

    next();
  };
}

export function requireOwnership(paramName = "id") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
      return;
    }

    const resourceId = req.params[paramName];

    // Admin can access any resource; regular users can only access their own
    if (req.user.role !== UserRole.ADMIN && req.user.id !== resourceId) {
      res.status(403).json({
        success: false,
        error: "Access denied. You do not have permission to access this resource.",
      });
      return;
    }

    next();
  };
}
