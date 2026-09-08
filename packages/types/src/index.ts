// Core Enums aligned with Prisma schema
export type UserRole = 'CLIENT' | 'FREELANCER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type BudgetType = 'FIXED' | 'HOURLY';
export type ExperienceLevel = 'ENTRY' | 'INTERMEDIATE' | 'EXPERT';
export type LocationType = 'REMOTE' | 'ONSITE' | 'HYBRID';
export type JobStatus = 'DRAFT' | 'OPEN' | 'IN_REVIEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CLOSED';
export type ProposalStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type ContractStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type TransactionType = 'DEPOSIT' | 'ESCROW_HOLD' | 'RELEASE' | 'REFUND' | 'WITHDRAWAL' | 'PLATFORM_FEE';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
export type ReportStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

// Backward compatibility alias
export type JobType = BudgetType;
export type AvailabilityStatus = 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';

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
  availability?: AvailabilityStatus | string;
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
    id?: string;
    name: string;
    company?: string;
    rating: number;
    totalSpent: number;
    country: string;
    paymentVerified: boolean;
  };
  proposalsCount: number;
  postedAt: string;
  status?: JobStatus;
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
  icon?: string;
  popularSkills: string[];
}

// Authentication & Session Types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  createdAt?: string;
  profile?: {
    headline?: string;
    bio?: string;
    location?: string;
    hourlyRate?: number;
    rating?: number;
    completedJobs?: number;
    availability?: string;
  } | null;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
  token?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role: 'CLIENT' | 'FREELANCER';
}

// ==========================================
// NOTIFICATIONS & CHAT TYPES
// ==========================================

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface ChatAttachmentItem {
  id?: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ChatMessageItemData {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  senderRole: string;
  isSender: boolean;
  createdAt: string;
  attachments?: ChatAttachmentItem[];
  pending?: boolean;
  error?: boolean;
}

// ==========================================
// CHECKPOINT 4 DTOs & INTERFACES
// ==========================================

export interface CreateJobDto {
  title: string;
  description: string;
  categoryId: string;
  budget: number;
  budgetType?: BudgetType;
  hourlyMin?: number;
  hourlyMax?: number;
  experienceLevel?: ExperienceLevel;
  locationType?: LocationType;
  duration?: string;
  skillIds?: string[];
}

export interface UpdateJobDto {
  title?: string;
  description?: string;
  categoryId?: string;
  budget?: number;
  budgetType?: BudgetType;
  hourlyMin?: number;
  hourlyMax?: number;
  experienceLevel?: ExperienceLevel;
  locationType?: LocationType;
  duration?: string;
  status?: JobStatus;
  skillIds?: string[];
}

export interface CreateProposalDto {
  coverLetter: string;
  bidAmount: number;
  estimatedDays: number;
}

export interface UpdateProposalDto {
  coverLetter?: string;
  bidAmount?: number;
  estimatedDays?: number;
}

export interface UpdateProfileDto {
  headline?: string;
  bio?: string;
  location?: string;
  hourlyRate?: number;
  experienceLevel?: ExperienceLevel;
  availability?: string;
  skillIds?: string[];
}

export interface CreatePortfolioDto {
  title: string;
  description: string;
  coverImage: string;
  projectUrl?: string;
  githubUrl?: string;
  technologies?: string[];
}

