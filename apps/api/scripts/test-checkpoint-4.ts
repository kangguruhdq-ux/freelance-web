process.env.NODE_ENV = "test";
import { app } from "../src/server";
import { Server } from "http";
import prisma from "../src/lib/prisma";

let server: Server;
const TEST_PORT = 4998;
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
  console.log("🧪 RUNNING FREELANCEHUB CHECKPOINT 4 TEST SUITE");
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

  // Get a valid category from seed
  const sampleCategory = await prisma.category.findFirst({ select: { id: true } });
  if (!sampleCategory) throw new Error("No category found in database for testing");
  const categoryId = sampleCategory.id;

  // Track created test data
  const testRunId = Date.now();
  let client1Token = "";
  let client2Token = "";
  let freelancer1Token = "";
  let freelancer2Token = "";
  let client1JobId = "";
  let client2JobId = "";
  let freelancer1ProposalId = "";

  const emailsToClean: string[] = [];

  try {
    // Helper to register test users
    async function registerUser(name: string, role: "CLIENT" | "FREELANCER") {
      const email = `test-${role.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.dev`;
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

    const c1 = await registerUser("Marketplace Client A", "CLIENT");
    const c2 = await registerUser("Marketplace Client B", "CLIENT");
    const f1 = await registerUser("Marketplace Freelancer X", "FREELANCER");
    const f2 = await registerUser("Marketplace Freelancer Y", "FREELANCER");

    client1Token = c1.token;
    client2Token = c2.token;
    freelancer1Token = f1.token;
    freelancer2Token = f2.token;

    // Test 1: CLIENT creates own job
    await test("1. CLIENT can create a new job posting (201 Created)", async () => {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${client1Token}`,
        },
        body: JSON.stringify({
          title: `Full-Stack Next.js Project ${testRunId}`,
          description: "We are seeking a senior full-stack developer to build a modern responsive web app.",
          categoryId,
          budget: 3500,
          budgetType: "FIXED",
          experienceLevel: "EXPERT",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      assert(body.success === true, "Expected success: true");
      assert(typeof body.job.id === "string", "Job ID must be returned");
      client1JobId = body.job.id;
    });

    // Client B also creates a job
    const resB = await fetch(`${BASE_URL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${client2Token}`,
      },
      body: JSON.stringify({
        title: `Client B iOS App ${testRunId}`,
        description: "Need an experienced mobile developer for React Native / iOS architecture.",
        categoryId,
        budget: 4500,
      }),
    });
    const bodyB = await getJson(resB);
    client2JobId = bodyB.job.id;

    // Test 2: FREELANCER attempting to create job is blocked
    await test("2. FREELANCER attempting to create a job is blocked (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freelancer1Token}`,
        },
        body: JSON.stringify({
          title: "Unauthorized Job by Freelancer",
          description: "This should be denied by RBAC middleware.",
          categoryId,
          budget: 1000,
        }),
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.success === false, "Expected success: false");
    });

    // Test 3: CLIENT A attempting to edit CLIENT B's job is blocked
    await test("3. CLIENT cannot modify another client's job (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/jobs/${client2JobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${client1Token}`,
        },
        body: JSON.stringify({
          title: "Maliciously Edited Title",
          budget: 10,
        }),
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.error.includes("permission"), "Expected permission denial message");
    });

    // Test 4: CLIENT A edits own job
    await test("4. CLIENT can edit their own job (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/jobs/${client1JobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${client1Token}`,
        },
        body: JSON.stringify({
          title: `Updated Title ${testRunId}`,
          budget: 4000,
        }),
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.job.budget === 4000, `Expected budget 4000, got ${body.job.budget}`);
    });

    // Test 5: FREELANCER submits proposal on OPEN job
    await test("5. FREELANCER can submit proposal on OPEN job (201 Created)", async () => {
      const res = await fetch(`${BASE_URL}/proposals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freelancer1Token}`,
        },
        body: JSON.stringify({
          jobId: client1JobId,
          coverLetter: "I have 7 years of full-stack engineering experience and built high-performance SaaS.",
          bidAmount: 3800,
          estimatedDays: 14,
        }),
      });

      const body = await getJson(res);
      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      assert(body.proposal.status === "PENDING", "Proposal status must be PENDING");
      freelancer1ProposalId = body.proposal.id;
    });

    // Test 6: Duplicate proposal by same freelancer rejected
    await test("6. Duplicate proposal submission by same freelancer is rejected (409 Conflict)", async () => {
      const res = await fetch(`${BASE_URL}/proposals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freelancer1Token}`,
        },
        body: JSON.stringify({
          jobId: client1JobId,
          coverLetter: "Trying to submit duplicate proposal to spam the client.",
          bidAmount: 3500,
          estimatedDays: 10,
        }),
      });

      const body = await getJson(res);
      assert(res.status === 409, `Expected status 409, got ${res.status}`);
      assert(body.error.includes("already submitted a proposal"), "Expected duplicate proposal error");
    });

    // Test 7: FREELANCER Y cannot edit FREELANCER X's proposal
    await test("7. FREELANCER cannot modify another freelancer's proposal (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/proposals/${freelancer1ProposalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freelancer2Token}`,
        },
        body: JSON.stringify({
          bidAmount: 99999,
          coverLetter: "Tampered cover letter by rival freelancer.",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.error.includes("cannot modify another freelancer's proposal"), "Expected ownership error");
    });

    // Test 8: CLIENT A can view proposals on own job
    await test("8. CLIENT can view proposals for their own job (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/jobs/${client1JobId}/proposals`, {
        headers: {
          Authorization: `Bearer ${client1Token}`,
        },
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(Array.isArray(body.data) && body.data.length >= 1, "Must return at least 1 proposal");
      assert(body.data[0].id === freelancer1ProposalId, "Should include freelancer 1's proposal");
    });

    // Test 9: CLIENT B cannot view proposals on CLIENT A's job
    await test("9. CLIENT cannot view proposals for another client's job (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/jobs/${client1JobId}/proposals`, {
        headers: {
          Authorization: `Bearer ${client2Token}`,
        },
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.error.includes("Forbidden"), "Expected Forbidden message");
    });

    // Test 10: FREELANCER withdraws own proposal
    await test("10. FREELANCER can withdraw their own pending proposal (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/proposals/${freelancer1ProposalId}/withdraw`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${freelancer1Token}`,
        },
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.status === "WITHDRAWN", "Proposal status must be WITHDRAWN");
    });

    console.log(`\n🎉 ALL ${passedCount}/${totalCount} CHECKPOINT 4 TESTS PASSED PERFECTLY!\n`);
  } finally {
    // Cleanup created test data with proper FK order
    if (emailsToClean.length > 0) {
      const testUsers = await prisma.user.findMany({
        where: { email: { in: emailsToClean } },
        select: { id: true },
      });
      const userIds = testUsers.map((u) => u.id);

      await prisma.proposal.deleteMany({
        where: { freelancerId: { in: userIds } },
      });
      await prisma.job.deleteMany({
        where: { clientId: { in: userIds } },
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
