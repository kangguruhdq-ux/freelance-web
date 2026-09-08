import { Quote } from "lucide-react";
import { TESTIMONIALS_DATA } from "@/data/landing-data";
import { Avatar } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";

export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-slate-50/60 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Real Stories & Verified Outcomes
          </span>
          <h2 className="mt-1.5 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trusted by Builders & Independent Pros
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600">
            See how forward-thinking startups and senior contractors do their best work together on FreelanceHub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS_DATA.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 flex flex-col justify-between shadow-card"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Rating score={item.rating} size="sm" showScore={false} />
                  <Quote className="h-6 w-6 text-brand-200" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-normal italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
                <Avatar
                  src={item.avatarUrl}
                  alt={item.author}
                  fallback={item.author}
                  size="md"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {item.author}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.role}, <span className="text-slate-700 font-medium">{item.company}</span>
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
