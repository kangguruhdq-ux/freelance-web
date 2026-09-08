process.env.NODE_ENV = "test";
import { app } from "../src/server";
import { Server } from "http";
import prisma from "../src/lib/prisma";

let server: Server;
const TEST_PORT = 4997;
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
  console.log("🧪 RUNNING FREELANCEHUB CHECKPOINT 5 TEST SUITE");
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
  let client1ContractId = "";
  let client2ContractId = "";
  let milestoneId = "";

  const emailsToClean: string[] = [];

  try {
    async function registerUser(name: string, role: "CLIENT" | "FREELANCER") {
      const email = `c5-${role.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.dev`;
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
      assert(res.status === 201, `Failed to register ${role}: ${JSON.stringify(data)}`);
      return { token: data.token as string, user: data.user };
    }

    const c1 = await registerUser("Contract Client 1", "CLIENT");
    const c2 = await registerUser("Contract Client 2", "CLIENT");
    const f1 = await registerUser("Contract Freelancer 1", "FREELANCER");
    const f2 = await registerUser("Contract Freelancer 2", "FREELANCER");

    client1Token = c1.token;
    client2Token = c2.token;
    freelancer1Token = f1.token;
    freelancer2Token = f2.token;

    // Client 1 posts job
    const jobRes1 = await fetch(`${BASE_URL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${client1Token}`,
      },
      body: JSON.stringify({
        title: `Workspace Contract Project ${Date.now()}`,
        description: "Need a high-performance backend architecture with Postgres and Express.",
        categoryId,
        budget: 5000,
      }),
    });
    const jobData1 = await getJson(jobRes1);
    const jobId1 = jobData1.job.id;

    // Freelancer 1 submits proposal
    const propRes1 = await fetch(`${BASE_URL}/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${freelancer1Token}`,
      },
      body: JSON.stringify({
        jobId: jobId1,
        coverLetter: "I will implement the complete modular architecture with milestone precision.",
        bidAmount: 4800,
        estimatedDays: 14,
      }),
    });
    const propData1 = await getJson(propRes1);
    const proposalId1 = propData1.proposal.id;

    // Client 2 posts job and Freelancer 2 submits proposal
    const jobRes2 = await fetch(`${BASE_URL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${client2Token}`,
      },
      body: JSON.stringify({
        title: `Client 2 Contract Project ${Date.now()}`,
        description: "Independent project for testing participant boundaries.",
        categoryId,
        budget: 3000,
      }),
    });
    const jobData2 = await getJson(jobRes2);
    const jobId2 = jobData2.job.id;

    const propRes2 = await fetch(`${BASE_URL}/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${freelancer2Token}`,
      },
      body: JSON.stringify({
        jobId: jobId2,
        coverLetter: "Freelancer 2 cover letter for separate project workspace.",
        bidAmount: 2900,
        estimatedDays: 10,
      }),
    });
    const propData2 = await getJson(propRes2);
    const proposalId2 = propData2.proposal.id;

    // Test 1: Client 1 creates contract from accepted proposal
    await test("1. CLIENT creates contract from accepted proposal (201 Created)", async () => {
      const res = await fetch(`${BASE_URL}/contracts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${client1Token}`,
        },
        body: JSON.stringify({
          proposalId: proposalId1,
          title: "Full Architecture Contract",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      assert(body.success === true, "Expected success: true");
      assert(body.contract.status === "ACTIVE", "Contract must be ACTIVE");
      assert(body.contract.totalAmount === 4800, `Expected totalAmount 4800, got ${body.contract.totalAmount}`);
      client1ContractId = body.contract.id;
    });

    // Client 2 also creates contract 2
    const resC2 = await fetch(`${BASE_URL}/contracts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${client2Token}`,
      },
      body: JSON.stringify({
        proposalId: proposalId2,
        title: "Client 2 Workspace Contract",
      }),
    });
    const bodyC2 = await getJson(resC2);
    client2ContractId = bodyC2.contract.id;

    // Test 2: Freelancer 1 sees contract in their contracts list
    await test("2. FREELANCER sees their contract in contracts list (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/contracts`, {
        headers: {
          Authorization: `Bearer ${freelancer1Token}`,
        },
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(Array.isArray(body.data), "Expected data array");
      const found = body.data.some((c: any) => c.id === client1ContractId);
      assert(found, "Freelancer 1 must see contract 1");
    });

    // Test 3: Client 1 cannot access Client 2's contract
    await test("3. Client A cannot access Client B's contract workspace (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${client2ContractId}`, {
        headers: {
          Authorization: `Bearer ${client1Token}`,
        },
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.error.includes("Forbidden"), "Expected Forbidden response");
    });

    // Test 4: Freelancer 1 cannot access Freelancer 2's contract
    await test("4. Freelancer A cannot access Freelancer B's contract workspace (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${client2ContractId}`, {
        headers: {
          Authorization: `Bearer ${freelancer1Token}`,
        },
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.error.includes("Forbidden"), "Expected Forbidden response");
    });

    // Fetch contract 1 workspace to get initial milestone ID
    const wsRes = await fetch(`${BASE_URL}/contracts/${client1ContractId}`, {
      headers: {
        Authorization: `Bearer ${client1Token}`,
      },
    });
    const wsData = await getJson(wsRes);
    assert(wsData.contract.milestones.length > 0, "Initial milestone must exist");
    milestoneId = wsData.contract.milestones[0].id;

    // Test 5: Freelancer 1 submits deliverable on milestone
    await test("5. FREELANCER submits deliverable on contract milestone (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/milestones/${milestoneId}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${freelancer1Token}`,
        },
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.milestone.status === "SUBMITTED", "Milestone status must be SUBMITTED");
    });

    // Test 6: Client 1 approves milestone
    await test("6. CLIENT approves submitted milestone (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/milestones/${milestoneId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${client1Token}`,
        },
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.milestone.status === "APPROVED", "Milestone status must be APPROVED");
    });

    // Test 7: Non-participant (Freelancer 2) cannot view Contract 1 messages
    await test("7. Non-participant cannot view contract messages (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/contracts/${client1ContractId}/messages`, {
        headers: {
          Authorization: `Bearer ${freelancer2Token}`,
        },
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.error.includes("Forbidden"), "Expected Forbidden message");
    });

    // Test 8: Contract participants can send and receive messages in workspace
    await test("8. Contract participants can send and receive messages in workspace (201 Created & 200 OK)", async () => {
      // Freelancer 1 sends a message in contract 1 workspace
      const sendRes = await fetch(`${BASE_URL}/contracts/${client1ContractId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freelancer1Token}`,
        },
        body: JSON.stringify({
          content: "I have uploaded the initial deliverables and benchmark metrics for your review.",
        }),
      });

      const sendBody = await getJson(sendRes);
      assert(sendRes.status === 201, `Expected status 201, got ${sendRes.status}`);
      assert(sendBody.success === true, "Expected success: true");

      // Client 1 reads message history
      const getRes = await fetch(`${BASE_URL}/contracts/${client1ContractId}/messages`, {
        headers: {
          Authorization: `Bearer ${client1Token}`,
        },
      });

      const getBody = await getJson(getRes);
      assert(getRes.status === 200, `Expected status 200, got ${getRes.status}`);
      assert(Array.isArray(getBody.data) && getBody.data.length >= 2, "Must contain welcome message and freelancer message");
    });

    console.log(`\n🎉 ALL ${passedCount}/${totalCount} CHECKPOINT 5 TESTS PASSED PERFECTLY!\n`);
  } finally {
    // Clean up created test data with proper FK order
    if (emailsToClean.length > 0) {
      const testUsers = await prisma.user.findMany({
        where: { email: { in: emailsToClean } },
        select: { id: true },
      });
      const userIds = testUsers.map((u) => u.id);

      // Delete messages, conversations, milestones, contracts, proposals, jobs, users
      const contracts = await prisma.contract.findMany({
        where: { OR: [{ clientId: { in: userIds } }, { freelancerId: { in: userIds } }] },
        select: { id: true },
      });
      const contractIds = contracts.map((c) => c.id);

      await prisma.milestone.deleteMany({
        where: { contractId: { in: contractIds } },
      });
      await prisma.contract.deleteMany({
        where: { id: { in: contractIds } },
      });
      await prisma.proposal.deleteMany({
        where: { freelancerId: { in: userIds } },
      });
      await prisma.job.deleteMany({
        where: { clientId: { in: userIds } },
      });
      await prisma.message.deleteMany({
        where: { senderId: { in: userIds } },
      });
      await prisma.conversationParticipant.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
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
