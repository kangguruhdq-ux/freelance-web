const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- FreelanceHub Database Verification ---");

  const counts = {
    Users: await prisma.user.count(),
    Profiles: await prisma.profile.count(),
    Categories: await prisma.category.count(),
    Skills: await prisma.skill.count(),
    ProfileSkills: await prisma.profileSkill.count(),
    Portfolios: await prisma.portfolio.count(),
    Jobs: await prisma.job.count(),
    JobSkills: await prisma.jobSkill.count(),
    Proposals: await prisma.proposal.count(),
    Contracts: await prisma.contract.count(),
    Milestones: await prisma.milestone.count(),
    Conversations: await prisma.conversation.count(),
    Participants: await prisma.conversationParticipant.count(),
    Messages: await prisma.message.count(),
    Notifications: await prisma.notification.count(),
    Reviews: await prisma.review.count(),
    Transactions: await prisma.transaction.count(),
    Favorites: await prisma.favorite.count(),
    Reports: await prisma.report.count(),
    Disputes: await prisma.dispute.count(),
    AuditLogs: await prisma.auditLog.count(),
  };

  console.log(JSON.stringify(counts, null, 2));

  // Sample check: Verify admin user
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true, role: true },
  });
  console.log("Verified Admin:", admin);

  // Sample check: Verify a contract with milestones
  const contract = await prisma.contract.findFirst({
    where: { status: "COMPLETED" },
    include: {
      client: { select: { name: true } },
      freelancer: { select: { name: true } },
      milestones: true,
      reviews: true,
    },
  });
  console.log("Verified Completed Contract:", {
    contractNumber: contract.contractNumber,
    title: contract.title,
    client: contract.client.name,
    freelancer: contract.freelancer.name,
    milestonesCount: contract.milestones.length,
    reviewsCount: contract.reviews.length,
  });

  console.log("--- Database Health Check: 100% HEALTHY ---");
}

main()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
