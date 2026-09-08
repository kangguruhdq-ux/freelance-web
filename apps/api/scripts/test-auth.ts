process.env.NODE_ENV = "test";
import { app } from "../src/server";
import { Server } from "http";
import prisma from "../src/lib/prisma";

let server: Server;
const TEST_PORT = 4999;
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
  console.log("\n==========================================");
  console.log("🧪 RUNNING FREELANCEHUB AUTH & RBAC TEST SUITE");
  console.log("==========================================\n");

  // Start temporary test server
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

  const testEmailPrefix = `test-${Date.now()}`;
  const clientEmail = `${testEmailPrefix}-client@example.com`;
  const freelancerEmail = `${testEmailPrefix}-freelancer@example.com`;
  let clientToken = "";
  let clientId = "";
  let freelancerToken = "";
  let freelancerId = "";
  let adminToken = "";

  try {
    // Test 1: Register CLIENT succeeds
    await test("1. Register CLIENT with valid data succeeds", async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Client",
          email: clientEmail,
          password: "SecurePassword123!",
          role: "CLIENT",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      assert(body.success === true, "Expected success: true");
      assert(body.user.role === "CLIENT", `Expected role CLIENT, got ${body.user.role}`);
      assert(body.user.passwordHash === undefined, "passwordHash must not be exposed");
      assert(typeof body.token === "string" && body.token.length > 0, "JWT token must be returned");

      clientToken = body.token;
      clientId = body.user.id;
    });

    // Test 2: Register FREELANCER succeeds
    await test("2. Register FREELANCER with valid data succeeds", async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Freelancer",
          email: freelancerEmail,
          password: "SecurePassword123!",
          role: "FREELANCER",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      assert(body.success === true, "Expected success: true");
      assert(body.user.role === "FREELANCER", `Expected role FREELANCER, got ${body.user.role}`);
      assert(body.user.passwordHash === undefined, "passwordHash must not be exposed");

      freelancerToken = body.token;
      freelancerId = body.user.id;
    });

    // Test 3: Register ADMIN rejected
    await test("3. Public registration as ADMIN is forbidden", async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Malicious Admin",
          email: `fake-admin-${Date.now()}@example.com`,
          password: "SecurePassword123!",
          role: "ADMIN",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 400, `Expected status 400, got ${res.status}`);
      assert(body.success === false, "Expected success: false");
      assert(body.error.includes("ADMIN registration is forbidden"), "Expected admin forbidden error");
    });

    // Test 4: Duplicate email rejected
    await test("4. Registration with existing email is rejected (409 Conflict)", async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Duplicate User",
          email: clientEmail,
          password: "SecurePassword123!",
          role: "CLIENT",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 409, `Expected status 409, got ${res.status}`);
      assert(body.success === false, "Expected success: false");
      assert(body.error.includes("already exists"), "Expected already exists error");
    });

    // Test 5: Weak password rejected
    await test("5. Registration with weak password is rejected", async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Weak Pass User",
          email: `weak-pass-${Date.now()}@example.com`,
          password: "weak",
          role: "FREELANCER",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 400, `Expected status 400, got ${res.status}`);
      assert(body.success === false, "Expected success: false");
    });

    // Test 6: Valid login succeeds
    await test("6. Login with valid credentials succeeds", async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clientEmail,
          password: "SecurePassword123!",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.success === true, "Expected success: true");
      assert(body.user.email === clientEmail, "Returned user email must match");
      assert(body.user.passwordHash === undefined, "passwordHash must not be exposed");
      assert(typeof body.token === "string", "Token must be returned");
    });

    // Test 7: Invalid password fails
    await test("7. Login with incorrect password returns generic 401 error", async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clientEmail,
          password: "WrongPassword123!",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 401, `Expected status 401, got ${res.status}`);
      assert(body.success === false, "Expected success: false");
      assert(body.error === "Invalid email or password.", "Expected generic error message");
    });

    // Test 8: Unknown email fails with generic error (no user enumeration)
    await test("8. Login with non-existent email returns generic 401 error", async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "unknown-user-does-not-exist@example.com",
          password: "SomePassword123!",
        }),
      });

      const body = await getJson(res);
      assert(res.status === 401, `Expected status 401, got ${res.status}`);
      assert(body.success === false, "Expected success: false");
      assert(body.error === "Invalid email or password.", "Expected generic error message to prevent user enumeration");
    });

    // Test 9: GET /auth/me without auth rejected
    await test("9. GET /auth/me without auth header or cookie is rejected (401)", async () => {
      const res = await fetch(`${BASE_URL}/auth/me`);
      assert(res.status === 401, `Expected status 401, got ${res.status}`);
    });

    // Test 10: GET /auth/me with auth succeeds
    await test("10. GET /auth/me with Bearer token succeeds and returns sanitized profile", async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.success === true, "Expected success: true");
      assert(body.user.id === clientId, "Returned user id must match");
      assert(body.user.passwordHash === undefined, "passwordHash must not be exposed");
      assert(body.user.role === "CLIENT", "Role must be CLIENT");
    });

    // Login as existing seeded Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alexander.vance@freelancehub.dev",
        password: "FreelanceHub2026!",
      }),
    });
    const adminLoginBody = await getJson(adminLoginRes);
    assert(adminLoginRes.status === 200, "Seeded Admin login must succeed");
    adminToken = adminLoginBody.token;

    // Test 11: CLIENT accessing ADMIN endpoint rejected
    await test("11. CLIENT accessing ADMIN endpoint is forbidden (403)", async () => {
      const res = await fetch(`${BASE_URL}/admin/health`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.error.includes("Insufficient permissions"), "Expected insufficient permissions error");
    });

    // Test 12: FREELANCER accessing ADMIN endpoint rejected
    await test("12. FREELANCER accessing ADMIN endpoint is forbidden (403)", async () => {
      const res = await fetch(`${BASE_URL}/admin/health`, {
        headers: { Authorization: `Bearer ${freelancerToken}` },
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.error.includes("Insufficient permissions"), "Expected insufficient permissions error");
    });

    // Test 13: ADMIN accessing ADMIN endpoint succeeds
    await test("13. ADMIN accessing ADMIN endpoint succeeds (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/admin/health`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.status === "HEALTHY", "Expected status HEALTHY");
      assert(body.roleVerified === "ADMIN", "Expected roleVerified ADMIN");
    });

    // Test 14: User A accessing private resource of User B is rejected
    await test("14. User A accessing User B private resource is blocked by ownership check (403)", async () => {
      // Client attempts to view Freelancer's private user endpoint
      const res = await fetch(`${BASE_URL}/users/${freelancerId}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      const body = await getJson(res);
      assert(res.status === 403, `Expected status 403, got ${res.status}`);
      assert(body.error.includes("do not have permission"), "Expected ownership permission denial");
    });

    // Test 15: User accessing own private resource succeeds
    await test("15. User accessing their own resource succeeds (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/users/${clientId}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.user.id === clientId, "User must receive their own profile");
    });

    // Test 16: Logout clears session
    await test("16. Logout endpoint returns 200 and clears authentication cookie", async () => {
      const res = await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
      });

      const body = await getJson(res);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      assert(body.success === true, "Expected success: true");

      const setCookie = res.headers.get("set-cookie");
      assert(
        setCookie !== null && setCookie.includes("auth_token="),
        "Response should include set-cookie clearing auth_token"
      );
    });

    console.log(`\n🎉 ALL ${passedCount}/${totalCount} TESTS PASSED PERFECTLY!\n`);
  } finally {
    // Clean up created test users from database
    await prisma.user.deleteMany({
      where: { email: { in: [clientEmail, freelancerEmail] } },
    });
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("\n❌ Test Suite Aborted due to error:", err);
  if (server) server.close();
  process.exit(1);
});
