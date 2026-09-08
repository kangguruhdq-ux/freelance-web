import Link from "next/link";
import { Clock, Briefcase, CheckCircle2, ArrowRight, DollarSign } from "lucide-react";
import { TRENDING_JOBS } from "@/data/landing-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { formatCurrency } from "@/lib/utils";

export function TrendingJobs() {
  return (
    <section id="jobs" className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Active Opportunities
            </span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trending High-Value Projects
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl">
              Verified clients with funded escrow budgets seeking elite engineers, designers, and systems architects.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Explore all marketplace jobs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Jobs List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TRENDING_JOBS.map((job) => (
            <div
              key={job.id}
              className="group bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between shadow-card hover:shadow-card-hover hover:border-brand-200 transition-all duration-200"
            >
              <div>
                {/* Meta Row: Type & Posted Time */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={job.type === "FIXED" ? "default" : "secondary"}>
                      {job.type === "FIXED" ? "Fixed Price" : "Hourly Contract"}
                    </Badge>
                    <Badge variant="outline" className="text-slate-600">
                      {job.experienceLevel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{job.postedAt}</span>
                  </div>
                </div>

                {/* Job Title */}
                <Link href="/jobs">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                    {job.title}
                  </h3>
                </Link>

                {/* Budget */}
                <div className="mt-2.5 flex items-baseline gap-1 text-slate-900">
                  <span className="text-xl font-extrabold text-brand-700">
                    {job.type === "FIXED"
                      ? formatCurrency(job.budget)
                      : `$${job.hourlyRateRange?.min} - $${job.hourlyRateRange?.max}/hr`}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {job.type === "FIXED" ? "Est. Budget" : "Hourly Rate"}
                  </span>
                </div>

                {/* Description Preview */}
                <p className="mt-3 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Skill Pills */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Client and Proposals Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex flex-col text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <span>{job.client.name}</span>
                    {job.client.paymentVerified && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-100" />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Rating score={job.client.rating} showScore={false} size="sm" />
                    <span>{job.proposalsCount} proposals</span>
                  </div>
                </div>

                <Link href="/jobs">
                  <Button size="sm" className="font-semibold text-xs h-9 px-4">
                    View Job
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
