process.env.NODE_ENV = "test";
import { app } from "../src/server";
import prisma from "../src/lib/prisma";

async function testProposalAttachments() {
  console.log("Testing Proposal Attachments End-to-End...");
  const server = app.listen(4005);
  const BASE_URL = "http://localhost:4005";

  try {
    // 1. Login Client
    const clientRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "sarah.jenkins@nexahealth.io",
        password: "FreelanceHub2026!",
      }),
    });
    const clientData = (await clientRes.json()) as any;
    if (!clientData.token) throw new Error("Client login failed: " + JSON.stringify(clientData));
    const clientToken = clientData.token;

    // 2. Login Freelancer
    const freelancerRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "sophia.chen@freelancehub.pro",
        password: "FreelanceHub2026!",
      }),
    });
    const freelancerData = (await freelancerRes.json()) as any;
    if (!freelancerData.token) throw new Error("Freelancer login failed");
    const freelancerToken = freelancerData.token;

    const category = await prisma.category.findFirstOrThrow();

    // 3. Client creates a test job
    const jobRes = await fetch(`${BASE_URL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        title: "Test File Attachments Job " + Date.now(),
        description: "Need someone with strong sample portfolios and attached documents.",
        categoryId: category.id,
        budgetType: "FIXED",
        budget: 1200,
        experienceLevel: "EXPERT",
        duration: "1 to 3 months",
      }),
    });
    const jobData = (await jobRes.json()) as any;
    if (!jobData.job?.id) throw new Error("Job creation failed: " + JSON.stringify(jobData));
    const jobId = jobData.job.id;
    console.log("✅ Created test job:", jobId);

    // 4. Freelancer submits proposal with file attachments
    const mockFilePayload = [
      {
        fileName: "portfolio_preview.pdf",
        fileUrl: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...",
        mimeType: "application/pdf",
        sizeBytes: 15420,
      },
      {
        fileName: "architecture_diagram.png",
        fileUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        mimeType: "image/png",
        sizeBytes: 42300,
      },
    ];

    const propRes = await fetch(`${BASE_URL}/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${freelancerToken}`,
      },
      body: JSON.stringify({
        jobId,
        coverLetter: "Here are my sample design sheets and architecture portfolios attached.",
        bidAmount: 1200,
        estimatedDays: 10,
        attachments: mockFilePayload,
      }),
    });
    const propData = (await propRes.json()) as any;
    if (!propData.proposal?.id) throw new Error("Proposal submission failed: " + JSON.stringify(propData));
    const proposalId = propData.proposal.id;
    console.log("✅ Proposal submitted with ID:", proposalId);

    // 5. Verify GET /proposals/:id has attachments
    const getPropRes = await fetch(`${BASE_URL}/proposals/${proposalId}`, {
      headers: { Authorization: `Bearer ${freelancerToken}` },
    });
    const getPropData = (await getPropRes.json()) as any;
    if (!getPropData.proposal?.attachments || getPropData.proposal.attachments.length !== 2) {
      throw new Error("Proposal attachments missing in GET /proposals/:id: " + JSON.stringify(getPropData));
    }
    console.log(`✅ GET /proposals/:id verified ${getPropData.proposal.attachments.length} attachments.`);

    // 6. Verify GET /jobs/:id/proposals as Client owner includes attachments
    const clientPropRes = await fetch(`${BASE_URL}/jobs/${jobId}/proposals`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    const clientPropData = (await clientPropRes.json()) as any;
    const clientProposal = (clientPropData.data || clientPropData.proposals)?.find((p: any) => p.id === proposalId);
    if (!clientProposal || !clientProposal.attachments || clientProposal.attachments.length !== 2) {
      throw new Error("Job proposals list missing attachments for client owner: " + JSON.stringify(clientPropData));
    }
    console.log(`✅ GET /jobs/:id/proposals verified client can view freelancer attachments.`);

    // Clean up test data
    await prisma.attachment.deleteMany({ where: { proposalId } }).catch(() => {});
    await prisma.proposal.delete({ where: { id: proposalId } }).catch(() => {});
    await prisma.job.delete({ where: { id: jobId } }).catch(() => {});

    console.log("\n============================================================");
    console.log("🎉 PROPOSAL FILE ATTACHMENTS TEST PASSED 100%!");
    console.log("============================================================\n");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testProposalAttachments().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
