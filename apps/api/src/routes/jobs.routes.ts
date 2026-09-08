import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { JobStatus, BudgetType, ExperienceLevel, LocationType } from "@prisma/client";

const router = Router();

// GET /jobs — Public list with search, filter, pagination
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      category,
      categoryId,
      minBudget,
      maxBudget,
      budgetType,
      experienceLevel,
      status = "OPEN",
      page = "1",
      limit = "10",
      sort = "newest",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status as JobStatus;
    }

    if (categoryId) {
      where.categoryId = categoryId as string;
    } else if (category) {
      where.category = {
        slug: category as string,
      };
    }

    if (budgetType) {
      where.budgetType = budgetType as BudgetType;
    }

    if (experienceLevel) {
      where.experienceLevel = experienceLevel as ExperienceLevel;
    }

    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = parseFloat(minBudget as string);
      if (maxBudget) where.budget.lte = parseFloat(maxBudget as string);
    }

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "budget_high") orderBy = { budget: "desc" };
    if (sort === "budget_low") orderBy = { budget: "asc" };
    if (sort === "proposals") orderBy = { proposalsCount: "desc" };

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          client: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              createdAt: true,
            },
          },
          skills: {
            include: {
              skill: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      categoryId: job.categoryId,
      category: job.category.name,
      categorySlug: job.category.slug,
      budget: Number(job.budget),
      budgetType: job.budgetType,
      experienceLevel: job.experienceLevel,
      locationType: job.locationType,
      duration: job.duration,
      status: job.status,
      proposalsCount: job.proposalsCount,
      createdAt: job.createdAt.toISOString(),
      client: {
        id: job.client.id,
        name: job.client.name,
        avatarUrl: job.client.avatarUrl,
        memberSince: job.client.createdAt.toISOString(),
      },
      skills: job.skills.map((s) => s.skill.name),
    }));

    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("Fetch jobs error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch jobs" });
  }
});

// GET /jobs/:id — Job details
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        category: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({ success: false, error: "Job not found" });
      return;
    }

    res.status(200).json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        categoryId: job.categoryId,
        category: job.category.name,
        budget: Number(job.budget),
        budgetType: job.budgetType,
        experienceLevel: job.experienceLevel,
        locationType: job.locationType,
        duration: job.duration,
        status: job.status,
        proposalsCount: job.proposalsCount,
        createdAt: job.createdAt.toISOString(),
        client: job.client,
        skills: job.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
      },
    });
  } catch (error) {
    console.error("Fetch job error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch job details" });
  }
});

// POST /jobs — Create new job (CLIENT only)
router.post("/", authenticate, requireRole("CLIENT"), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      categoryId,
      budget,
      budgetType = "FIXED",
      experienceLevel = "INTERMEDIATE",
      locationType = "REMOTE",
      duration,
      skillIds = [],
    } = req.body;

    if (!title || typeof title !== "string" || title.trim().length < 5) {
      res.status(400).json({ success: false, error: "Job title must be at least 5 characters long." });
      return;
    }

    if (!description || typeof description !== "string" || description.trim().length < 20) {
      res.status(400).json({ success: false, error: "Job description must be at least 20 characters long." });
      return;
    }

    if (!categoryId) {
      res.status(400).json({ success: false, error: "Category is required." });
      return;
    }

    const numericBudget = parseFloat(budget);
    if (isNaN(numericBudget) || numericBudget <= 0) {
      res.status(400).json({ success: false, error: "Budget must be a positive number." });
      return;
    }

    const clientId = req.user!.id;

    const newJob = await prisma.job.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        clientId,
        budget: numericBudget,
        budgetType: budgetType as BudgetType,
        experienceLevel: experienceLevel as ExperienceLevel,
        locationType: locationType as LocationType,
        duration: duration || null,
        status: "OPEN",
        skills: {
          create: Array.isArray(skillIds)
            ? skillIds.map((skillId: string) => ({
                skill: { connect: { id: skillId } },
              }))
            : [],
        },
      },
      include: {
        category: true,
        skills: { include: { skill: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: "Job posted successfully.",
      job: {
        id: newJob.id,
        title: newJob.title,
        budget: Number(newJob.budget),
        status: newJob.status,
      },
    });
  } catch (error: any) {
    console.error("Create job error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to create job" });
  }
});

