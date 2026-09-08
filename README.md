# FreelanceHub

> **Work smarter. Hire better.**
> A production-quality freelance marketplace connecting ambitious companies with world-class independent professionals.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)

---

## 🌟 Overview

FreelanceHub is engineered as a portfolio-grade, full-stack marketplace web application built with a modern SaaS aesthetic, rigorous type safety, responsive design system, and escrow milestone simulation.

### Key Highlights
- **Modern Visual Identity**: Clean, light-theme-first SaaS design inspired by modern industry standards (Linear, Stripe, Vercel) without generic boilerplate templates.
- **Milestone Escrow Architecture**: Guaranteed protection where client funds are held securely until deliverables are approved.
- **Responsive System**: Mobile-first architecture tested thoroughly across viewports from 320px smartphones to 4K displays.
- **Modular Monorepo**: Clean separation of web client, backend API services, and shared types.

---

## 🏗️ Monorepo Architecture

```
freelance-web/
├── apps/
│   ├── web/                     # Next.js 15 App Router frontend
│   │   ├── src/
│   │   │   ├── app/             # App router pages, layouts, and styles
│   │   │   ├── components/
│   │   │   │   ├── layout/      # Navbar, Footer, Mobile Navigation drawer
│   │   │   │   ├── ui/          # Reusable design system (Button, Badge, Card, etc.)
│   │   │   │   └── landing/     # Hero, Stats, Categories, Freelancers, Jobs, etc.
│   │   │   ├── data/            # Believable demo marketplace records
│   │   │   └── lib/             # Utility helpers and styling mergers
│   │   └── tailwind.config.ts   # Design tokens & color system
│   └── api/                     # Backend API scaffold (Checkpoint 2+)
├── packages/
│   └── types/                   # Shared domain enums & TypeScript interfaces
├── package.json                 # Monorepo workspaces configuration
└── README.md
```

---

## 🚦 Roadmap & Checkpoints

- [x] **Checkpoint 1**: Project architecture, design system, responsive navbar & footer, mobile navigation, and modern SaaS landing page.
- [ ] **Checkpoint 2**: Database schema, PostgreSQL, Prisma ORM, migrations & seed data.
- [ ] **Checkpoint 3**: Authentication, session persistence, and Role-Based Access Control (RBAC).
- [ ] **Checkpoint 4**: Freelancer profiles, portfolio showcases, and skill endorsements.
- [ ] **Checkpoint 5**: Job marketplace search, filters, pagination, and job details.
- [ ] **Checkpoint 6**: Proposal submission and client proposal management workflow.
- [ ] **Checkpoint 7**: Contracts, milestone tracking, and deliverables workflow.
- [ ] **Checkpoint 8**: Payment simulation with escrow lock, approval, and balance release.
- [ ] **Checkpoint 9**: Real-time messaging with Socket.IO, typing indicators, and attachments.
- [ ] **Checkpoint 10**: Notification center and real-time alerts.
- [ ] **Checkpoint 11**: Double-blind reviews and rating analytics.
- [ ] **Checkpoint 12**: Admin governance dashboard, content moderation, and audit logs.
- [ ] **Checkpoint 13**: Security hardening, rate limiting, and ownership checks.
- [ ] **Checkpoint 14**: Comprehensive testing (Unit, Integration, E2E).
- [ ] **Checkpoint 15**: Multi-device responsive polish and overflow audits.
- [ ] **Checkpoint 16**: Performance optimization and caching.
- [ ] **Checkpoint 17**: Full QA validation across all user flows.
- [ ] **Checkpoint 18**: Production deployment preparation and Docker configuration.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: `v20+` or `v22+` (tested with v24)
- **npm**: `v10+` or `v11+`

### Installation
```bash
# Clone the repository
git clone https://github.com/kangguruhdq-ux/freelance-web.git
cd freelance-web

# Install dependencies
npm install

# Start local development server
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📄 License

This project is licensed under the MIT License.
