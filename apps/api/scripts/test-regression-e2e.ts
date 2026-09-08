process.env.NODE_ENV = "test";
import { app } from "../src/server";
import { Server } from "http";
import prisma from "../src/lib/prisma";

let server: Server;
const TEST_PORT = 4994;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function getJson(res: Response): Promise<any> {
  return await res.json();
}

async function runRegressionSuite() {
  console.log("\n============================================================");
  console.log("🏆 FREELANCEHUB MASTER E2E REGRESSION TEST SUITE (CHECKPOINT 8)");
  console.log("============================================================\n");

  server = app.listen(TEST_PORT);
  let passedCount = 0;
  let totalCount = 0;

  async function test(name: string, fn: () => Promise<void>) {
    totalCount++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passedCount++;
    } catch (error: any) {
      console.error(`❌ [FAIL] ${name}`);
      console.error(`   Details: ${error.message}`);
      throw error;
    }
  }

  const sampleCategory = await prisma.category.findFirst({ select: { id: true } });
  if (!sampleCategory) throw new Error("No category found in database for regression testing");
  const categoryId = sampleCategory.id;

  let clientToken = "";
  let clientId = "";
  let freelancerToken = "";
  let freelancerId = "";
  let adminToken = "";
  let jobId = "";
  let proposalId = "";
  let contractId = "";
  let milestoneId = "";

  const emailsToClean: string[] = [];

  try {
    // -------------------------------------------------------------
    // PHASE 1: AUTHENTICATION, PASSWORD HASHING & RBAC
    // -------------------------------------------------------------
    console.log("--- PHASE 1: AUTH & TOKEN SECURITY ---");

    await test("1.1 Seeded Admin login succeeds with JWT and sanitized user payload", async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "alexander.vance@freelancehub.dev",
          password: "FreelanceHub2026!",
        }),
      });
      const data = await getJson(res);
      assert(res.status === 200, "Admin login must return 200");
      assert(data.success === true, "Admin login success must be true");
      assert(data.user.role === "ADMIN", "Role must be ADMIN");
      assert(data.user.passwordHash === undefined, "Password hash must NEVER be exposed");
      assert(typeof data.token === "string" && data.token.length > 20, "Valid JWT must be returned");
      adminToken = data.token;
    });

    await test("1.2 Register Client & Freelancer with strict password validation", async () => {
      const clientEmail = `e2e-client-${Date.now()}@test.dev`;
      const freelancerEmail = `e2e-freelancer-${Date.now()}@test.dev`;
      emailsToClean.push(clientEmail, freelancerEmail);

      // Client registration
      const cRes = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "E2E Enterprise Client",
          email: clientEmail,
          password: "SecurePassword2026!",
          role: "CLIENT",
        }),
      });
      const cData = await getJson(cRes);
      assert(cRes.status === 201, `Client registration failed: ${JSON.stringify(cData)}`);
      clientToken = cData.token;
      clientId = cData.user.id;

      // Freelancer registration
      const fRes = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "E2E Senior Specialist",
          email: freelancerEmail,
          password: "SecurePassword2026!",
          role: "FREELANCER",
        }),
      });
      const fData = await getJson(fRes);
      assert(fRes.status === 201, `Freelancer registration failed: ${JSON.stringify(fData)}`);
      freelancerToken = fData.token;
      freelancerId = fData.user.id;
    });

    await test("1.3 Malformed or tampered JWT is rejected with 401 Unauthorized", async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: "Bearer malformed.tampered.token123" },
      });
      assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test("1.4 Non-admin users strictly blocked from accessing Admin console", async () => {
      const cRes = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert(cRes.status === 403, `Client must be blocked: ${cRes.status}`);

      const fRes = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${freelancerToken}` },
      });
      assert(fRes.status === 403, `Freelancer must be blocked: ${fRes.status}`);
    });

    // -------------------------------------------------------------
    // PHASE 2: CORE MARKETPLACE & PROPOSALS
    // -------------------------------------------------------------
    console.log("\n--- PHASE 2: CORE MARKETPLACE ---");

    await test("2.1 Client creates a new verified project", async () => {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken}` },
        body: JSON.stringify({
          title: `E2E High-Performance Core Architecture ${Date.now()}`,
          description: "Seeking a senior architect to build scalable microservices and database infrastructure.",
          categoryId,
          budget: 5000,
          budgetType: "FIXED",
          experienceLevel: "EXPERT",
        }),
      });
      const data = await getJson(res);
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      jobId = data.job.id;
    });

    await test("2.2 Freelancer is blocked from posting jobs (RBAC constraint)", async () => {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${freelancerToken}` },
        body: JSON.stringify({
          title: "Unauthorized Freelancer Job",
          description: "Freelancers are not permitted to post marketplace projects.",
          categoryId,
          budget: 2000,
        }),
      });
      assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    });

    await test("2.3 Public marketplace search and filter queries return structured job data", async () => {
      const res = await fetch(`${BASE_URL}/jobs?search=Architecture&status=OPEN`);
      const data = await getJson(res);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(Array.isArray(data.data), "Jobs data must be array");
      assert(data.data.length > 0, "Should match created project");
    });

    await test("2.4 Freelancer submits proposal with cover letter and bid", async () => {
      const res = await fetch(`${BASE_URL}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${freelancerToken}` },
        body: JSON.stringify({
          jobId,
          coverLetter: "10 years experience building distributed backend systems. Let's execute this with milestone escrow.",
          bidAmount: 4800,
          estimatedDays: 14,
        }),
      });
      const data = await getJson(res);
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(data.proposal.status === "PENDING", "Proposal status must be PENDING");
      proposalId = data.proposal.id;
    });

    await test("2.5 Duplicate proposal submission by same freelancer is rejected (409)", async () => {
      const res = await fetch(`${BASE_URL}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${freelancerToken}` },
        body: JSON.stringify({
          jobId,
          coverLetter: "Second spam proposal attempt.",
          bidAmount: 4000,
          estimatedDays: 10,
        }),
      });
      assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    });

    // -------------------------------------------------------------
    // PHASE 3: CONTRACTS, WORKSPACE & MESSAGING
    // -------------------------------------------------------------
    console.log("\n--- PHASE 3: CONTRACTS & PROJECT WORKSPACE ---");

    await test("3.1 Client accepts proposal and initializes Project Workspace", async () => {
      const res = await fetch(`${BASE_URL}/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken}` },
        body: JSON.stringify({
          proposalId,
          title: "Master E2E Architecture Contract",
        }),
      });
      const data = await getJson(res);
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(data.contract.status === "ACTIVE", "Contract must be ACTIVE");
      assert(data.contract.totalAmount === 4800, "Agreed amount must match proposal bid (4800)");
      contractId = data.contract.id;

      // Extract milestone
      const wsRes = await fetch(`${BASE_URL}/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const wsData = await getJson(wsRes);
      milestoneId = wsData.contract.milestones[0].id;
    });

    await test("3.2 Non-participants strictly forbidden from accessing Project Workspace", async () => {
      const otherUser = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Intruder User",
          email: `intruder-${Date.now()}@test.dev`,
          password: "SecurePassword2026!",
          role: "CLIENT",
        }),
      });
      const otherData = await getJson(otherUser);
      emailsToClean.push(otherData.user.email);

      const res = await fetch(`${BASE_URL}/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${otherData.token}` },
      });
      assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    });

    await test("3.3 Participants exchange messages within secure workspace conversation", async () => {
      // Freelancer sends message
      const sendRes = await fetch(`${BASE_URL}/contracts/${contractId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${freelancerToken}` },
        body: JSON.stringify({ content: "Milestone 1 environment is established and ready for review." }),
      });
      assert(sendRes.status === 201, "Message must be sent");

      // Client reads message history
      const listRes = await fetch(`${BASE_URL}/contracts/${contractId}/messages`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const listData = await getJson(listRes);
      assert(listRes.status === 200, "Message history must return 200");
      assert(listData.data.some((m: any) => m.content.includes("Milestone 1 environment")), "Sent message must be in history");
    });

    // -------------------------------------------------------------
    // PHASE 4: ESCROW FUNDING, RELEASE & PLATFORM FEES
    // -------------------------------------------------------------
    console.log("\n--- PHASE 4: PAYMENTS & ESCROW ---");

    await test("4.1 Client funds milestone into Escrow (ESCROW_HOLD created)", async () => {
      const res = await fetch(`${BASE_URL}/payments/milestones/${milestoneId}/fund`, {
        method: "POST",
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const data = await getJson(res);
      assert(res.status === 200, "Funding must succeed (200)");
      assert(data.transaction.type === "ESCROW_HOLD", "Transaction type must be ESCROW_HOLD");
      assert(data.escrowBalance === 4800, `Expected escrow balance 4800, got ${data.escrowBalance}`);
    });

    await test("4.2 Freelancer submits deliverable for milestone approval", async () => {
      const res = await fetch(`${BASE_URL}/milestones/${milestoneId}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${freelancerToken}` },
      });
      const data = await getJson(res);
      assert(res.status === 200, "Submit deliverable must return 200");
      assert(data.milestone.status === "SUBMITTED", "Milestone status must be SUBMITTED");
    });

    await test("4.3 Client releases payment: verifies 10% platform fee and 90% net transfer", async () => {
      const res = await fetch(`${BASE_URL}/payments/milestones/${milestoneId}/release`, {
        method: "POST",
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const data = await getJson(res);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(data.breakdown.grossAmount === 4800, "Gross amount must be 4800");
      assert(data.breakdown.platformFee === 480, `Expected 10% fee (480), got ${data.breakdown.platformFee}`);
      assert(data.breakdown.netFreelancerAmount === 4320, `Expected net 4320, got ${data.breakdown.netFreelancerAmount}`);
      assert(data.breakdown.escrowRemaining === 0, "Escrow balance should be 0");
    });

    await test("4.4 Contract automatically transitions to COMPLETED when all milestones released", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const data = await getJson(res);
      assert(data.contract.status === "COMPLETED", "Contract status must be COMPLETED");
    });

    // -------------------------------------------------------------
    // PHASE 5: TWO-WAY REVIEWS & REPUTATION SYSTEM
    // -------------------------------------------------------------
    console.log("\n--- PHASE 5: REVIEWS & REPUTATION ---");

    await test("5.1 Client reviews Freelancer on completed contract", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${contractId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken}` },
        body: JSON.stringify({
          rating: 5,
          comment: "Flawless architecture, prompt communication, and pristine code quality.",
        }),
      });
      const data = await getJson(res);
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(data.review.rating === 5, "Rating must be 5");
    });

    await test("5.2 Duplicate review submission is rejected (409 Conflict)", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${contractId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken}` },
        body: JSON.stringify({
          rating: 5,
          comment: "Duplicate review attempt.",
        }),
      });
      assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    });

    // -------------------------------------------------------------
    // PHASE 6: MODERATION, AUDIT LOGS & DISPUTE GOVERNANCE
    // -------------------------------------------------------------
    console.log("\n--- PHASE 6: GOVERNANCE & AUDIT TRAIL ---");

    await test("6.1 User files moderation report & Admin resolves report", async () => {
      const repRes = await fetch(`${BASE_URL}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken}` },
        body: JSON.stringify({
          targetType: "JOB",
          targetId: jobId,
          reason: "Quality assurance test report",
          description: "Routine verification of content moderation pipeline.",
        }),
      });
      const repData = await getJson(repRes);
      assert(repRes.status === 201, "Report must be created");

      const resolveRes = await fetch(`${BASE_URL}/admin/reports/${repData.report.id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: "RESOLVED", resolutionNotes: "Verified clean." }),
      });
      assert(resolveRes.status === 200, "Admin must resolve report");
    });

    await test("6.2 Platform audit logs record sensitive actions without credential leakage", async () => {
      const res = await fetch(`${BASE_URL}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await getJson(res);
      assert(res.status === 200, "Audit logs must return 200");
      assert(Array.isArray(data.data) && data.data.length > 0, "Audit logs must not be empty");

      // Verify no passwords or tokens in metadata
      const logsJson = JSON.stringify(data.data);
      assert(!logsJson.includes("passwordHash"), "No passwordHash may exist in audit trail");
      assert(!logsJson.includes("SecurePassword"), "No raw passwords may exist in audit trail");
    });

    console.log(`\n============================================================`);
    console.log(`🎉 ALL ${passedCount}/${totalCount} REGRESSION SCENARIOS PASSED WITH ZERO ERRORS!`);
    console.log(`============================================================\n`);
  } finally {
    // Comprehensive clean up
    if (emailsToClean.length > 0) {
      const testUsers = await prisma.user.findMany({
        where: { email: { in: emailsToClean } },
        select: { id: true },
      });
      const userIds = testUsers.map((u) => u.id);

      const contracts = await prisma.contract.findMany({
        where: { OR: [{ clientId: { in: userIds } }, { freelancerId: { in: userIds } }] },
        select: { id: true },
      });
      const contractIds = contracts.map((c) => c.id);

      await prisma.review.deleteMany({ where: { contractId: { in: contractIds } } });
      await prisma.transaction.deleteMany({ where: { contractId: { in: contractIds } } });
      await prisma.report.deleteMany({ where: { reporterId: { in: userIds } } });
      await prisma.dispute.deleteMany({ where: { contractId: { in: contractIds } } });
      await prisma.milestone.deleteMany({ where: { contractId: { in: contractIds } } });
      await prisma.contract.deleteMany({ where: { id: { in: contractIds } } });
      await prisma.proposal.deleteMany({ where: { freelancerId: { in: userIds } } });
      await prisma.job.deleteMany({ where: { clientId: { in: userIds } } });
      await prisma.message.deleteMany({ where: { senderId: { in: userIds } } });
      await prisma.conversationParticipant.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runRegressionSuite().catch((err) => {
  console.error("\n❌ Regression Suite Aborted:", err);
  if (server) server.close();
  process.exit(1);
});