// PUT /jobs/:id — Update job (CLIENT owner or ADMIN only)
router.put("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.job.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ success: false, error: "Job not found" });
      return;
    }

    // Ownership check: must be the creator client or an ADMIN
    if (existing.clientId !== req.user!.id && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, error: "You do not have permission to edit this job." });
      return;
    }

    const {
      title,
      description,
      categoryId,
      budget,
      budgetType,
      experienceLevel,
      locationType,
      duration,
      status,
    } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (categoryId) updateData.categoryId = categoryId;
    if (budget !== undefined) {
      const num = parseFloat(budget);
      if (num <= 0) {
        res.status(400).json({ success: false, error: "Budget must be positive." });
        return;
      }
      updateData.budget = num;
    }
    if (budgetType) updateData.budgetType = budgetType as BudgetType;
    if (experienceLevel) updateData.experienceLevel = experienceLevel as ExperienceLevel;
    if (locationType) updateData.locationType = locationType as LocationType;
    if (duration !== undefined) updateData.duration = duration;
    if (status) updateData.status = status as JobStatus;

    const updated = await prisma.job.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        budget: Number(updated.budget),
      },
    });
  } catch (error: any) {
    console.error("Update job error:", error);
    res.status(500).json({ success: false, error: "Failed to update job" });
  }
});

// PATCH /jobs/:id/status — Update status (Close/Publish)
router.patch("/:id/status", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;

    if (!status || !Object.values(JobStatus).includes(status)) {
      res.status(400).json({ success: false, error: "Invalid job status" });
      return;
    }

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Job not found" });
      return;
    }

    if (existing.clientId !== req.user!.id && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, error: "You do not have permission to alter this job status." });
      return;
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { status: status as JobStatus },
    });

    res.status(200).json({
      success: true,
      message: `Job status updated to ${status}`,
      status: updated.status,
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ success: false, error: "Failed to update job status" });
  }
});

// DELETE /jobs/:id — Delete job (Owner or ADMIN)
router.delete("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.job.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ success: false, error: "Job not found" });
      return;
    }

    if (existing.clientId !== req.user!.id && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, error: "You do not have permission to delete this job." });
      return;
    }

    await prisma.job.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({ success: false, error: "Failed to delete job" });
  }
});

// GET /jobs/:id/proposals — View proposals for a specific job (Client owner or Admin only)
router.get("/:id/proposals", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      res.status(404).json({ success: false, error: "Job not found" });
      return;
    }

    // Critical authorization check: only the client who posted the job or an ADMIN can view proposals
    if (job.clientId !== req.user!.id && req.user!.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        error: "Forbidden: You do not have permission to view proposals for another client's job.",
      });
      return;
    }

    const proposals = await prisma.proposal.findMany({
      where: { jobId: id },
      orderBy: { createdAt: "desc" },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            profile: {
              select: {
                headline: true,
                rating: true,
                hourlyRate: true,
                completedJobs: true,
              },
            },
          },
        },
      },
    });

    const formatted = proposals.map((p) => ({
      id: p.id,
      jobId: p.jobId,
      coverLetter: p.coverLetter,
      bidAmount: Number(p.bidAmount),
      estimatedDays: p.estimatedDays,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      freelancer: {
        id: p.freelancer.id,
        name: p.freelancer.name,
        avatarUrl: p.freelancer.avatarUrl,
        headline: p.freelancer.profile?.headline || "",
        rating: Number(p.freelancer.profile?.rating || 5.0),
        completedJobs: p.freelancer.profile?.completedJobs || 0,
      },
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Fetch job proposals error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch proposals" });
  }
});

export default router;
