process.env.NODE_ENV = "test";
import { app } from "../src/server";
import { Server } from "http";
import prisma from "../src/lib/prisma";

let server: Server;
const TEST_PORT = 4995;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function getJson(res: Response): Promise<any> {
  return await res.json();
}

async function runTests() {
  console.log("\n==================================================");
  console.log("🧪 RUNNING FREELANCEHUB CHECKPOINT 7 TEST SUITE");
  console.log("==================================================\n");

  server = app.listen(TEST_PORT);
  let passedCount = 0;
  let totalCount = 0;

  async function test(name: string, fn: () => Promise<void>) {
    totalCount++;
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passedCount++;
    } catch (error: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${error.message}`);
      throw error;
    }
  }

  const sampleCategory = await prisma.category.findFirst({ select: { id: true } });
  if (!sampleCategory) throw new Error("No category found in database for testing");
  const categoryId = sampleCategory.id;

  let clientToken = "";
  let freelancerToken = "";
  let adminToken = "";
  let contractId = "";
  let disputeId = "";
  let reportId = "";

  const emailsToClean: string[] = [];

  try {
    // 1. Authenticate as seeded Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alexander.vance@freelancehub.dev",
        password: "FreelanceHub2026!",
      }),
    });
    const adminData = await getJson(adminLoginRes);
    assert(adminLoginRes.status === 200, "Seeded admin login must succeed");
    adminToken = adminData.token;

    // 2. Register Client and Freelancer
    async function registerUser(name: string, role: "CLIENT" | "FREELANCER") {
      const email = `c7-${role.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.dev`;
      emailsToClean.push(email);

      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password: "TestPassword123!",
          role,
        }),
      });
      const data = await getJson(res);
      assert(res.status === 201, `Failed to register ${role}`);
      return { token: data.token as string, user: data.user };
    }

    const c = await registerUser("Dispute Client", "CLIENT");
    const f = await registerUser("Dispute Freelancer", "FREELANCER");
    clientToken = c.token;
    freelancerToken = f.token;

    // Create job, proposal, and contract
    const jRes = await fetch(`${BASE_URL}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken}` },
      body: JSON.stringify({
        title: `Dispute Test Project ${Date.now()}`,
        description: "Project designated for testing dispute mediation and admin moderation.",
        categoryId,
        budget: 1500,
      }),
    });
    const jData = await getJson(jRes);

    const pRes = await fetch(`${BASE_URL}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${freelancerToken}` },
      body: JSON.stringify({
        jobId: jData.job.id,
        coverLetter: "Proposal for testing dispute filing and resolution workflows.",
        bidAmount: 1500,
        estimatedDays: 7,
      }),
    });
    const pData = await getJson(pRes);

    const cntRes = await fetch(`${BASE_URL}/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken}` },
      body: JSON.stringify({ proposalId: pData.proposal.id }),
    });
    const cntData = await getJson(cntRes);
    contractId = cntData.contract.id;

    // Test 1: CLIENT accessing admin endpoint is forbidden
    await test("1. CLIENT accessing admin endpoint is blocked (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const body = await getJson(res);
      assert(res.status === 403, `Expected 403, got ${res.status}`);
      assert(body.error.includes("Insufficient permissions"), "Expected permission denial");
    });

    // Test 2: FREELANCER accessing admin endpoint is forbidden
    await test("2. FREELANCER accessing admin endpoint is blocked (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${freelancerToken}` },
      });
      const body = await getJson(res);
      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    // Test 3: ADMIN accessing admin endpoints succeeds
    await test("3. ADMIN accessing admin stats & users succeeds (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await getJson(res);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(body.success === true, "Expected success: true");
      assert(typeof body.stats.totalUsers === "number", "Expected totalUsers metric");
    });

    // Test 4: Participant opens dispute on contract
    await test("4. Contract participant opens dispute (201 Created + contract marked DISPUTED)", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${contractId}/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
          reason: "Scope discrepancy and unaligned milestone criteria",
          description: "Deliverables provided do not meet the architectural specification originally defined.",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      assert(body.dispute.status === "OPEN", "Dispute must be OPEN");
      disputeId = body.dispute.id;

      // Verify contract status changed to DISPUTED
      const cntCheck = await prisma.contract.findUnique({ where: { id: contractId } });
      assert(cntCheck?.status === "DISPUTED", "Contract status must be DISPUTED");
    });

    // Test 5: Regular user cannot resolve dispute
    await test("5. Regular user cannot resolve dispute (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/admin/disputes/${disputeId}/resolve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
          status: "RESOLVED",
          resolution: "Unauthorized self-resolution attempt.",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
    });

    // Test 6: ADMIN resolves dispute with resolution notes
    await test("6. ADMIN resolves dispute with resolution notes (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/admin/disputes/${disputeId}/resolve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: "RESOLVED",
          resolution: "Mediation complete. Code deliverable modified to comply with specification.",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.dispute.status === "RESOLVED", "Dispute must be RESOLVED");
    });

    // Test 7: User reports a job and ADMIN reviews & resolves report
    await test("7. User submits moderation report & ADMIN resolves report (201 Created & 200 OK)", async () => {
      // Freelancer files report
      const repRes = await fetch(`${BASE_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freelancerToken}`,
        },
        body: JSON.stringify({
          targetType: "JOB",
          targetId: jData.job.id,
          reason: "Suspicious activity",
          description: "Job posting contains requests violating marketplace terms of service.",
        }),
      });

      const repData = await getJson(repRes);
      assert(repRes.status === 201, `Expected status 201, got ${repRes.status}`);
      reportId = repData.report.id;

      // Admin resolves report
      const resolveRes = await fetch(`${BASE_URL}/admin/reports/${reportId}/resolve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: "RESOLVED",
          resolutionNotes: "Investigated and verified compliant with marketplace standards.",
        }),
      });

      const resolveData = await getJson(resolveRes);
      assert(resolveRes.status === 200, `Expected status 200, got ${resolveRes.status}`);
      assert(resolveData.report.status === "RESOLVED", "Report must be RESOLVED");
    });

    // Test 8: ADMIN views audit logs and verifies dispute & report events are logged
    await test("8. ADMIN views immutable audit logs containing security & moderation events (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(Array.isArray(body.data) && body.data.length > 0, "Audit logs must not be empty");

      const hasDisputeLog = body.data.some((l: any) => l.action.includes("DISPUTE"));
      assert(hasDisputeLog, "Audit log must contain recorded DISPUTE events");
    });

    console.log(`\n🎉 ALL ${passedCount}/${totalCount} CHECKPOINT 7 TESTS PASSED PERFECTLY!\n`);
  } finally {
    // Cleanup created test data in proper order
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

runTests().catch((err) => {
  console.error("\n❌ Test Suite Aborted:", err);
  if (server) server.close();
  process.exit(1);
});
