import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { ExperienceLevel } from "@prisma/client";

const router = Router();

// GET /profiles/categories — Public categories list
router.get("/meta/categories", async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { jobs: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        jobCount: c._count.jobs,
      })),
    });
  } catch (error) {
    console.error("Fetch categories error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch categories" });
  }
});

// GET /profiles/skills — Public skills list
router.get("/meta/skills", async (_req: Request, res: Response): Promise<void> => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: "asc" },
      take: 100,
    });

    res.status(200).json({
      success: true,
      data: skills,
    });
  } catch (error) {
    console.error("Fetch skills error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch skills" });
  }
});

// GET /profiles — Public freelancers directory
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, take = "12" } = req.query;
    const limit = Math.min(50, Math.max(1, parseInt(take as string, 10) || 12));

    const where: any = {
      user: { role: "FREELANCER", status: "ACTIVE" },
    };

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { headline: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const profiles = await prisma.profile.findMany({
      where,
      take: limit,
      orderBy: { rating: "desc" },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } },
        skills: { include: { skill: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: profiles.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.user.name,
        avatarUrl: p.user.avatarUrl,
        headline: p.headline,
        bio: p.bio,
        location: p.location,
        hourlyRate: Number(p.hourlyRate),
        rating: Number(p.rating),
        completedJobs: p.completedJobs,
        skills: p.skills.map((s) => ({ id: s.skill.id, name: s.skill.name, slug: s.skill.slug })),
      })),
    });
  } catch (error) {
    console.error("List profiles error:", error);
    res.status(500).json({ success: false, error: "Failed to list freelancer profiles" });
  }
});

// GET /profiles/me — Get current user's profile
router.get("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            createdAt: true,
          },
        },
        skills: {
          include: { skill: true },
        },
        portfolioItems: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      res.status(404).json({ success: false, error: "Profile not found" });
      return;
    }

    res.status(200).json({
      success: true,
      profile: {
        id: profile.id,
        userId: profile.userId,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        hourlyRate: Number(profile.hourlyRate),
        experienceLevel: profile.experienceLevel,
        availability: profile.availability,
        rating: Number(profile.rating),
        completedJobs: profile.completedJobs,
        totalEarnings: Number(profile.totalEarnings),
        user: profile.user,
        skills: profile.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
        portfolioItems: profile.portfolioItems,
      },
    });
  } catch (error) {
    console.error("Fetch my profile error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch profile" });
  }
});

// PUT /profiles/me — Update freelancer profile
router.put("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { headline, bio, location, hourlyRate, experienceLevel, availability, skillIds } = req.body;

    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Profile not found" });
      return;
    }

    const updateData: any = {};
    if (headline !== undefined) updateData.headline = headline.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (hourlyRate !== undefined) {
      const rate = parseFloat(hourlyRate);
      if (rate < 0) {
        res.status(400).json({ success: false, error: "Hourly rate cannot be negative" });
        return;
      }
      updateData.hourlyRate = rate;
    }
    if (experienceLevel) updateData.experienceLevel = experienceLevel as ExperienceLevel;
    if (availability) updateData.availability = availability;

    const updated = await prisma.profile.update({
      where: { userId },
      data: updateData,
    });

    // Update skills if provided
    if (Array.isArray(skillIds)) {
      await prisma.profileSkill.deleteMany({ where: { profileId: updated.id } });
      if (skillIds.length > 0) {
        await prisma.profileSkill.createMany({
          data: skillIds.map((skillId: string) => ({
            profileId: updated.id,
            skillId,
          })),
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        id: updated.id,
        headline: updated.headline,
        location: updated.location,
        hourlyRate: Number(updated.hourlyRate),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
});

// POST /profiles/me/portfolio — Add portfolio item
router.post("/me/portfolio", authenticate, requireRole("FREELANCER"), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      res.status(404).json({ success: false, error: "Freelancer profile not found" });
      return;
    }

    const { title, description, coverImage, projectUrl, githubUrl, technologies = [] } = req.body;
    if (!title || !description || !coverImage) {
      res.status(400).json({ success: false, error: "Title, description, and cover image are required." });
      return;
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        profileId: profile.id,
        title: title.trim(),
        description: description.trim(),
        coverImage: coverImage.trim(),
        projectUrl: projectUrl ? projectUrl.trim() : null,
        githubUrl: githubUrl ? githubUrl.trim() : null,
        technologies: Array.isArray(technologies) ? technologies : [],
      },
    });

    res.status(201).json({
      success: true,
      message: "Portfolio item added successfully",
      portfolio,
    });
  } catch (error) {
    console.error("Add portfolio error:", error);
    res.status(500).json({ success: false, error: "Failed to add portfolio item" });
  }
});

// DELETE /profiles/me/portfolio/:id — Remove portfolio item
router.delete("/me/portfolio/:id", authenticate, requireRole("FREELANCER"), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!portfolio) {
      res.status(404).json({ success: false, error: "Portfolio item not found" });
      return;
    }

    if (portfolio.profile.userId !== userId) {
      res.status(403).json({ success: false, error: "You do not have permission to delete this portfolio item" });
      return;
    }

    await prisma.portfolio.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Portfolio item deleted successfully",
    });
  } catch (error) {
    console.error("Delete portfolio error:", error);
    res.status(500).json({ success: false, error: "Failed to delete portfolio item" });
  }
});

// GET /profiles/:userId — Public freelancer profile details
router.get("/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [
          { userId },
          { id: userId },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            createdAt: true,
          },
        },
        skills: {
          include: { skill: true },
        },
        portfolioItems: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      res.status(404).json({ success: false, error: "Freelancer profile not found" });
      return;
    }

    res.status(200).json({
      success: true,
      profile: {
        id: profile.id,
        userId: profile.userId,
        name: profile.user.name,
        avatarUrl: profile.user.avatarUrl,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        hourlyRate: Number(profile.hourlyRate),
        experienceLevel: profile.experienceLevel,
        availability: profile.availability,
        rating: Number(profile.rating),
        completedJobs: profile.completedJobs,
        memberSince: profile.user.createdAt.toISOString(),
        skills: profile.skills.map((s) => ({ id: s.skill.id, name: s.skill.name, slug: s.skill.slug })),
        portfolio: profile.portfolioItems,
      },
    });
  } catch (error) {
    console.error("Fetch public profile error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch freelancer profile" });
  }
});

export default router;
