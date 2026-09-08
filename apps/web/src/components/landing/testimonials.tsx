import { Quote } from "lucide-react";
import { TESTIMONIALS_DATA } from "@/data/landing-data";
import { Avatar } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";

export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-slate-50/60 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Real Stories & Verified Outcomes
          </span>
          <h2 className="mt-1.5 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Trusted by Builders & Independent Pros
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            See how forward-thinking startups and senior contractors do their best work together on FreelanceHub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS_DATA.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between shadow-card dark:shadow-none hover:-translate-y-1.5 hover:shadow-card-hover dark:hover:shadow-glow-brand/5 hover:border-brand-300 dark:hover:border-brand-700/60 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Rating score={item.rating} size="sm" showScore={false} />
                  <Quote className="h-6 w-6 text-brand-200 dark:text-brand-800" />
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Avatar
                  src={item.avatarUrl}
                  alt={item.author}
                  fallback={item.author}
                  size="md"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {item.author}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.role}, <span className="text-slate-700 dark:text-slate-300 font-medium">{item.company}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
