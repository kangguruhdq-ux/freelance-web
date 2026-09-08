# FreelanceHub — Database Architecture & Prisma Guide

This document outlines the PostgreSQL database architecture, Prisma ORM setup, relational schemas, financial precision strategies, migration flows, and realistic seed data configuration for **FreelanceHub** (`Work smarter. Hire better.`).

---

## 🏛️ Architecture & Decisions

### 1. Schema Location
- **Location**: `apps/api/prisma/schema.prisma`
- **Seed Script**: `apps/api/prisma/seed.ts`
- **Rationale**: Keeps database migrations and ORM models co-located with the NestJS API backend service, while `@prisma/client` can be imported by backend services. The Next.js frontend (`apps/web`) interacts exclusively with the backend via REST/WebSocket, adhering strictly to n-tier architecture.

### 2. Financial Representation
- All monetary fields (`hourlyRate`, `budget`, `bidAmount`, `totalAmount`, `escrowBalance`, `amount`) use PostgreSQL `DECIMAL(12, 2)`.
- JavaScript floating-point arithmetic is strictly forbidden for financial calculations to prevent cumulative precision errors.

### 3. Referential Integrity & Cascade Safeguards
- **Soft Deletes & Restrict**: Contracts, Milestones, Transactions, Reviews, and Disputes use `onDelete: Restrict` on critical relations. This guarantees that financial transaction history, contract commitments, and dispute logs cannot be accidentally erased when a user account changes state.
- **Internal Junctions**: Pure relationship mappings (`JobSkill`, `ProfileSkill`, `ConversationParticipant`) use `onDelete: Cascade` to ensure clean garbage collection without orphaned links.

---

## 📊 Relational Data Models (22 Models)

| Model | Purpose | Key Constraints & Indexes |
| :--- | :--- | :--- |
| **User** | Core identity with RBAC roles (`CLIENT`, `FREELANCER`, `ADMIN`) | `@unique(email)`, indexes on `email`, `role`, `status` |
| **Profile** | Professional freelancer/client public showcase | `@unique(userId)`, indexes on `rating`, `hourlyRate` |
| **Skill** | Normalized taxonomy of engineering, design, and domain skills | `@unique(name)`, `@unique(slug)` |
| **ProfileSkill** | Many-to-many junction connecting Profile and Skill | `@@unique([profileId, skillId])` |
| **Portfolio** | Freelancer project case studies and repositories | Index on `profileId` |
| **Category** | Job domain categories with descriptions and icon metadata | `@unique(name)`, `@unique(slug)` |
| **Job** | Client project postings with hourly/fixed budgets | Indexes on `status`, `categoryId`, `clientId`, `createdAt` |
| **JobSkill** | Many-to-many junction connecting Job and Skill | `@@unique([jobId, skillId])` |
| **Proposal** | Freelancer bids with cover letters and milestone proposals | `@@unique([jobId, freelancerId])`, status indexes |
| **Contract** | Binding legal/escrow contract linking Client, Freelancer, and Job | `@unique(contractNumber)`, `@unique(proposalId)` |
| **Milestone** | Phased contract deliverables with escrow status | Indexes on `contractId`, `status` |
| **Conversation** | Chat channel between marketplace participants | Cascade cleanups |
| **ConversationParticipant** | Users enrolled in a conversation channel | `@@unique([conversationId, userId])` |
| **Message** | Realtime-ready chat message with read receipts | Indexes on `conversationId`, `senderId`, `createdAt` |
| **Notification** | Realtime alert ledger with read timestamps | Indexes on `userId`, `readAt`, `createdAt` |
| **Review** | Double-blind reputation rating (1–5 stars) | `@@unique([contractId, reviewerId])` |
| **Transaction** | Simulated financial escrow, release, fee, and refund records | `@unique(transactionNumber)`, indexes on `contractId`, `status` |
| **Attachment** | Metadata for uploaded specifications, deliverables, and proofs | Indexes on `uploaderId`, `jobId`, `proposalId`, `contractId` |
| **Favorite** | Bookmarked talent and jobs | `@@unique([userId, targetType, targetId])` |
| **Report** | Platform moderation reports for admin intervention | Indexes on `status`, `targetType`, `reporterId` |
| **Dispute** | Formal contract arbitration requests | `@unique(contractId)`, index on `status` |
| **AuditLog** | Immutable admin and platform activity trail | Indexes on `actorId`, `entityType, entityId`, `createdAt` |

---

## ⚙️ Environment Configuration

Copy the sample environment file:
```bash
cp .env.example .env
```

Ensure `DATABASE_URL` is set:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/freelancehub?schema=public"
```

---

## 🚀 Running PostgreSQL Locally

### Option A: Docker Compose (Recommended for Docker users)
```bash
docker compose up -d
```

### Option B: Local Embedded Runner (Works without Docker)
```bash
npm run db:start
```

---

## 🛠️ Prisma Development Commands

All commands can be executed directly from the monorepo root:

| Command | Action |
| :--- | :--- |
| `npm run db:format` | Auto-formats `schema.prisma` formatting and spacing |
| `npm run db:validate` | Validates Prisma schema syntax and relationship parity |
| `npm run db:generate` | Generates `@prisma/client` TypeScript bindings |
| `npm run db:migrate` | Runs database migrations in development (`prisma migrate dev`) |
| `npm run db:push` | Synchronizes Prisma schema directly to PostgreSQL |
| `npm run db:seed` | Populates database with 300+ realistic marketplace records |
| `npm run db:studio` | Opens visual Prisma Studio UI in browser |

---

## 📦 Seed Dataset Breakdown

The seed script creates a rich, realistic, interconnected freelance marketplace:
- **16 Users**: 1 Platform Admin, 5 Corporate Clients (NexaHealth, Apex FinTech, Loomis Commerce, Synthetix AI, OrbitScale), and 10 Elite Freelancers across distinct specializations.
- **10 Categories**: Web Development, Mobile Development, UI/UX Design, AI & Machine Learning, DevOps, Cybersecurity, etc.
- **36 Skills**: Modern industry stack (React, Next.js, NestJS, TypeScript, Tailwind, Docker, Kubernetes, LangChain, PyTorch, etc.).
- **30 Jobs**: Realistic fixed and hourly opportunities with complete requirements and client metadata.
- **22 Proposals**: Realistic cover letters, competitive bids, and duration estimates.
- **7 Contracts**: Mixture of Completed, Active, and Disputed contract lifecycles.
- **20 Milestones**: Phased deliverables summing cleanly to contract totals.
- **24 Transactions**: Complete simulated escrow lock, milestone release, platform fee, and refund audit records.
- **12 Reviews**: Double-blind feedback with 1–5 star scores and contextual testimonials.
- **6 Conversations & 32 Messages**: Realistic technical and project management chats.
- **24 Notifications**: Realtime alerts for proposals, milestones, reviews, and payments.
- **10 Favorites**: Saved freelancer and job bookmarks.
- **6 Reports & 3 Disputes**: Plausible moderation events and dispute resolutions.
- **25 Audit Logs**: Complete administrative event timeline.
