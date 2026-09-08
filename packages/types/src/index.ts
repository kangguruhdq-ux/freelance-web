// Core Enums
export type UserRole = 'CLIENT' | 'FREELANCER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type JobType = 'FIXED' | 'HOURLY';
export type ExperienceLevel = 'ENTRY' | 'INTERMEDIATE' | 'EXPERT';
export type JobStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ProposalStatus = 'SUBMITTED' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
export type ContractStatus = 'PENDING' | 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVISION' | 'APPROVED' | 'PAID';
export type TransactionType = 'DEPOSIT' | 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'REFUND' | 'WITHDRAWAL';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

// Public Marketplace View Types
export interface FreelancerSummary {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  successRate: number;
  location: string;
  available: boolean;
  skills: string[];
  badge?: 'Top Rated' | 'Top Rated Plus' | 'Rising Talent';
}

export interface JobSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  type: JobType;
  budget: number;
  hourlyRateRange?: { min: number; max: number };
  experienceLevel: ExperienceLevel;
  skills: string[];
  client: {
    name: string;
    company?: string;
    rating: number;
    totalSpent: number;
    country: string;
    paymentVerified: boolean;
  };
  proposalsCount: number;
  postedAt: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarUrl: string;
  rating: number;
  type: 'client' | 'freelancer';
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  jobCount: number;
  icon: string;
  popularSkills: string[];
}
