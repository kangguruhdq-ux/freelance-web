process.env.NODE_ENV = "test";
import { app } from "../src/server";
import { Server } from "http";
import prisma from "../src/lib/prisma";

const TEST_PORT = 4995;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runAdminCrudTests() {
  console.log("\n============================================================");
  console.log("🛡️ ADMIN CRUD & GOVERNANCE COMPREHENSIVE SUITE");
  console.log("============================================================\n");

  const server: Server = app.listen(TEST_PORT);

  try {
    // 1. Admin Login
    console.log("1. Authenticating Admin...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alexander.vance@freelancehub.dev",
        password: "FreelanceHub2026!",
      }),
    });
    const loginJson = await loginRes.json();
    if (!loginJson.success || !loginJson.token) throw new Error("Admin login failed");
    const adminToken = loginJson.token;
    console.log("✅ Admin logged in successfully");

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    };

    // 2. Health & Stats
    console.log("2. Testing Health & Stats...");
    const healthRes = await fetch(`${BASE_URL}/admin/health`, { headers: authHeaders });
    const healthJson = await healthRes.json();
    if (!healthJson.success) throw new Error("Admin health check failed");

    const statsRes = await fetch(`${BASE_URL}/admin/stats`, { headers: authHeaders });
    const statsJson = await statsRes.json();
    if (!statsJson.success || !statsJson.stats) throw new Error("Admin stats failed");
    console.log("✅ Health check and Stats OK. Total Users:", statsJson.stats.totalUsers);

    // 3. User CRUD
    console.log("3. Testing User CRUD...");
    const testUserEmail = `test-user-${Date.now()}@example.com`;
    const createRes = await fetch(`${BASE_URL}/admin/users`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Test User Candidate",
        email: testUserEmail,
        password: "Password123!",
        role: "FREELANCER",
        status: "ACTIVE",
      }),
    });
    const createJson = await createRes.json();
    if (!createJson.success || !createJson.user?.id) throw new Error("User creation failed: " + JSON.stringify(createJson));
    const newUserId = createJson.user.id;
    console.log("✅ User created:", newUserId);

    // Edit user
    const editRes = await fetch(`${BASE_URL}/admin/users/${newUserId}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Updated Test Candidate",
      }),
    });
    const editJson = await editRes.json();
    if (!editJson.success || editJson.user.name !== "Updated Test Candidate") throw new Error("User update failed");
    console.log("✅ User updated");

    // Suspend user
    const suspendRes = await fetch(`${BASE_URL}/admin/users/${newUserId}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: "SUSPENDED" }),
    });
    const suspendJson = await suspendRes.json();
    if (!suspendJson.success || suspendJson.user.status !== "SUSPENDED") throw new Error("User suspend failed");
    console.log("✅ User suspended");

    // Soft delete user
    const deleteRes = await fetch(`${BASE_URL}/admin/users/${newUserId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    const deleteJson = await deleteRes.json();
    if (!deleteJson.success) throw new Error("User delete failed");
    console.log("✅ User soft-deleted/deactivated");

    // Cleanup test user from db
    await prisma.user.delete({ where: { id: newUserId } }).catch(() => {});

    // 4. Jobs Moderation
    console.log("4. Testing Jobs Moderation...");
    const jobsRes = await fetch(`${BASE_URL}/admin/jobs`, { headers: authHeaders });
    const jobsJson = await jobsRes.json();
    if (!jobsJson.success || !Array.isArray(jobsJson.data)) throw new Error("List jobs failed");
    console.log(`✅ Listed ${jobsJson.data.length} jobs`);

    if (jobsJson.data.length > 0) {
      const firstJob = jobsJson.data[0];
      const jobDetailRes = await fetch(`${BASE_URL}/admin/jobs/${firstJob.id}`, { headers: authHeaders });
      const jobDetailJson = await jobDetailRes.json();
      if (!jobDetailJson.success || !jobDetailJson.job) throw new Error("Job detail failed");
      console.log("✅ Job detail retrieved:", jobDetailJson.job.title);

      const statusRes = await fetch(`${BASE_URL}/admin/jobs/${firstJob.id}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: firstJob.status }),
      });
      const statusJson = await statusRes.json();
      if (!statusJson.success) throw new Error("Job status update failed");
      console.log("✅ Job status moderated");
    }

    // 5. Proposals Oversight
    console.log("5. Testing Proposals Oversight...");
    const proposalsRes = await fetch(`${BASE_URL}/admin/proposals`, { headers: authHeaders });
    const proposalsJson = await proposalsRes.json();
    if (!proposalsJson.success || !Array.isArray(proposalsJson.data)) throw new Error("List proposals failed");
    console.log(`✅ Listed ${proposalsJson.data.length} proposals`);

    // 6. Contracts Governance
    console.log("6. Testing Contracts Governance...");
    const contractsRes = await fetch(`${BASE_URL}/admin/contracts`, { headers: authHeaders });
    const contractsJson = await contractsRes.json();
    if (!contractsJson.success || !Array.isArray(contractsJson.data)) throw new Error("List contracts failed");
    console.log(`✅ Listed ${contractsJson.data.length} contracts`);

    if (contractsJson.data.length > 0) {
      const firstContract = contractsJson.data[0];
      const contractDetailRes = await fetch(`${BASE_URL}/admin/contracts/${firstContract.id}`, { headers: authHeaders });
      const contractDetailJson = await contractDetailRes.json();
      if (!contractDetailJson.success || !contractDetailJson.contract) throw new Error("Contract detail failed");
      console.log("✅ Contract detail retrieved with", contractDetailJson.contract.milestones.length, "milestones");
    }

    // 7. Transactions Ledger
    console.log("7. Testing Transactions Ledger...");
    const txRes = await fetch(`${BASE_URL}/admin/transactions`, { headers: authHeaders });
    const txJson = await txRes.json();
    if (!txJson.success || !Array.isArray(txJson.data)) throw new Error("List transactions failed");
    console.log(`✅ Listed ${txJson.data.length} ledger transactions`);

    // 8. Settings
    console.log("8. Testing System Settings...");
    const settingsRes = await fetch(`${BASE_URL}/admin/settings`, { headers: authHeaders });
    const settingsJson = await settingsRes.json();
    if (!settingsJson.success || !settingsJson.settings) throw new Error("Get settings failed");

    const putSettingsRes = await fetch(`${BASE_URL}/admin/settings`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ platformFeePercent: 10, minJobBudget: 50 }),
    });
    const putSettingsJson = await putSettingsRes.json();
    if (!putSettingsJson.success) throw new Error("Update settings failed");
    console.log("✅ Platform settings retrieved and validated");

    // 9. Audit Logs
    console.log("9. Testing Audit Logs...");
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs?limit=10`, { headers: authHeaders });
    const auditJson = await auditRes.json();
    if (!auditJson.success || !Array.isArray(auditJson.data)) throw new Error("Audit logs failed");
    console.log(`✅ Retrieved ${auditJson.data.length} audit logs`);

    console.log("\n============================================================");
    console.log("🎉 ALL ADMIN CRUD TESTS PASSED SUCCESSFULLY!");
    console.log("============================================================\n");
  } finally {
    server.close();
  }
}

runAdminCrudTests().catch((err) => {
  console.error("❌ Admin test failed:", err);
  process.exit(1);
});
