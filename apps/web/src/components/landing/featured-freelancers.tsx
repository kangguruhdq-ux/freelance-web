import Link from "next/link";
import { MapPin, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { FEATURED_FREELANCERS } from "@/data/landing-data";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";

export function FeaturedFreelancers() {
  return (
    <section id="freelancers" className="py-16 sm:py-24 bg-slate-50/60 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Vetted Independent Talent
            </span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Featured Top-Rated Specialists
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl">
              Proven domain experts with verified track records, exceptional ratings, and milestone-backed completions.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
          >
            Explore marketplace talent
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Freelancer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_FREELANCERS.map((freelancer) => (
            <div
              key={freelancer.id}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col justify-between shadow-card dark:shadow-none hover:shadow-card-hover dark:hover:shadow-glow-brand/5 hover:border-brand-300 dark:hover:border-brand-700/60 hover:-translate-y-1.5 transition-all duration-300"
            >
              <div>
                {/* Header: Avatar, Badge & Availability */}
                <div className="flex items-start justify-between gap-3">
                  <Avatar
                    src={freelancer.avatarUrl}
                    alt={freelancer.name}
                    fallback={freelancer.name}
                    size="lg"
                    status={freelancer.available ? "online" : "offline"}
                  />
                  <div className="flex flex-col items-end gap-1">
                    {freelancer.badge && (
                      <Badge variant="accent" className="text-[11px] gap-1 font-semibold">
                        <ShieldCheck className="h-3 w-3" />
                        {freelancer.badge}
                      </Badge>
                    )}
                    <span
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        freelancer.available
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          freelancer.available
                            ? "bg-emerald-500"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      {freelancer.available ? "Available Now" : "Busy"}
                    </span>
                  </div>
                </div>

                {/* Name & Title */}
                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {freelancer.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                    {freelancer.title}
                  </p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{freelancer.location}</span>
                </div>

                {/* Bio */}
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {freelancer.bio}
                </p>

                {/* Rating & Completed Projects */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Rating
                    score={freelancer.rating}
                    reviewCount={freelancer.reviewCount}
                    size="sm"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {freelancer.completedProjects} jobs done
                  </span>
                </div>

                {/* Skills tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {freelancer.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent dark:border-slate-700/50"
                    >
                      {skill}
                    </span>
                  ))}
                  {freelancer.skills.length > 3 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-slate-400 dark:text-slate-500">
                      +{freelancer.skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer: Rate & Action CTA */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    ${freelancer.hourlyRate}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/hr</span>
                </div>
                <Link href="/jobs">
                  <Button size="sm" variant="outline" className="text-xs font-semibold h-8 px-3">
                    View Profile
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
