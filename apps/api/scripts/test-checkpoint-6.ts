process.env.NODE_ENV = "test";
import { app } from "../src/server";
import { Server } from "http";
import prisma from "../src/lib/prisma";

let server: Server;
const TEST_PORT = 4996;
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
  console.log("🧪 RUNNING FREELANCEHUB CHECKPOINT 6 TEST SUITE");
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

  let client1Token = "";
  let client2Token = "";
  let freelancer1Token = "";
  let freelancer2Token = "";
  let contract1Id = "";
  let contract2Id = "";
  let milestone1Id = "";
  let milestone2Id = "";

  const emailsToClean: string[] = [];

  try {
    async function registerUser(name: string, role: "CLIENT" | "FREELANCER") {
      const email = `c6-${role.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.dev`;
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

    const c1 = await registerUser("Payment Client 1", "CLIENT");
    const c2 = await registerUser("Payment Client 2", "CLIENT");
    const f1 = await registerUser("Payment Freelancer 1", "FREELANCER");
    const f2 = await registerUser("Payment Freelancer 2", "FREELANCER");

    client1Token = c1.token;
    client2Token = c2.token;
    freelancer1Token = f1.token;
    freelancer2Token = f2.token;

    // Client 1 posts job & Freelancer 1 proposes
    const j1Res = await fetch(`${BASE_URL}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${client1Token}` },
      body: JSON.stringify({
        title: `Payment Testing Job ${Date.now()}`,
        description: "Comprehensive testing of escrow collateral and platform fee splits.",
        categoryId,
        budget: 2000,
      }),
    });
    const j1Data = await getJson(j1Res);

    const p1Res = await fetch(`${BASE_URL}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${freelancer1Token}` },
      body: JSON.stringify({
        jobId: j1Data.job.id,
        coverLetter: "Experienced fintech developer proposing full contract execution.",
        bidAmount: 2000,
        estimatedDays: 7,
      }),
    });
    const p1Data = await getJson(p1Res);

    // Client 1 creates contract
    const cnt1Res = await fetch(`${BASE_URL}/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${client1Token}` },
      body: JSON.stringify({ proposalId: p1Data.proposal.id }),
    });
    const cnt1Data = await getJson(cnt1Res);
    contract1Id = cnt1Data.contract.id;

    // Get milestone 1
    const ws1Res = await fetch(`${BASE_URL}/contracts/${contract1Id}`, {
      headers: { Authorization: `Bearer ${client1Token}` },
    });
    const ws1Data = await getJson(ws1Res);
    milestone1Id = ws1Data.contract.milestones[0].id;

    // Client 2 creates contract 2 for isolation testing
    const j2Res = await fetch(`${BASE_URL}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${client2Token}` },
      body: JSON.stringify({
        title: `Client 2 Isolated Job ${Date.now()}`,
        description: "Project for cross-client authorization testing.",
        categoryId,
        budget: 1000,
      }),
    });
    const j2Data = await getJson(j2Res);

    const p2Res = await fetch(`${BASE_URL}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${freelancer2Token}` },
      body: JSON.stringify({
        jobId: j2Data.job.id,
        coverLetter: "Cover letter for isolated contract testing.",
        bidAmount: 1000,
        estimatedDays: 5,
      }),
    });
    const p2Data = await getJson(p2Res);

    const cnt2Res = await fetch(`${BASE_URL}/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${client2Token}` },
      body: JSON.stringify({ proposalId: p2Data.proposal.id }),
    });
    const cnt2Data = await getJson(cnt2Res);
    contract2Id = cnt2Data.contract.id;

    const ws2Res = await fetch(`${BASE_URL}/contracts/${contract2Id}`, {
      headers: { Authorization: `Bearer ${client2Token}` },
    });
    const ws2Data = await getJson(ws2Res);
    milestone2Id = ws2Data.contract.milestones[0].id;

    // Test 1: Client 1 funds milestone into escrow
    await test("1. Client 1 funds milestone into escrow (200 OK + ESCROW_HOLD created)", async () => {
      const res = await fetch(`${BASE_URL}/payments/milestones/${milestone1Id}/fund`, {
        method: "POST",
        headers: { Authorization: `Bearer ${client1Token}` },
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.success === true, "Expected success: true");
      assert(body.transaction.type === "ESCROW_HOLD", "Transaction type must be ESCROW_HOLD");
      assert(body.escrowBalance === 2000, `Expected escrow balance 2000, got ${body.escrowBalance}`);
    });

    // Test 2: Client 2 cannot fund or release Client 1's milestone
    await test("2. Client 2 cannot fund or release Client 1's milestone (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/payments/milestones/${milestone1Id}/release`, {
        method: "POST",
        headers: { Authorization: `Bearer ${client2Token}` },
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.error.includes("Forbidden"), "Expected Forbidden message");
    });

    // Test 3: Review before contract is COMPLETED is rejected
    await test("3. Review submitted before contract is COMPLETED is rejected (400 Bad Request)", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${contract1Id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${client1Token}`,
        },
        body: JSON.stringify({
          rating: 5,
          comment: "Attempting to review early before deliverables are completed.",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 400, `Expected status 400, got ${res.status}`);
      assert(body.error.includes("COMPLETED"), "Expected error requiring COMPLETED status");
    });

    // Test 4: Client 1 releases payment to Freelancer 1
    await test("4. Client 1 releases payment with verified 10% platform fee calculation (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/payments/milestones/${milestone1Id}/release`, {
        method: "POST",
        headers: { Authorization: `Bearer ${client1Token}` },
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.success === true, "Expected success: true");
      assert(body.breakdown.grossAmount === 2000, "Gross amount must be 2000");
      assert(body.breakdown.platformFee === 200, `Expected 10% fee (200), got ${body.breakdown.platformFee}`);
      assert(body.breakdown.netFreelancerAmount === 1800, `Expected net 1800, got ${body.breakdown.netFreelancerAmount}`);
      assert(body.breakdown.escrowRemaining === 0, "Remaining escrow must be 0");
    });

    // Verify contract 1 is now COMPLETED
    const checkCnt1 = await prisma.contract.findUnique({ where: { id: contract1Id } });
    assert(checkCnt1?.status === "COMPLETED", "Contract must automatically transition to COMPLETED");

    // Test 5: Review with invalid rating rejected
    await test("5. Review with invalid rating (e.g. 6 or -1) is rejected (400 Bad Request)", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${contract1Id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${client1Token}`,
        },
        body: JSON.stringify({
          rating: 6,
          comment: "Invalid rating out of bounds.",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 400, `Expected status 400, got ${res.status}`);
    });

    // Test 6: Client 1 reviews Freelancer 1 on completed contract
    await test("6. Client reviews Freelancer on completed contract (201 Created)", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${contract1Id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${client1Token}`,
        },
        body: JSON.stringify({
          rating: 5,
          comment: "Outstanding architectural precision, proactive communication, and on-time milestone deliverables.",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      assert(body.review.rating === 5, "Rating must be 5");
    });

    // Test 7: Duplicate review by same user on same contract is rejected
    await test("7. Duplicate review by same user on same contract is rejected (409 Conflict)", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${contract1Id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${client1Token}`,
        },
        body: JSON.stringify({
          rating: 5,
          comment: "Attempting to submit a second review to inflate rating.",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 409, `Expected status 409, got ${res.status}`);
      assert(body.error.includes("already submitted a review"), "Expected duplicate review error");
    });

    // Test 8: Non-participant (Client 2) cannot review Contract 1
    await test("8. Non-participant cannot review contract (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${contract1Id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${client2Token}`,
        },
        body: JSON.stringify({
          rating: 1,
          comment: "Malicious review from competitor client.",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.error.includes("Forbidden"), "Expected Forbidden message");
    });

    console.log(`\n🎉 ALL ${passedCount}/${totalCount} CHECKPOINT 6 TESTS PASSED PERFECTLY!\n`);
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

      await prisma.review.deleteMany({ where: { contractId: { in: contractIds } } });
      await prisma.transaction.deleteMany({ where: { contractId: { in: contractIds } } });
      await prisma.milestone.deleteMany({ where: { contractId: { in: contractIds } } });
      await prisma.contract.deleteMany({ where: { id: { in: contractIds } } });
      await prisma.proposal.deleteMany({ where: { freelancerId: { in: userIds } } });
      await prisma.job.deleteMany({ where: { clientId: { in: userIds } } });
      await prisma.message.deleteMany({ where: { senderId: { in: userIds } } });
      await prisma.conversationParticipant.deleteMany({ where: { userId: { in: userIds } } });
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
