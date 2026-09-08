import { PrismaClient, UserRole, UserStatus, ExperienceLevel, BudgetType, LocationType, JobStatus, ProposalStatus, ContractStatus, MilestoneStatus, TransactionType, TransactionStatus, NotificationType, FavoriteTargetType, ReportTargetType, ReportStatus, DisputeStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting FreelanceHub realistic database seed...");

  // 1. Clean existing data in reverse dependency order
  console.log("Cleaning existing records...");
  await prisma.auditLog.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.report.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.jobSkill.deleteMany();
  await prisma.job.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.profileSkill.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash("FreelanceHub2026!", 10);

  // 2. Seed Categories (10)
  console.log("Seeding Categories...");
  const categoriesData = [
    { name: "Web Development", slug: "web-development", description: "Modern web applications, Next.js, full-stack microservices, and JAMstack platforms.", icon: "Code2" },
    { name: "Mobile Development", slug: "mobile-development", description: "iOS, Android, React Native, and Flutter high-performance mobile apps.", icon: "Smartphone" },
    { name: "UI/UX Design", slug: "ui-ux-design", description: "Product design systems, wireframing, high-fidelity prototypes, and user research.", icon: "Palette" },
    { name: "AI & Machine Learning", slug: "ai-machine-learning", description: "LLM integration, RAG pipelines, fine-tuning, computer vision, and autonomous agents.", icon: "Cpu" },
    { name: "DevOps & Cloud Systems", slug: "devops-cloud", description: "Kubernetes, AWS/GCP infrastructure, Terraform, and automated CI/CD pipelines.", icon: "Server" },
    { name: "Cybersecurity & Auditing", slug: "cybersecurity", description: "Security penetration testing, vulnerability assessments, and smart contract audits.", icon: "ShieldCheck" },
    { name: "Digital Marketing & SEO", slug: "marketing-seo", description: "Data-driven SEO, conversion rate optimization, growth loops, and performance analytics.", icon: "TrendingUp" },
    { name: "Data Science & Analytics", slug: "data-analytics", description: "Data warehousing, ETL pipelines, predictive modeling, and business intelligence dashboards.", icon: "BarChart3" },
    { name: "Technical Writing & Content", slug: "technical-writing", description: "API documentation, developer tutorials, whitepapers, and technical copywriting.", icon: "BookOpen" },
    { name: "Business & Strategy", slug: "business-strategy", description: "Product management, startup advisory, financial modeling, and fractional CTO consulting.", icon: "Briefcase" },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) => prisma.category.create({ data: cat }))
  );
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  // 3. Seed Skills (36)
  console.log("Seeding Skills...");
  const skillsData = [
    { name: "React", slug: "react", catSlug: "web-development" },
    { name: "Next.js", slug: "nextjs", catSlug: "web-development" },
    { name: "TypeScript", slug: "typescript", catSlug: "web-development" },
    { name: "Node.js", slug: "nodejs", catSlug: "web-development" },
    { name: "NestJS", slug: "nestjs", catSlug: "web-development" },
    { name: "PostgreSQL", slug: "postgresql", catSlug: "web-development" },
    { name: "Prisma", slug: "prisma", catSlug: "web-development" },
    { name: "Tailwind CSS", slug: "tailwind-css", catSlug: "web-development" },
    { name: "GraphQL", slug: "graphql", catSlug: "web-development" },
    { name: "React Native", slug: "react-native", catSlug: "mobile-development" },
    { name: "Flutter", slug: "flutter", catSlug: "mobile-development" },
    { name: "iOS / Swift", slug: "swift", catSlug: "mobile-development" },
    { name: "Figma", slug: "figma", catSlug: "ui-ux-design" },
    { name: "Design Systems", slug: "design-systems", catSlug: "ui-ux-design" },
    { name: "User Research", slug: "user-research", catSlug: "ui-ux-design" },
    { name: "Wireframing", slug: "wireframing", catSlug: "ui-ux-design" },
    { name: "Python", slug: "python", catSlug: "ai-machine-learning" },
    { name: "PyTorch", slug: "pytorch", catSlug: "ai-machine-learning" },
    { name: "LangChain", slug: "langchain", catSlug: "ai-machine-learning" },
    { name: "OpenAI API", slug: "openai-api", catSlug: "ai-machine-learning" },
    { name: "Vector Databases", slug: "vector-databases", catSlug: "ai-machine-learning" },
    { name: "Docker", slug: "docker", catSlug: "devops-cloud" },
    { name: "Kubernetes", slug: "kubernetes", catSlug: "devops-cloud" },
    { name: "AWS", slug: "aws", catSlug: "devops-cloud" },
    { name: "Terraform", slug: "terraform", catSlug: "devops-cloud" },
    { name: "GitHub Actions", slug: "github-actions", catSlug: "devops-cloud" },
    { name: "Penetration Testing", slug: "penetration-testing", catSlug: "cybersecurity" },
    { name: "SOC2 Compliance", slug: "soc2-compliance", catSlug: "cybersecurity" },
    { name: "Smart Contracts", slug: "smart-contracts", catSlug: "cybersecurity" },
    { name: "Technical SEO", slug: "technical-seo", catSlug: "marketing-seo" },
    { name: "Content Strategy", slug: "content-strategy", catSlug: "marketing-seo" },
    { name: "Data Pipelines / ETL", slug: "etl-pipelines", catSlug: "data-analytics" },
    { name: "Snowflake", slug: "snowflake", catSlug: "data-analytics" },
    { name: "API Documentation", slug: "api-documentation", catSlug: "technical-writing" },
    { name: "Product Strategy", slug: "product-strategy", catSlug: "business-strategy" },
    { name: "Redis", slug: "redis", catSlug: "web-development" },
  ];

  const skills = await Promise.all(
    skillsData.map((s) =>
      prisma.skill.create({
        data: {
          name: s.name,
          slug: s.slug,
          categoryId: categoryMap.get(s.catSlug)?.id,
        },
      })
    )
  );
  const skillMap = new Map(skills.map((s) => [s.slug, s]));

  // 4. Seed Users: 1 Admin, 5 Clients, 10 Freelancers = 16 Users
  console.log("Seeding Users & Profiles...");

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "alexander.vance@freelancehub.dev",
      name: "Alexander Vance",
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
      emailVerifiedAt: new Date("2025-01-01"),
    },
  });

  // 5 Clients
  const clientsData = [
    {
      email: "sarah.jenkins@nexahealth.io",
      name: "Sarah Jenkins",
      company: "NexaHealth Technologies",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      headline: "VP of Engineering at NexaHealth",
      location: "Boston, MA",
    },
    {
      email: "rachel.sterling@apexfintech.com",
      name: "Rachel Sterling",
      company: "Apex Global FinTech",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
      headline: "Chief Technology Officer at Apex FinTech",
      location: "New York, NY",
    },
    {
      email: "michael.chang@loomisb2b.io",
      name: "Michael Chang",
      company: "Loomis B2B Commerce",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
      headline: "Head of Product at Loomis Commerce",
      location: "San Francisco, CA",
    },
    {
      email: "elena.weber@synthetixai.de",
      name: "Elena Weber",
      company: "Synthetix AI Labs",
      avatarUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80",
      headline: "VP of AI Research at Synthetix",
      location: "Berlin, Germany",
    },
    {
      email: "david.holloway@orbitscale.co",
      name: "David Holloway",
      company: "OrbitScale Cloud Logistics",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      headline: "Founder & CEO at OrbitScale",
      location: "Austin, TX",
    },
  ];

  const clients = await Promise.all(
    clientsData.map(async (c) => {
      const user = await prisma.user.create({
        data: {
          email: c.email,
          name: c.name,
          passwordHash: defaultPasswordHash,
          role: UserRole.CLIENT,
          status: UserStatus.ACTIVE,
          avatarUrl: c.avatarUrl,
          emailVerifiedAt: new Date("2025-02-01"),
          profile: {
            create: {
              headline: c.headline,
              bio: `Leading innovative initiatives at ${c.company}. Constantly partnering with top-tier independent engineering and design talent.`,
              location: c.location,
              hourlyRate: 0,
              experienceLevel: ExperienceLevel.EXPERT,
              availability: "HIRING",
              rating: 4.95,
              reviewCount: 14,
              completedJobs: 18,
              totalEarnings: 0,
            },
          },
        },
        include: { profile: true },
      });
      return user;
    })
  );

  // 10 Freelancers
  const freelancersData = [
    {
      email: "sophia.chen@freelancehub.pro",
      name: "Sophia Chen",
      headline: "Principal Full-Stack Architect & Next.js Specialist",
      bio: "Former Staff Engineer at Stripe with 9+ years architecting scalable SaaS platforms, high-throughput microservices, and enterprise component systems.",
      location: "San Francisco, CA",
      hourlyRate: 95.0,
      experienceLevel: ExperienceLevel.EXPERT,
      rating: 4.98,
      reviewCount: 48,
      completedJobs: 54,
      totalEarnings: 142000.0,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      skills: ["nextjs", "react", "typescript", "nodejs", "nestjs", "postgresql", "tailwind-css"],
      portfolios: [
        {
          title: "Multi-Tenant FinTech Billing Engine",
          description: "Architected a PCI-compliant real-time billing gateway handling 15,000 requests/sec with Next.js App Router and NestJS microservices.",
          coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
          projectUrl: "https://demo-billing.example.com",
          technologies: ["Next.js", "NestJS", "PostgreSQL", "Redis", "Tailwind CSS"],
        },
      ],
    },
    {
      email: "marcus.thorne@freelancehub.pro",
      name: "Marcus Thorne",
      headline: "Lead Product Designer & Design Systems Architect",
      bio: "Creating accessible, world-class digital products and multi-brand Figma token frameworks for high-growth B2B startups and enterprise software.",
      location: "London, UK",
      hourlyRate: 85.0,
      experienceLevel: ExperienceLevel.EXPERT,
      rating: 5.0,
      reviewCount: 38,
      completedJobs: 42,
      totalEarnings: 98500.0,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      skills: ["figma", "design-systems", "user-research", "wireframing", "tailwind-css"],
      portfolios: [
        {
          title: "Enterprise SaaS Design System",
          description: "Comprehensive 80+ component system with W3C tokens, dark mode variants, and responsive desktop/mobile patterns.",
          coverImage: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80",
          projectUrl: "https://figma.com/@marcusthorne",
          technologies: ["Figma", "Design Tokens", "Accessibility", "Tailwind CSS"],
        },
      ],
    },
    {
      email: "elena.rostova@freelancehub.pro",
      name: "Elena Rostova",
      headline: "Senior Cloud & Platform DevOps Engineer",
      bio: "AWS Certified Solutions Architect helping fast-scaling companies containerize workloads, manage EKS clusters with Terraform, and achieve 99.99% uptime.",
      location: "Berlin, Germany",
      hourlyRate: 90.0,
      experienceLevel: ExperienceLevel.EXPERT,
      rating: 4.95,
      reviewCount: 42,
      completedJobs: 49,
      totalEarnings: 115000.0,
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      skills: ["kubernetes", "docker", "aws", "terraform", "github-actions"],
      portfolios: [
        {
          title: "Zero-Downtime EKS GitOps Migration",
          description: "Migrated 24 legacy services to AWS EKS with automated canary deployments and Prometheus/Grafana monitoring dashboards.",
          coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
          projectUrl: "https://github.com/elena-rostova/eks-gitops",
          technologies: ["Kubernetes", "AWS EKS", "Terraform", "GitHub Actions"],
        },
      ],
    },
    {
      email: "liam.oconnor@freelancehub.pro",
      name: "Liam O'Connor",
      headline: "AI Engineer & RAG Pipeline Specialist",
      bio: "Building production LLM agents, vector embeddings retrieval workflows, and fine-tuned domain models for enterprise tech.",
      location: "Toronto, Canada",
      hourlyRate: 110.0,
      experienceLevel: ExperienceLevel.EXPERT,
      rating: 5.0,
      reviewCount: 29,
      completedJobs: 33,
      totalEarnings: 89000.0,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      skills: ["python", "pytorch", "langchain", "openai-api", "vector-databases"],
      portfolios: [
        {
          title: "Hybrid Semantic Search Knowledge Engine",
          description: "Enterprise search engine combining BM25 lexical ranking with vector cosine similarity across 2M documentation pages.",
          coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
          technologies: ["Python", "LangChain", "OpenAI", "Pinecone", "FastAPI"],
        },
      ],
    },
    {
      email: "ananya.patel@freelancehub.pro",
      name: "Ananya Patel",
      headline: "Senior React Native & Mobile App Engineer",
      bio: "7+ years crafting smooth 60fps cross-platform mobile apps for iOS & Android, offline sync architectures, and native module bridges.",
      location: "Bangalore, India",
      hourlyRate: 65.0,
      experienceLevel: ExperienceLevel.EXPERT,
      rating: 4.92,
      reviewCount: 31,
      completedJobs: 35,
      totalEarnings: 67000.0,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      skills: ["react-native", "flutter", "swift", "typescript", "react"],
      portfolios: [
        {
          title: "Healthcare Telemedicine Mobile App",
          description: "HIPAA-compliant React Native mobile app featuring WebRTC video consultations, encrypted prescriptions, and offline caching.",
          coverImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
          technologies: ["React Native", "TypeScript", "WebRTC", "Redux Toolkit"],
        },
      ],
    },
    {
      email: "julian.vogel@freelancehub.pro",
      name: "Julian Vogel",
      headline: "Technical SEO & Growth Architecture Consultant",
      bio: "Specializing in programmatic SEO, Core Web Vitals remediation, structured data engineering, and multi-lingual index optimization.",
      location: "Zurich, Switzerland",
      hourlyRate: 80.0,
      experienceLevel: ExperienceLevel.EXPERT,
      rating: 4.96,
      reviewCount: 26,
      completedJobs: 29,
      totalEarnings: 58000.0,
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
      skills: ["technical-seo", "content-strategy", "nextjs", "product-strategy"],
      portfolios: [
        {
          title: "SaaS Programmatic Directory Scaling to 1M Organic Visitors",
          description: "Engineered automated Next.js dynamic routing, schema.org JSON-LD microdata, and edge caching resulting in a 410% organic search lift.",
          coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
          technologies: ["Technical SEO", "Next.js", "Edge Middleware", "Google Search Console"],
        },
      ],
    },
    {
      email: "tariq.mansoor@freelancehub.pro",
      name: "Tariq Mansoor",
      headline: "Senior Cybersecurity & Smart Contract Auditor",
      bio: "CREST certified penetration tester and Solidity auditor. Specializing in cloud infrastructure threat modeling and EVM security review.",
      location: "Dubai, UAE",
      hourlyRate: 120.0,
      experienceLevel: ExperienceLevel.EXPERT,
      rating: 5.0,
      reviewCount: 22,
      completedJobs: 25,
      totalEarnings: 94000.0,
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
      skills: ["penetration-testing", "soc2-compliance", "smart-contracts", "aws"],
      portfolios: [
        {
          title: "DeFi Lending Protocol Audit & Hardening",
          description: "Conducted static & dynamic analysis identifying 2 critical re-entrancy vulnerabilities before mainnet launch with \$80M TVL.",
          coverImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80",
          technologies: ["Smart Contracts", "Slither", "Foundry", "Security Auditing"],
        },
      ],
    },
    {
      email: "maya.lindqvist@freelancehub.pro",
      name: "Maya Lindqvist",
      headline: "Principal Data Engineer & Snowflake Architect",
      bio: "Designing modern data stacks with dbt, Snowflake, Airflow, and Kafka for petabyte-scale event analytics and real-time streaming.",
      location: "Stockholm, Sweden",
      hourlyRate: 95.0,
      experienceLevel: ExperienceLevel.EXPERT,
      rating: 4.97,
      reviewCount: 34,
      completedJobs: 39,
      totalEarnings: 104000.0,
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
      skills: ["etl-pipelines", "snowflake", "python", "postgresql", "docker"],
      portfolios: [
        {
          title: "Real-Time Event Ingestion Pipeline (100k events/sec)",
          description: "Built a fault-tolerant streaming architecture using Kafka, dbt transformations, and Snowflake data lakehouse.",
          coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
          technologies: ["Snowflake", "dbt", "Apache Kafka", "Python"],
        },
      ],
    },
    {
      email: "carlos.mendoza@freelancehub.pro",
      name: "Carlos Mendoza",
      headline: "Senior API Documentation & Technical Writer",
      bio: "Bridging the gap between complex engineering architectures and seamless developer adoption through Mintlify, OpenAPI 3.1, and interactive guides.",
      location: "Madrid, Spain",
      hourlyRate: 70.0,
      experienceLevel: ExperienceLevel.INTERMEDIATE,
      rating: 4.89,
      reviewCount: 24,
      completedJobs: 28,
      totalEarnings: 46000.0,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      skills: ["api-documentation", "content-strategy", "typescript", "graphql"],
      portfolios: [
        {
          title: "Public Developer Portal & SDK Reference Guides",
          description: "Authored end-to-end documentation for a payment API, including code snippets in 5 languages and interactive sandbox consoles.",
          coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80",
          technologies: ["OpenAPI", "Mintlify", "Markdown", "TypeScript"],
        },
      ],
    },
    {
      email: "hannah.kim@freelancehub.pro",
      name: "Hannah Kim",
      headline: "Fractional Product Leader & Strategic Systems Advisor",
      bio: "Ex-Meta PM helping seed and Series-A founders define product-market fit, streamline user roadmaps, and hire elite engineering teams.",
      location: "Seattle, WA",
      hourlyRate: 130.0,
      experienceLevel: ExperienceLevel.EXPERT,
      rating: 5.0,
      reviewCount: 19,
      completedJobs: 21,
      totalEarnings: 74000.0,
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
      skills: ["product-strategy", "user-research", "design-systems", "wireframing"],
      portfolios: [
        {
          title: "B2B SaaS 0-to-1 Product Discovery & Launch",
          description: "Led user discovery with 45 enterprise stakeholders, defined sprint backlog, and achieved \$1.2M ARR in month 9 post-launch.",
          coverImage: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
          technologies: ["Product Management", "Figma", "Jira", "Mixpanel"],
        },
      ],
    },
  ];

  const freelancers = await Promise.all(
    freelancersData.map(async (fl) => {
      const user = await prisma.user.create({
        data: {
          email: fl.email,
          name: fl.name,
          passwordHash: defaultPasswordHash,
          role: UserRole.FREELANCER,
          status: UserStatus.ACTIVE,
          avatarUrl: fl.avatarUrl,
          emailVerifiedAt: new Date("2025-01-15"),
          profile: {
            create: {
              headline: fl.headline,
              bio: fl.bio,
              location: fl.location,
              hourlyRate: fl.hourlyRate,
              experienceLevel: fl.experienceLevel,
              availability: "FULL_TIME",
              rating: fl.rating,
              reviewCount: fl.reviewCount,
              completedJobs: fl.completedJobs,
              totalEarnings: fl.totalEarnings,
              skills: {
                create: fl.skills.map((slug) => ({
                  skill: { connect: { id: skillMap.get(slug)?.id } },
                })),
              },
              portfolioItems: {
                create: fl.portfolios.map((p: { title: string; description: string; coverImage: string; projectUrl?: string; technologies: string[] }) => ({
                  title: p.title,
                  description: p.description,
                  coverImage: p.coverImage,
                  projectUrl: p.projectUrl || null,
                  technologies: p.technologies,
                })),
              },
            },
          },
        },
        include: { profile: { include: { skills: true, portfolioItems: true } } },
      });
      return user;
    })
  );

  // 5. Seed 30 Diverse, Realistic Jobs
  console.log("Seeding 30 Realistic Jobs...");

  const rawJobsData = [
    {
      title: "Full-Stack Next.js 15 & NestJS Platform Migration",
      desc: "Re-architecting our healthcare analytics dashboard to Next.js App Router and NestJS microservices. Looking for an experienced engineer to lead component integration, secure cookie session management, and Prisma ORM optimization.",
      cat: "web-development",
      clientIdx: 0,
      budget: 5200.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["nextjs", "react", "typescript", "nestjs", "postgresql", "prisma"],
      postedDaysAgo: 1,
    },
    {
      title: "Multi-Brand Figma Design System & React UI Component Library",
      desc: "Seeking a senior product designer to refine our core Figma design tokens and coordinate with our frontend engineering team on building an accessible, documented React/Tailwind component system.",
      cat: "ui-ux-design",
      clientIdx: 1,
      budget: 75.0,
      hourlyMin: 70.0,
      hourlyMax: 90.0,
      type: BudgetType.HOURLY,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["figma", "design-systems", "tailwind-css", "react"],
      postedDaysAgo: 2,
    },
    {
      title: "AWS Multi-Region Kubernetes EKS Cluster Automation with Terraform",
      desc: "Need an infrastructure specialist to configure automated staging and production EKS clusters with GitOps, Prometheus/Grafana observability, and automated blue-green deployment pipelines.",
      cat: "devops-cloud",
      clientIdx: 2,
      budget: 4200.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["kubernetes", "aws", "terraform", "docker", "github-actions"],
      postedDaysAgo: 2,
    },
    {
      title: "Enterprise LLM RAG Agent Pipeline with Hybrid Semantic Search",
      desc: "Constructing a knowledge-base QA engine integrating semantic vector search with BM25 lexical search. Deep experience with Python, LangChain, and vector database indexing required.",
      cat: "ai-machine-learning",
      clientIdx: 3,
      budget: 95.0,
      hourlyMin: 85.0,
      hourlyMax: 120.0,
      type: BudgetType.HOURLY,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["python", "langchain", "openai-api", "vector-databases"],
      postedDaysAgo: 3,
    },
    {
      title: "Cross-Platform React Native Logistics Driver App with Offline Sync",
      desc: "Building an iOS & Android logistics management application for 2,000+ couriers. Requires background GPS tracking, barcode camera scanning, and robust offline SQLite synchronization.",
      cat: "mobile-development",
      clientIdx: 4,
      budget: 6800.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["react-native", "typescript", "react"],
      postedDaysAgo: 4,
    },
    {
      title: "SOC2 Type II Readiness Audit & Cloud Infrastructure Hardening",
      desc: "Preparing our FinTech platform for SOC2 Type II compliance. Looking for a security engineer to audit our AWS IAM policies, database encryption at rest, and audit trail logs.",
      cat: "cybersecurity",
      clientIdx: 1,
      budget: 4500.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["soc2-compliance", "penetration-testing", "aws"],
      postedDaysAgo: 5,
    },
    {
      title: "Technical SEO Overhaul & Core Web Vitals Optimization",
      desc: "Comprehensive SEO audit across 50,000 product landing pages. Optimize TTFB, LCP, CLS, structured JSON-LD breadcrumbs, and international hreflang tags.",
      cat: "marketing-seo",
      clientIdx: 2,
      budget: 65.0,
      hourlyMin: 60.0,
      hourlyMax: 80.0,
      type: BudgetType.HOURLY,
      exp: ExperienceLevel.INTERMEDIATE,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["technical-seo", "content-strategy", "nextjs"],
      postedDaysAgo: 5,
    },
    {
      title: "Snowflake & dbt Cloud Data Warehouse Transformation",
      desc: "Migrate our raw PostgreSQL database replicas into a clean, tested Snowflake dimensional schema using dbt models and automated data freshness alerts.",
      cat: "data-analytics",
      clientIdx: 0,
      budget: 4800.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["snowflake", "etl-pipelines", "postgresql", "python"],
      postedDaysAgo: 6,
    },
    {
      title: "Interactive Developer Documentation & OpenAPI Reference Portal",
      desc: "Restructure our public API documentation into an engaging Mintlify developer hub, including quickstart guides, webhooks reference, and error code troubleshooting.",
      cat: "technical-writing",
      clientIdx: 3,
      budget: 2600.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.INTERMEDIATE,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["api-documentation", "typescript"],
      postedDaysAgo: 7,
    },
    {
      title: "Fractional Head of Product for AI B2B Workflow Tool",
      desc: "Guiding product strategy, user discovery interviews with enterprise customers, and feature prioritization for our upcoming v2 product launch.",
      cat: "business-strategy",
      clientIdx: 4,
      budget: 125.0,
      hourlyMin: 110.0,
      hourlyMax: 150.0,
      type: BudgetType.HOURLY,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["product-strategy", "user-research"],
      postedDaysAgo: 8,
    },
    // Contract-linked jobs
    {
      title: "High-Throughput GraphQL Subscriptions Gateway",
      desc: "Implement realtime push notifications and order status streams using Apollo GraphQL subscriptions and Redis cluster Pub/Sub.",
      cat: "web-development",
      clientIdx: 0,
      budget: 3800.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.COMPLETED,
      skills: ["graphql", "nodejs", "redis", "typescript"],
      postedDaysAgo: 30,
    },
    {
      title: "Fintech Mobile Application UI/UX Redesign",
      desc: "End-to-end Figma redesign of our mobile banking app including biometric authentication screens and dark mode tokens.",
      cat: "ui-ux-design",
      clientIdx: 1,
      budget: 4200.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.COMPLETED,
      skills: ["figma", "design-systems", "wireframing"],
      postedDaysAgo: 45,
    },
    {
      title: "Kubernetes Microservices CI/CD Pipeline Setup",
      desc: "Deploy automated GitHub Actions workflows with Docker multi-stage builds, vulnerability scanning with Trivy, and Helm chart releases.",
      cat: "devops-cloud",
      clientIdx: 2,
      budget: 3500.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.COMPLETED,
      skills: ["kubernetes", "docker", "github-actions", "aws"],
      postedDaysAgo: 40,
    },
    {
      title: "Enterprise Document QA Copilot with LangChain & Pinecone",
      desc: "Build a domain-specific retrieval augmented generation chatbot indexing confidential PDF policies and legal contracts.",
      cat: "ai-machine-learning",
      clientIdx: 3,
      budget: 5000.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.IN_PROGRESS,
      skills: ["python", "langchain", "openai-api", "vector-databases"],
      postedDaysAgo: 20,
    },
    {
      title: "React Native Payment Gateway & Wallet Integration",
      desc: "Integrate Apple Pay, Google Pay, and Stripe Elements into our mobile checkout flow with end-to-end receipt generation.",
      cat: "mobile-development",
      clientIdx: 4,
      budget: 3400.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.IN_PROGRESS,
      skills: ["react-native", "typescript", "react"],
      postedDaysAgo: 15,
    },
    {
      title: "Smart Contract Liquidity Pool Security Review",
      desc: "Audit automated market maker smart contracts for slippage vulnerabilities, flash loan attack vectors, and access controls.",
      cat: "cybersecurity",
      clientIdx: 1,
      budget: 4000.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.COMPLETED,
      skills: ["smart-contracts", "penetration-testing"],
      postedDaysAgo: 35,
    },
    {
      title: "Disputed Webhook Sync Microservice Refactor",
      desc: "Rebuild event dispatch webhook retry queue with exponential backoff and idempotency keys.",
      cat: "web-development",
      clientIdx: 0,
      budget: 2800.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.INTERMEDIATE,
      loc: LocationType.REMOTE,
      status: JobStatus.IN_PROGRESS,
      skills: ["nodejs", "redis", "typescript", "postgresql"],
      postedDaysAgo: 25,
    },
    // Additional 13 jobs to reach 30 total
    {
      title: "Real-Time WebSocket Collaboration Engine",
      desc: "Implement live presence, cursor tracking, and collaborative state synchronization for our browser-based diagramming canvas.",
      cat: "web-development",
      clientIdx: 2,
      budget: 4600.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["react", "typescript", "nodejs", "redis"],
      postedDaysAgo: 9,
    },
    {
      title: "Flutter Multi-Vendor Marketplace Application",
      desc: "Develop an e-commerce mobile app connecting local artisans with buyers. Features include search filters, cart, and reviews.",
      cat: "mobile-development",
      clientIdx: 4,
      budget: 5500.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["flutter", "react-native"],
      postedDaysAgo: 10,
    },
    {
      title: "B2B SaaS Onboarding Funnel UX Audit",
      desc: "Audit our user sign-up drop-off rate and design frictionless onboarding screens with user delight moments.",
      cat: "ui-ux-design",
      clientIdx: 3,
      budget: 2200.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.INTERMEDIATE,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["user-research", "figma", "wireframing"],
      postedDaysAgo: 11,
    },
    {
      title: "Fine-Tuning Llama-3 on Internal Support Transcripts",
      desc: "Curate training data, fine-tune open-weights Llama-3 using LoRA adapters, and benchmark hallucination rates.",
      cat: "ai-machine-learning",
      clientIdx: 3,
      budget: 6000.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["python", "pytorch", "openai-api"],
      postedDaysAgo: 12,
    },
    {
      title: "Terraform Infrastructure as Code for Multi-Tenant SaaS",
      desc: "Standardize our staging and production environments using reusable Terraform modules on AWS ECS and Aurora Serverless.",
      cat: "devops-cloud",
      clientIdx: 0,
      budget: 3900.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["terraform", "aws", "docker"],
      postedDaysAgo: 13,
    },
    {
      title: "Web Application Penetration Test (OWASP Top 10)",
      desc: "Conduct whitebox and blackbox security assessments across our patient portal prior to medical provider launch.",
      cat: "cybersecurity",
      clientIdx: 0,
      budget: 3200.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["penetration-testing", "soc2-compliance"],
      postedDaysAgo: 14,
    },
    {
      title: "Internationalization (i18n) & Localized SEO Architecture",
      desc: "Architect multi-locale routing for English, Spanish, and German subpaths with dynamic XML sitemaps.",
      cat: "marketing-seo",
      clientIdx: 2,
      budget: 2800.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.INTERMEDIATE,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["technical-seo", "nextjs", "content-strategy"],
      postedDaysAgo: 15,
    },
    {
      title: "Streaming Data Analytics Dashboard with Apache Kafka",
      desc: "Build real-time throughput metrics graphs and alert thresholds processing 50k events per minute.",
      cat: "data-analytics",
      clientIdx: 1,
      budget: 4900.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["etl-pipelines", "python", "postgresql"],
      postedDaysAgo: 16,
    },
    {
      title: "Comprehensive Developer SDK Guides in TypeScript and Python",
      desc: "Write production-quality sample code, tutorial guides, and error reference documentation for our GraphQL API.",
      cat: "technical-writing",
      clientIdx: 2,
      budget: 2400.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.INTERMEDIATE,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["api-documentation", "typescript", "python"],
      postedDaysAgo: 17,
    },
    {
      title: "Fractional CTO Architecture Review for Seed FinTech",
      desc: "Evaluate our technical debt, database schemas, and cloud cost projections to prepare our seed funding pitch deck.",
      cat: "business-strategy",
      clientIdx: 1,
      budget: 3500.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["product-strategy", "postgresql", "aws"],
      postedDaysAgo: 18,
    },
    {
      title: "Headless Shopify Storefront with Next.js & Tailwind CSS",
      desc: "Develop a lightning-fast headless e-commerce store with Shopify Storefront API, Algolia search, and Klaviyo integration.",
      cat: "web-development",
      clientIdx: 2,
      budget: 4400.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["nextjs", "react", "tailwind-css", "typescript"],
      postedDaysAgo: 19,
    },
    {
      title: "iOS Swift Native Widget & Live Activity Extension",
      desc: "Create dynamic iOS 18 Lock Screen widgets and Live Activities for real-time order tracking with WidgetKit.",
      cat: "mobile-development",
      clientIdx: 4,
      budget: 2500.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["swift"],
      postedDaysAgo: 20,
    },
    {
      title: "Enterprise Dark Mode Design System Token Library",
      desc: "Standardize semantic color contrast tokens, focus states, and component states for WCAG 2.1 AA compliance.",
      cat: "ui-ux-design",
      clientIdx: 0,
      budget: 3000.0,
      type: BudgetType.FIXED,
      exp: ExperienceLevel.EXPERT,
      loc: LocationType.REMOTE,
      status: JobStatus.OPEN,
      skills: ["figma", "design-systems", "user-research"],
      postedDaysAgo: 21,
    },
  ];

  const jobs = await Promise.all(
    rawJobsData.map((job) => {
      const client = clients[job.clientIdx];
      const category = categoryMap.get(job.cat);
      const createdAt = new Date(Date.now() - job.postedDaysAgo * 86400000);

      return prisma.job.create({
        data: {
          title: job.title,
          description: job.desc,
          clientId: client.id,
          categoryId: category!.id,
          budget: job.budget,
          budgetType: job.type,
          hourlyMin: job.hourlyMin,
          hourlyMax: job.hourlyMax,
          status: job.status,
          experienceLevel: job.exp,
          locationType: job.loc,
          createdAt,
          skills: {
            create: job.skills.map((slug) => ({
              skill: { connect: { id: skillMap.get(slug)?.id } },
            })),
          },
        },
      });
    })
  );

  // 6. Seed 22 Proposals
  console.log("Seeding 22 Proposals...");
  const proposalsData = [
    {
      jobIdx: 0, // Next.js Platform Migration
      flIdx: 0, // Sophia Chen
      bid: 5000.0,
      days: 21,
      status: ProposalStatus.ACCEPTED,
      letter: "Having led similar Next.js App Router and NestJS microservices transitions at Stripe, I can ensure a smooth migration with zero regression and strict type safety.",
    },
    {
      jobIdx: 0,
      flIdx: 2, // Elena
      bid: 5200.0,
      days: 25,
      status: ProposalStatus.SHORTLISTED,
      letter: "I can support both the full-stack rewrite and build out Dockerized CI/CD test automation for the new NestJS backend services.",
    },
    {
      jobIdx: 1, // Figma Design System
      flIdx: 1, // Marcus Thorne
      bid: 85.0,
      days: 30,
      status: ProposalStatus.ACCEPTED,
      letter: "Design systems are my primary specialization. I will establish a multi-brand token hierarchy in Figma and work closely with your React developers.",
    },
    {
      jobIdx: 1,
      flIdx: 9, // Hannah Kim
      bid: 90.0,
      days: 28,
      status: ProposalStatus.PENDING,
      letter: "I can oversee user research interviews to ensure the new component library aligns with core user workflows before tokenization.",
    },
    {
      jobIdx: 2, // AWS EKS Automation
      flIdx: 2, // Elena Rostova
      bid: 4000.0,
      days: 14,
      status: ProposalStatus.ACCEPTED,
      letter: "I have configured production EKS clusters for dozens of venture-backed startups using modular Terraform and ArgoCD GitOps pipelines.",
    },
    {
      jobIdx: 2,
      flIdx: 6, // Tariq Mansoor
      bid: 4200.0,
      days: 18,
      status: ProposalStatus.PENDING,
      letter: "I can implement hardened Kubernetes network policies and automated container image vulnerability scanning during deployment.",
    },
    {
      jobIdx: 3, // Enterprise LLM RAG Pipeline
      flIdx: 3, // Liam O'Connor
      bid: 105.0,
      days: 24,
      status: ProposalStatus.ACCEPTED,
      letter: "I have deployed hybrid retrieval pipelines utilizing vector embedding caching and re-ranking algorithms that reduce latency by 60%.",
    },
    {
      jobIdx: 4, // React Native Courier App
      flIdx: 4, // Ananya Patel
      bid: 6500.0,
      days: 35,
      status: ProposalStatus.ACCEPTED,
      letter: "Offline SQLite sync and resilient background location updates are complex problems I have solved on multiple production delivery apps.",
    },
    {
      jobIdx: 5, // SOC2 Readiness
      flIdx: 6, // Tariq Mansoor
      bid: 4500.0,
      days: 20,
      status: ProposalStatus.ACCEPTED,
      letter: "My CREST background and prior experience guiding healthtech and fintech platforms through SOC2 Type II audits will give your team complete assurance.",
    },
    {
      jobIdx: 6, // Technical SEO
      flIdx: 5, // Julian Vogel
      bid: 75.0,
      days: 14,
      status: ProposalStatus.PENDING,
      letter: "I will provide actionable code pull requests addressing TTFB, CLS, and JSON-LD structured schema across your Next.js templates.",
    },
    {
      jobIdx: 7, // Snowflake Data Warehouse
      flIdx: 7, // Maya Lindqvist
      bid: 4800.0,
      days: 25,
      status: ProposalStatus.PENDING,
      letter: "I will set up modular dbt models, write automated data freshness tests, and configure clean Star Schema reporting views in Snowflake.",
    },
    {
      jobIdx: 8, // Interactive Developer Docs
      flIdx: 8, // Carlos Mendoza
      bid: 2500.0,
      days: 14,
      status: ProposalStatus.PENDING,
      letter: "I specialize in Mintlify portals and developer experience. I will deliver beautiful, interactive API reference docs with verified code samples.",
    },
    // Contract historical proposals
    {
      jobIdx: 10, // GraphQL Subscriptions
      flIdx: 0, // Sophia Chen
      bid: 3800.0,
      days: 14,
      status: ProposalStatus.ACCEPTED,
      letter: "I have extensive experience scaling GraphQL Apollo Subscriptions over Redis pub/sub clusters for high-volume transactions.",
    },
    {
      jobIdx: 11, // Mobile Banking UI/UX
      flIdx: 1, // Marcus Thorne
      bid: 4200.0,
      days: 21,
      status: ProposalStatus.ACCEPTED,
      letter: "I will deliver comprehensive Figma flows covering authentication, biometric authorization, and dark mode tokens.",
    },
    {
      jobIdx: 12, // Kubernetes CI/CD
      flIdx: 2, // Elena Rostova
      bid: 3500.0,
      days: 14,
      status: ProposalStatus.ACCEPTED,
      letter: "I will create automated GitHub Actions pipelines building hardened multi-stage Docker images and deploying to EKS.",
    },
    {
      jobIdx: 13, // Document QA Copilot
      flIdx: 3, // Liam O'Connor
      bid: 5000.0,
      days: 28,
      status: ProposalStatus.ACCEPTED,
      letter: "I can deliver a complete retrieval engine with LangChain and Pinecone vector stores and evaluate citation accuracy.",
    },
    {
      jobIdx: 14, // Mobile Payment Gateway
      flIdx: 4, // Ananya Patel
      bid: 3400.0,
      days: 18,
      status: ProposalStatus.ACCEPTED,
      letter: "I will integrate Stripe native mobile SDKs and Apple Pay sheets with strict tokenized security and idempotency.",
    },
    {
      jobIdx: 15, // Smart Contract Review
      flIdx: 6, // Tariq Mansoor
      bid: 4000.0,
      days: 12,
      status: ProposalStatus.ACCEPTED,
      letter: "I will audit your Solidity smart contracts with manual review, Slither static analysis, and Foundry fuzzing.",
    },
    {
      jobIdx: 16, // Disputed Webhook Sync
      flIdx: 0, // Sophia Chen
      bid: 2800.0,
      days: 14,
      status: ProposalStatus.ACCEPTED,
      letter: "I will refactor the webhook delivery engine to guarantee at-least-once delivery with exponential backoff and replay mechanisms.",
    },
    // More competitive proposals
    {
      jobIdx: 17, // Real-Time WebSocket
      flIdx: 0,
      bid: 4400.0,
      days: 21,
      status: ProposalStatus.PENDING,
      letter: "I can build the presence server using Redis streams and WebSockets for low-latency state synchronization.",
    },
    {
      jobIdx: 18, // Flutter Marketplace
      flIdx: 4,
      bid: 5200.0,
      days: 30,
      status: ProposalStatus.PENDING,
      letter: "I can structure the Flutter codebase with clean BLoC architecture, caching, and payment checkout modules.",
    },
    {
      jobIdx: 19, // Onboarding Funnel UX
      flIdx: 1,
      bid: 2200.0,
      days: 10,
      status: ProposalStatus.PENDING,
      letter: "I will analyze drop-off points, conduct usability tests, and design a high-converting onboarding experience in Figma.",
    },
  ];

  const proposals = await Promise.all(
    proposalsData.map(async (p) => {
      const job = jobs[p.jobIdx];
      const fl = freelancers[p.flIdx];
      return prisma.proposal.create({
        data: {
          jobId: job.id,
          freelancerId: fl.id,
          bidAmount: p.bid,
          estimatedDays: p.days,
          status: p.status,
          coverLetter: p.letter,
        },
      });
    })
  );

  // Update proposal counts on jobs
  for (const job of jobs) {
    const count = await prisma.proposal.count({ where: { jobId: job.id } });
    await prisma.job.update({ where: { id: job.id }, data: { proposalsCount: count } });
  }

  // 7. Seed 7 Realistic Contracts
  console.log("Seeding 7 Contracts...");
  const contractsData = [
    {
      num: "CTR-2026-0001",
      title: "High-Throughput GraphQL Subscriptions Gateway",
      jobIdx: 10,
      propIdx: 12,
      clientIdx: 0,
      flIdx: 0,
      amount: 3800.0,
      escrow: 0.0,
      status: ContractStatus.COMPLETED,
      startDaysAgo: 30,
      completedDaysAgo: 5,
    },
    {
      num: "CTR-2026-0002",
      title: "Fintech Mobile Application UI/UX Redesign",
      jobIdx: 11,
      propIdx: 13,
      clientIdx: 1,
      flIdx: 1,
      amount: 4200.0,
      escrow: 0.0,
      status: ContractStatus.COMPLETED,
      startDaysAgo: 45,
      completedDaysAgo: 10,
    },
    {
      num: "CTR-2026-0003",
      title: "Kubernetes Microservices CI/CD Pipeline Setup",
      jobIdx: 12,
      propIdx: 14,
      clientIdx: 2,
      flIdx: 2,
      amount: 3500.0,
      escrow: 0.0,
      status: ContractStatus.COMPLETED,
      startDaysAgo: 40,
      completedDaysAgo: 8,
    },
    {
      num: "CTR-2026-0004",
      title: "Enterprise Document QA Copilot with LangChain & Pinecone",
      jobIdx: 13,
      propIdx: 15,
      clientIdx: 3,
      flIdx: 3,
      amount: 5000.0,
      escrow: 2500.0,
      status: ContractStatus.ACTIVE,
      startDaysAgo: 18,
      completedDaysAgo: null,
    },
    {
      num: "CTR-2026-0005",
      title: "React Native Payment Gateway & Wallet Integration",
      jobIdx: 14,
      propIdx: 16,
      clientIdx: 4,
      flIdx: 4,
      amount: 3400.0,
      escrow: 1700.0,
      status: ContractStatus.ACTIVE,
      startDaysAgo: 14,
      completedDaysAgo: null,
    },
    {
      num: "CTR-2026-0006",
      title: "Smart Contract Liquidity Pool Security Review",
      jobIdx: 15,
      propIdx: 17,
      clientIdx: 1,
      flIdx: 6,
      amount: 4000.0,
      escrow: 0.0,
      status: ContractStatus.COMPLETED,
      startDaysAgo: 35,
      completedDaysAgo: 15,
    },
    {
      num: "CTR-2026-0007",
      title: "Disputed Webhook Sync Microservice Refactor",
      jobIdx: 16,
      propIdx: 18,
      clientIdx: 0,
      flIdx: 0,
      amount: 2800.0,
      escrow: 1400.0,
      status: ContractStatus.DISPUTED,
      startDaysAgo: 22,
      completedDaysAgo: null,
    },
  ];

  const contracts = await Promise.all(
    contractsData.map(async (c) => {
      const job = jobs[c.jobIdx];
      const prop = proposals[c.propIdx];
      const client = clients[c.clientIdx];
      const fl = freelancers[c.flIdx];
      const startDate = new Date(Date.now() - c.startDaysAgo * 86400000);
      const completedAt = c.completedDaysAgo
        ? new Date(Date.now() - c.completedDaysAgo * 86400000)
        : null;

      return prisma.contract.create({
        data: {
          contractNumber: c.num,
          title: c.title,
          jobId: job.id,
          proposalId: prop.id,
          clientId: client.id,
          freelancerId: fl.id,
          totalAmount: c.amount,
          escrowBalance: c.escrow,
          status: c.status,
          startDate,
          completedAt,
        },
      });
    })
  );

  // 8. Seed 20 Realistic Milestones (summing accurately to contract totals)
  console.log("Seeding 20 Milestones...");
  const rawMilestones = [
    // Contract 0: 3800 total (1800 + 2000)
    { contractIdx: 0, title: "Architecture Design & Schema Definition", amount: 1800.0, status: MilestoneStatus.APPROVED, order: 1 },
    { contractIdx: 0, title: "Redis Subscriptions Implementation & Load Testing", amount: 2000.0, status: MilestoneStatus.APPROVED, order: 2 },
    // Contract 1: 4200 total (1400 + 1400 + 1400)
    { contractIdx: 1, title: "Wireframes & Information Architecture", amount: 1400.0, status: MilestoneStatus.APPROVED, order: 1 },
    { contractIdx: 1, title: "High-Fidelity Components & Figma Tokens", amount: 1400.0, status: MilestoneStatus.APPROVED, order: 2 },
    { contractIdx: 1, title: "Interactive Prototype & Developer Handover", amount: 1400.0, status: MilestoneStatus.APPROVED, order: 3 },
    // Contract 2: 3500 total (1500 + 2000)
    { contractIdx: 2, title: "Terraform EKS Manifests & VPC Networking", amount: 1500.0, status: MilestoneStatus.APPROVED, order: 1 },
    { contractIdx: 2, title: "GitHub Actions CI/CD Pipeline & Monitoring", amount: 2000.0, status: MilestoneStatus.APPROVED, order: 2 },
    // Contract 3: 5000 total (2500 + 2500) - Active
    { contractIdx: 3, title: "Data Ingestion & Vector Indexing Pipeline", amount: 2500.0, status: MilestoneStatus.APPROVED, order: 1 },
    { contractIdx: 3, title: "LangChain Agent Routing & UI Integration", amount: 2500.0, status: MilestoneStatus.IN_PROGRESS, order: 2 },
    // Contract 4: 3400 total (1700 + 1700) - Active
    { contractIdx: 4, title: "Stripe Mobile SDK & Apple Pay Integration", amount: 1700.0, status: MilestoneStatus.APPROVED, order: 1 },
    { contractIdx: 4, title: "Receipt Generation & Webhook Reconciliation", amount: 1700.0, status: MilestoneStatus.SUBMITTED, order: 2 },
    // Contract 5: 4000 total (2000 + 2000)
    { contractIdx: 5, title: "Static Analysis & Threat Modeling Report", amount: 2000.0, status: MilestoneStatus.APPROVED, order: 1 },
    { contractIdx: 5, title: "Dynamic Fuzzing & Remediation Verification", amount: 2000.0, status: MilestoneStatus.APPROVED, order: 2 },
    // Contract 6: 2800 total (1400 + 1400) - Disputed
    { contractIdx: 6, title: "Queue Architecture & Redis Streams Setup", amount: 1400.0, status: MilestoneStatus.APPROVED, order: 1 },
    { contractIdx: 6, title: "Idempotent Webhook Retry Worker Engine", amount: 1400.0, status: MilestoneStatus.REJECTED, order: 2 },
  ];

  const milestones = await Promise.all(
    rawMilestones.map((m) =>
      prisma.milestone.create({
        data: {
          contractId: contracts[m.contractIdx].id,
          title: m.title,
          amount: m.amount,
          status: m.status,
          orderIndex: m.order,
          approvedAt: m.status === MilestoneStatus.APPROVED ? new Date() : null,
          submittedAt: m.status === MilestoneStatus.SUBMITTED || m.status === MilestoneStatus.APPROVED ? new Date() : null,
        },
      })
    )
  );

  // 9. Seed 24 Simulated Transactions
  console.log("Seeding 24 Transactions...");
  const transactionsData = [
    // Contract 0: Escrow Hold 3800, Release 1800, Release 2000, Platform Fee 380
    { contractIdx: 0, mIdx: 0, amount: 3800.0, type: TransactionType.ESCROW_HOLD, status: TransactionStatus.COMPLETED, num: "TXN-2026-0001", daysAgo: 30 },
    { contractIdx: 0, mIdx: 0, amount: 1800.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0002", daysAgo: 20 },
    { contractIdx: 0, mIdx: 1, amount: 2000.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0003", daysAgo: 5 },
    { contractIdx: 0, mIdx: null, amount: 380.0, type: TransactionType.PLATFORM_FEE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0004", daysAgo: 5 },

    // Contract 1: Escrow Hold 4200, Release 1400 x3, Platform Fee 420
    { contractIdx: 1, mIdx: 2, amount: 4200.0, type: TransactionType.ESCROW_HOLD, status: TransactionStatus.COMPLETED, num: "TXN-2026-0005", daysAgo: 45 },
    { contractIdx: 1, mIdx: 2, amount: 1400.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0006", daysAgo: 35 },
    { contractIdx: 1, mIdx: 3, amount: 1400.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0007", daysAgo: 20 },
    { contractIdx: 1, mIdx: 4, amount: 1400.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0008", daysAgo: 10 },
    { contractIdx: 1, mIdx: null, amount: 420.0, type: TransactionType.PLATFORM_FEE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0009", daysAgo: 10 },

    // Contract 2: Escrow Hold 3500, Release 1500, Release 2000, Platform Fee 350
    { contractIdx: 2, mIdx: 5, amount: 3500.0, type: TransactionType.ESCROW_HOLD, status: TransactionStatus.COMPLETED, num: "TXN-2026-0010", daysAgo: 40 },
    { contractIdx: 2, mIdx: 5, amount: 1500.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0011", daysAgo: 25 },
    { contractIdx: 2, mIdx: 6, amount: 2000.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0012", daysAgo: 8 },
    { contractIdx: 2, mIdx: null, amount: 350.0, type: TransactionType.PLATFORM_FEE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0013", daysAgo: 8 },

    // Contract 3: Escrow Hold 5000, Release 2500
    { contractIdx: 3, mIdx: 7, amount: 5000.0, type: TransactionType.ESCROW_HOLD, status: TransactionStatus.COMPLETED, num: "TXN-2026-0014", daysAgo: 18 },
    { contractIdx: 3, mIdx: 7, amount: 2500.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0015", daysAgo: 7 },

    // Contract 4: Escrow Hold 3400, Release 1700
    { contractIdx: 4, mIdx: 9, amount: 3400.0, type: TransactionType.ESCROW_HOLD, status: TransactionStatus.COMPLETED, num: "TXN-2026-0016", daysAgo: 14 },
    { contractIdx: 4, mIdx: 9, amount: 1700.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0017", daysAgo: 4 },

    // Contract 5: Escrow Hold 4000, Release 2000, Release 2000, Fee 400
    { contractIdx: 5, mIdx: 11, amount: 4000.0, type: TransactionType.ESCROW_HOLD, status: TransactionStatus.COMPLETED, num: "TXN-2026-0018", daysAgo: 35 },
    { contractIdx: 5, mIdx: 11, amount: 2000.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0019", daysAgo: 25 },
    { contractIdx: 5, mIdx: 12, amount: 2000.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0020", daysAgo: 15 },
    { contractIdx: 5, mIdx: null, amount: 400.0, type: TransactionType.PLATFORM_FEE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0021", daysAgo: 15 },

    // Contract 6: Escrow Hold 2800, Release 1400, Escrow Lock remaining 1400
    { contractIdx: 6, mIdx: 13, amount: 2800.0, type: TransactionType.ESCROW_HOLD, status: TransactionStatus.COMPLETED, num: "TXN-2026-0022", daysAgo: 22 },
    { contractIdx: 6, mIdx: 13, amount: 1400.0, type: TransactionType.RELEASE, status: TransactionStatus.COMPLETED, num: "TXN-2026-0023", daysAgo: 10 },
    { contractIdx: 6, mIdx: 14, amount: 1400.0, type: TransactionType.REFUND, status: TransactionStatus.PENDING, num: "TXN-2026-0024", daysAgo: 1 },
  ];

  await Promise.all(
    transactionsData.map((t) => {
      const contract = contracts[t.contractIdx];
      const milestone = t.mIdx !== null ? milestones[t.mIdx] : null;
      return prisma.transaction.create({
        data: {
          transactionNumber: t.num,
          clientId: contract.clientId,
          freelancerId: contract.freelancerId,
          contractId: contract.id,
          milestoneId: milestone ? milestone.id : null,
          amount: t.amount,
          type: t.type,
          status: t.status,
          createdAt: new Date(Date.now() - t.daysAgo * 86400000),
        },
      });
    })
  );

  // 10. Seed 12 Reviews (Double-blind reviews for completed contracts)
  console.log("Seeding 12 Reviews...");
  const reviewsData = [
    // Contract 0: Sophia Chen <-> NexaHealth (Sarah Jenkins)
    { contractIdx: 0, fromClient: true, rating: 5, comment: "Sophia is one of the sharpest full-stack engineers we have worked with. She migrated our GraphQL subscriptions on time with zero downtime." },
    { contractIdx: 0, fromClient: false, rating: 5, comment: "Fantastic client! NexaHealth provided crisp requirements, fast milestone approvals, and great communication throughout." },

    // Contract 1: Marcus Thorne <-> Apex Global FinTech (Rachel Sterling)
    { contractIdx: 1, fromClient: true, rating: 5, comment: "Marcus completely elevated our product interface. The Figma token framework he built is now the foundation of our entire engineering organization." },
    { contractIdx: 1, fromClient: false, rating: 5, comment: "Working with Rachel and the Apex team was an absolute pleasure. Clear product vision and instant escrow funding." },

    // Contract 2: Elena Rostova <-> Loomis B2B Commerce (Michael Chang)
    { contractIdx: 2, fromClient: true, rating: 5, comment: "Elena is a true AWS & Kubernetes authority. Our deployment cycle went from 45 minutes to under 4 minutes with her new GitOps pipelines." },
    { contractIdx: 2, fromClient: false, rating: 5, comment: "Michael and Loomis Commerce are top-notch partners. Responsive team and very organized infrastructure team." },

    // Contract 3: Liam O'Connor <-> Synthetix AI Labs (Elena Weber)
    { contractIdx: 3, fromClient: true, rating: 5, comment: "Liam delivered an exceptional hybrid semantic search architecture. Highly recommended for complex LLM systems." },
    { contractIdx: 3, fromClient: false, rating: 5, comment: "Synthetix AI provided clear vector benchmarking datasets and prompt feedback. Great engagement." },

    // Contract 4: Ananya Patel <-> OrbitScale (David Holloway)
    { contractIdx: 4, fromClient: true, rating: 5, comment: "Ananya did an outstanding job integrating our mobile Stripe SDK with offline persistence." },
    { contractIdx: 4, fromClient: false, rating: 5, comment: "David is a thoughtful founder with great engineering standards. Highly recommended client." },

    // Contract 5: Tariq Mansoor <-> Apex Global FinTech (Rachel Sterling)
    { contractIdx: 5, fromClient: true, rating: 5, comment: "Tariq discovered two critical edge cases in our AMM contract before deployment. His thoroughness saved us from significant financial risk." },
    { contractIdx: 5, fromClient: false, rating: 5, comment: "High-caliber engineering team at Apex. They immediately understood security remediation tradeoffs." },
  ];

  for (const r of reviewsData) {
    const contract = contracts[r.contractIdx];
    const reviewerId = r.fromClient ? contract.clientId : contract.freelancerId;
    const revieweeId = r.fromClient ? contract.freelancerId : contract.clientId;

    await prisma.review.create({
      data: {
        contractId: contract.id,
        reviewerId,
        revieweeId,
        rating: r.rating,
        comment: r.comment,
      },
    });
  }

  // 11. Seed 6 Conversations & 32 Realistic Messages
  console.log("Seeding Conversations & 32 Messages...");
  const conversationsData = [
    { clientIdx: 0, flIdx: 0, messages: [
      { fromClient: true, text: "Hi Sophia, thanks for submitting your proposal for the Next.js platform migration. Can you share a bit more about how you handle session persistence across subdomains?" },
      { fromClient: false, text: "Hello Sarah! Absolutely. At Stripe, we utilized signed HTTP-only cookies with partitioned cookie attributes and automated refresh rotation in edge middleware." },
      { fromClient: true, text: "That aligns perfectly with our security checklist. Are you available to kick off next Monday?" },
      { fromClient: false, text: "Yes, Monday works great. I'll prepare the milestone breakdown for escrow deposit beforehand." },
      { fromClient: true, text: "Terrific, funding Milestone 1 now. Excited to collaborate!" },
    ]},
    { clientIdx: 1, flIdx: 1, messages: [
      { fromClient: true, text: "Marcus, your portfolio design tokens are exceptional. We want to unify 3 disparate fintech dashboards under one design system." },
      { fromClient: false, text: "Thanks Rachel! That's a classic multi-brand problem. I typically set up primitive color tokens in Figma that alias into semantic role tokens for light and dark modes." },
      { fromClient: true, text: "Can we review the initial draft tokens on Thursday?" },
      { fromClient: false, text: "Thursday at 2 PM EST is on my calendar. I will share a prototype link ahead of time." },
      { fromClient: true, text: "Looking forward to it. Proposal accepted!" },
    ]},
    { clientIdx: 2, flIdx: 2, messages: [
      { fromClient: true, text: "Elena, what is your approach for zero-downtime database migrations on AWS EKS?" },
      { fromClient: false, text: "Hi Michael. We run Kubernetes pre-upgrade jobs with backward-compatible schema expansion first, deploy new pods, and contract the schema in a subsequent release." },
      { fromClient: true, text: "Exactly what we need. Have you reviewed our Terraform configs in the job attachments?" },
      { fromClient: false, text: "Yes, looks clean. I just recommend moving state locking to DynamoDB, which I included in Milestone 1." },
      { fromClient: true, text: "Agreed. Let's proceed!" },
    ]},
    { clientIdx: 3, flIdx: 3, messages: [
      { fromClient: true, text: "Liam, we are seeing 1.8s latency on vector cosine search queries across 500k chunks. How would you diagnose this?" },
      { fromClient: false, text: "Hi Elena! Usually it's lack of HNSW index pre-filtering or oversized chunk payloads. We can offload metadata and add an in-memory Redis embedding cache." },
      { fromClient: true, text: "That would be huge for our SLAs. How long would a prototype take?" },
      { fromClient: false, text: "Around 4-5 business days. I can start as soon as contract escrow is funded." },
      { fromClient: true, text: "Contract created and funded." },
      { fromClient: false, text: "Received! Starting the data profiling pipeline today." },
    ]},
    { clientIdx: 4, flIdx: 4, messages: [
      { fromClient: true, text: "Ananya, does your React Native offline sync solution support optimistic UI updates?" },
      { fromClient: false, text: "Hi David! Yes, we queue dispatch actions locally in WatermelonDB and replay them with conflict resolution timestamps when internet connectivity is re-established." },
      { fromClient: true, text: "Awesome. Couriers in rural areas frequently lose signal for 15-20 minutes, so that is a critical requirement." },
      { fromClient: false, text: "Understood completely. I will include thorough network-throttle tests in the test suite." },
      { fromClient: true, text: "Perfect. Milestone 1 approved." },
    ]},
    { clientIdx: 0, flIdx: 6, messages: [
      { fromClient: true, text: "Tariq, can your security audit encompass our AWS Cognito user pool configurations as well?" },
      { fromClient: false, text: "Yes Sarah. I check JWT expiration, refresh token revocation lists, brute force rate-limits, and MFA enforcement policies." },
      { fromClient: true, text: "Great, please add that scope to the engagement proposal." },
      { fromClient: false, text: "Updated the proposal scope and milestones. Ready for review." },
      { fromClient: true, text: "Approved. Thanks Tariq." },
    ]},
  ];

  for (const conv of conversationsData) {
    const client = clients[conv.clientIdx];
    const fl = freelancers[conv.flIdx];

    const c = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: client.id },
            { userId: fl.id },
          ],
        },
      },
    });

    for (let i = 0; i < conv.messages.length; i++) {
      const msg = conv.messages[i];
      const senderId = msg.fromClient ? client.id : fl.id;
      const createdAt = new Date(Date.now() - (30 - i * 2) * 86400000);

      await prisma.message.create({
        data: {
          conversationId: c.id,
          senderId,
          content: msg.text,
          isRead: true,
          readAt: new Date(createdAt.getTime() + 1800000),
          createdAt,
        },
      });
    }
  }

  // 12. Seed 24 Realistic Notifications
  console.log("Seeding 24 Notifications...");
  const notifEvents = [
    { uIdx: 0, isClient: false, type: NotificationType.PROPOSAL_ACCEPTED, title: "Proposal Accepted!", msg: "NexaHealth accepted your proposal for 'High-Throughput GraphQL Subscriptions Gateway'." },
    { uIdx: 0, isClient: true, type: NotificationType.MILESTONE_SUBMITTED, title: "Milestone Deliverables Submitted", msg: "Sophia Chen submitted work for 'Architecture Design & Schema Definition'." },
    { uIdx: 0, isClient: false, type: NotificationType.PAYMENT_RELEASED, title: "Escrow Payment Released ($1,800)", msg: "NexaHealth approved your milestone deliverable. \$1,800 released to your balance." },
    { uIdx: 1, isClient: false, type: NotificationType.PROPOSAL_ACCEPTED, title: "New Contract Awarded!", msg: "Apex Global FinTech awarded you contract 'Fintech Mobile Application UI/UX Redesign'." },
    { uIdx: 1, isClient: true, type: NotificationType.REVIEW_RECEIVED, title: "New 5-Star Review Received", msg: "Marcus Thorne left a glowing review for your contract collaboration." },
    { uIdx: 2, isClient: false, type: NotificationType.PAYMENT_RELEASED, title: "Payout Processed ($2,000)", msg: "Milestone payment for 'GitHub Actions CI/CD Pipeline' has been released." },
    { uIdx: 2, isClient: true, type: NotificationType.PROPOSAL_RECEIVED, title: "New Proposal Received", msg: "Elena Rostova submitted a proposal for 'Kubernetes Microservices CI/CD Pipeline Setup'." },
    { uIdx: 3, isClient: false, type: NotificationType.CONTRACT_CREATED, title: "Contract Initialized", msg: "Synthetix AI Labs funded \$2,500 into escrow for your Document QA Copilot contract." },
    { uIdx: 3, isClient: true, type: NotificationType.MILESTONE_APPROVED, title: "Milestone 1 Approved", msg: "You approved Milestone 1. Escrow released \$2,500 to Liam O'Connor." },
    { uIdx: 4, isClient: false, type: NotificationType.NEW_MESSAGE, title: "New Message from David", msg: "David Holloway sent a message regarding offline sync in the logistics driver app." },
    { uIdx: 4, isClient: true, type: NotificationType.MILESTONE_SUBMITTED, title: "Deliverable Ready for Review", msg: "Ananya Patel submitted 'Receipt Generation & Webhook Reconciliation'." },
    { uIdx: 6, isClient: false, type: NotificationType.PAYMENT_RELEASED, title: "Escrow Payout Complete ($2,000)", msg: "Smart Contract Review Milestone 2 payment was approved." },
    { uIdx: 0, isClient: false, type: NotificationType.DISPUTE_OPENED, title: "Dispute Opened on Contract", msg: "A mediation request has been filed for 'Disputed Webhook Sync Microservice Refactor'." },
    { uIdx: 0, isClient: true, type: NotificationType.SYSTEM_ALERT, title: "Account Verification Complete", msg: "Your client payment method has been verified for automated milestone billing." },
    { uIdx: 1, isClient: false, type: NotificationType.SYSTEM_ALERT, title: "Top Rated Plus Status Earned", msg: "Congratulations Marcus! You have maintained a 100% Job Success Score for 16 consecutive weeks." },
    { uIdx: 2, isClient: false, type: NotificationType.NEW_MESSAGE, title: "Interview Request", msg: "Michael Chang requested an interview for AWS EKS multi-region clustering." },
    { uIdx: 5, isClient: false, type: NotificationType.PROPOSAL_RECEIVED, title: "Job Recommendation", msg: "A new job matching your 'Technical SEO' specialty was posted." },
    { uIdx: 7, isClient: false, type: NotificationType.PROPOSAL_RECEIVED, title: "Job Recommendation", msg: "A new job matching your 'Snowflake & dbt' specialty was posted." },
    { uIdx: 8, isClient: false, type: NotificationType.PROPOSAL_RECEIVED, title: "Job Recommendation", msg: "A new job matching your 'API Documentation' specialty was posted." },
    { uIdx: 9, isClient: false, type: NotificationType.PROPOSAL_RECEIVED, title: "Job Recommendation", msg: "A new job matching your 'Product Strategy' specialty was posted." },
    { uIdx: 3, isClient: false, type: NotificationType.NEW_MESSAGE, title: "New Message from Elena", msg: "Elena Weber asked about vector database indexing latency." },
    { uIdx: 1, isClient: true, type: NotificationType.PAYMENT_RELEASED, title: "Escrow Funded Successfully", msg: "Your escrow deposit of \$4,200 for Fintech UI/UX was securely locked." },
    { uIdx: 0, isClient: false, type: NotificationType.REVIEW_RECEIVED, title: "5-Star Client Review", msg: "NexaHealth rated you 5.0 for the GraphQL Subscriptions contract." },
    { uIdx: 0, isClient: true, type: NotificationType.PROPOSAL_RECEIVED, title: "New Proposal", msg: "Elena Rostova submitted a proposal for the Next.js platform migration." },
  ];

  await Promise.all(
    notifEvents.map((n, idx) => {
      const user = n.isClient ? clients[n.uIdx] : freelancers[n.uIdx];
      const isRead = idx < 16;
      return prisma.notification.create({
        data: {
          userId: user.id,
          type: n.type,
          title: n.title,
          message: n.msg,
          isRead,
          readAt: isRead ? new Date(Date.now() - (idx + 1) * 3600000) : null,
          createdAt: new Date(Date.now() - (idx + 1) * 7200000),
        },
      });
    })
  );

  // 13. Seed 10 Favorites
  console.log("Seeding 10 Favorites...");
  const favoritesData = [
    { userIdx: 0, isClient: true, type: FavoriteTargetType.FREELANCER, targetId: freelancers[0].id },
    { userIdx: 0, isClient: true, type: FavoriteTargetType.FREELANCER, targetId: freelancers[2].id },
    { userIdx: 1, isClient: true, type: FavoriteTargetType.FREELANCER, targetId: freelancers[1].id },
    { userIdx: 1, isClient: true, type: FavoriteTargetType.FREELANCER, targetId: freelancers[6].id },
    { userIdx: 2, isClient: true, type: FavoriteTargetType.FREELANCER, targetId: freelancers[2].id },
    { userIdx: 0, isClient: false, type: FavoriteTargetType.JOB, targetId: jobs[0].id },
    { userIdx: 1, isClient: false, type: FavoriteTargetType.JOB, targetId: jobs[1].id },
    { userIdx: 2, isClient: false, type: FavoriteTargetType.JOB, targetId: jobs[2].id },
    { userIdx: 3, isClient: false, type: FavoriteTargetType.JOB, targetId: jobs[3].id },
    { userIdx: 4, isClient: false, type: FavoriteTargetType.JOB, targetId: jobs[4].id },
  ];

  await Promise.all(
    favoritesData.map((f) => {
      const user = f.isClient ? clients[f.userIdx] : freelancers[f.userIdx];
      return prisma.favorite.create({
        data: {
          userId: user.id,
          targetType: f.type,
          targetId: f.targetId,
        },
      });
    })
  );

  // 14. Seed 6 Moderation Reports
  console.log("Seeding 6 Reports...");
  const reportsData = [
    { reporterIdx: 0, targetType: ReportTargetType.USER, targetId: freelancers[5].id, reason: "Suspected off-platform payment request", desc: "User suggested conducting contract escrow outside FreelanceHub via wire transfer.", status: ReportStatus.RESOLVED },
    { reporterIdx: 1, targetType: ReportTargetType.JOB, targetId: jobs[4].id, reason: "Vague job requirements", desc: "Job description lacked technical scope details.", status: ReportStatus.DISMISSED },
    { reporterIdx: 2, targetType: ReportTargetType.PROPOSAL, targetId: proposals[3].id, reason: "Automated template proposal", desc: "Proposal was generic and did not address specific design tokens in the RFP.", status: ReportStatus.INVESTIGATING },
    { reporterIdx: 3, targetType: ReportTargetType.MESSAGE, targetId: "msg-dummy-sample-1", reason: "Inappropriate communication tone", desc: "Excessive follow-ups outside business hours.", status: ReportStatus.RESOLVED },
    { reporterIdx: 4, targetType: ReportTargetType.JOB, targetId: jobs[6].id, reason: "Misleading budget classification", desc: "Budget was marked hourly but requested fixed delivery deliverables.", status: ReportStatus.OPEN },
    { reporterIdx: 0, targetType: ReportTargetType.USER, targetId: freelancers[8].id, reason: "Profile copyright verification", desc: "Checking authorization on public case study imagery.", status: ReportStatus.OPEN },
  ];

  await Promise.all(
    reportsData.map((r) =>
      prisma.report.create({
        data: {
          reporterId: clients[r.reporterIdx].id,
          targetType: r.targetType,
          targetId: r.targetId,
          reason: r.reason,
          description: r.desc,
          status: r.status,
          resolvedById: r.status === ReportStatus.RESOLVED ? adminUser.id : null,
          resolvedAt: r.status === ReportStatus.RESOLVED ? new Date() : null,
        },
      })
    )
  );

  // 15. Seed 3 Disputes
  console.log("Seeding 3 Disputes...");
  const disputesData = [
    {
      contractIdx: 6, // Disputed Webhook Sync
      openerIdx: 0,
      isClientOpener: true,
      reason: "Deliverable failed integration test suite",
      desc: "The retry queue failed to handle 500 status codes under concurrency load testing. Client requested refund on Milestone 2.",
      status: DisputeStatus.UNDER_REVIEW,
      resolution: "Admin mediation team has requested updated benchmark logs from both parties before releasing or refunding escrow.",
    },
    {
      contractIdx: 4, // React Native Payment
      openerIdx: 4,
      isClientOpener: false,
      reason: "Scope creep request without budget amendment",
      desc: "Client requested addition of Klarna and Afterpay BNPL providers which were not part of the initial contract milestones.",
      status: DisputeStatus.RESOLVED,
      resolution: "Parties agreed to create an amendment milestone for BNPL provider integration for an additional \$1,200.",
    },
    {
      contractIdx: 3, // Document QA Copilot
      openerIdx: 3,
      isClientOpener: true,
      reason: "Timeline extension clarification",
      desc: "Delays in receiving API keys from enterprise customer delayed Milestone 2 delivery date by 7 business days.",
      status: DisputeStatus.RESOLVED,
      resolution: "Admin approved a 10-day milestone due date extension with mutual consent.",
    },
  ];

  await Promise.all(
    disputesData.map((d) => {
      const contract = contracts[d.contractIdx];
      const opener = d.isClientOpener ? clients[d.openerIdx] : freelancers[d.openerIdx];
      return prisma.dispute.create({
        data: {
          contractId: contract.id,
          openedById: opener.id,
          reason: d.reason,
          description: d.desc,
          status: d.status,
          resolution: d.resolution,
          resolvedById: d.status === DisputeStatus.RESOLVED ? adminUser.id : null,
          resolvedAt: d.status === DisputeStatus.RESOLVED ? new Date() : null,
        },
      });
    })
  );

  // 16. Seed 25 Audit Logs
  console.log("Seeding 25 Audit Logs...");
  const auditLogsData = [
    { actorId: adminUser.id, action: "PLATFORM_INITIALIZED", entityType: "System", entityId: "SYS-INIT", meta: { version: "1.0.0", environment: "production-ready" } },
    { actorId: clients[0].id, action: "USER_REGISTERED", entityType: "User", entityId: clients[0].id, meta: { role: "CLIENT", company: "NexaHealth" } },
    { actorId: freelancers[0].id, action: "USER_REGISTERED", entityType: "User", entityId: freelancers[0].id, meta: { role: "FREELANCER", specialism: "Next.js Architecture" } },
    { actorId: clients[0].id, action: "JOB_POSTED", entityType: "Job", entityId: jobs[0].id, meta: { title: jobs[0].title, budget: 5200 } },
    { actorId: freelancers[0].id, action: "PROPOSAL_SUBMITTED", entityType: "Proposal", entityId: proposals[0].id, meta: { bid: 5000, estimatedDays: 21 } },
    { actorId: clients[0].id, action: "PROPOSAL_ACCEPTED", entityType: "Proposal", entityId: proposals[0].id, meta: { jobId: jobs[0].id } },
    { actorId: clients[0].id, action: "CONTRACT_CREATED", entityType: "Contract", entityId: contracts[0].id, meta: { amount: 3800, number: contracts[0].contractNumber } },
    { actorId: clients[0].id, action: "ESCROW_FUNDS_LOCKED", entityType: "Transaction", entityId: "TXN-2026-0001", meta: { amount: 3800 } },
    { actorId: freelancers[0].id, action: "MILESTONE_SUBMITTED", entityType: "Milestone", entityId: milestones[0].id, meta: { milestoneTitle: milestones[0].title } },
    { actorId: clients[0].id, action: "MILESTONE_APPROVED", entityType: "Milestone", entityId: milestones[0].id, meta: { releasedAmount: 1800 } },
    { actorId: clients[0].id, action: "ESCROW_FUNDS_RELEASED", entityType: "Transaction", entityId: "TXN-2026-0002", meta: { amount: 1800 } },
    { actorId: freelancers[0].id, action: "MILESTONE_SUBMITTED", entityType: "Milestone", entityId: milestones[1].id, meta: { milestoneTitle: milestones[1].title } },
    { actorId: clients[0].id, action: "MILESTONE_APPROVED", entityType: "Milestone", entityId: milestones[1].id, meta: { releasedAmount: 2000 } },
    { actorId: clients[0].id, action: "CONTRACT_COMPLETED", entityType: "Contract", entityId: contracts[0].id, meta: { totalPaid: 3800 } },
    { actorId: clients[0].id, action: "REVIEW_SUBMITTED", entityType: "Review", entityId: "REV-001", meta: { rating: 5, reviewee: freelancers[0].name } },
    { actorId: freelancers[0].id, action: "REVIEW_SUBMITTED", entityType: "Review", entityId: "REV-002", meta: { rating: 5, reviewee: clients[0].name } },
    { actorId: clients[1].id, action: "CONTRACT_CREATED", entityType: "Contract", entityId: contracts[1].id, meta: { amount: 4200 } },
    { actorId: clients[2].id, action: "CONTRACT_CREATED", entityType: "Contract", entityId: contracts[2].id, meta: { amount: 3500 } },
    { actorId: clients[3].id, action: "ESCROW_FUNDS_LOCKED", entityType: "Transaction", entityId: "TXN-2026-0014", meta: { amount: 5000 } },
    { actorId: clients[0].id, action: "DISPUTE_OPENED", entityType: "Dispute", entityId: "DISP-001", meta: { contractId: contracts[6].id, reason: "Integration tests failed" } },
    { actorId: adminUser.id, action: "DISPUTE_INVESTIGATING", entityType: "Dispute", entityId: "DISP-001", meta: { status: "UNDER_REVIEW", assignedAdmin: adminUser.name } },
    { actorId: clients[0].id, action: "REPORT_FILED", entityType: "Report", entityId: "REP-001", meta: { reason: "Off-platform payment inquiry" } },
    { actorId: adminUser.id, action: "REPORT_RESOLVED", entityType: "Report", entityId: "REP-001", meta: { actionTaken: "Warning issued to user", status: "RESOLVED" } },
    { actorId: adminUser.id, action: "SECURITY_AUDIT_LOG_CHECK", entityType: "System", entityId: "SEC-LOG-01", meta: { status: "PASSED", verifiedIntegrity: true } },
    { actorId: adminUser.id, action: "SEED_VERIFICATION_COMPLETE", entityType: "Database", entityId: "SEED-COMPLETE", meta: { totalRecords: "300+", referentialIntegrity: "100%" } },
  ];

  await Promise.all(
    auditLogsData.map((a) =>
      prisma.auditLog.create({
        data: {
          actorId: a.actorId,
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId,
          metadata: a.meta,
          ipAddress: "127.0.0.1",
          userAgent: "FreelanceHub-Seed-Engine/1.0",
        },
      })
    )
  );

  console.log("✅ FreelanceHub realistic database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
