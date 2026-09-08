import { Hero } from "@/components/landing/hero";
import { StatsCounter } from "@/components/landing/stats-counter";
import { CategoryGrid } from "@/components/landing/category-grid";
import { FeaturedFreelancers } from "@/components/landing/featured-freelancers";
import { TrendingJobs } from "@/components/landing/trending-jobs";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TrustSecurity } from "@/components/landing/trust-security";
import { Testimonials } from "@/components/landing/testimonials";
import { CtaBanner } from "@/components/landing/cta-banner";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <StatsCounter />
      <CategoryGrid />
      <FeaturedFreelancers />
      <TrendingJobs />
      <HowItWorks />
      <TrustSecurity />
      <Testimonials />
      <CtaBanner />
    </div>
  );
}
