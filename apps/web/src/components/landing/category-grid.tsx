import Link from "next/link";
import { Code2, Palette, Cpu, Server, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";
import { CATEGORIES_DATA } from "@/data/landing-data";

const iconMap = {
  Code2,
  Palette,
  Cpu,
  Server,
  TrendingUp,
  ShieldCheck,
};

export function CategoryGrid() {
  return (
    <section id="categories" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Specialized Disciplines
            </span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore High-Demand Skills
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl">
              From full-stack web platforms to deep learning models, access pre-vetted domain specialists ready to deliver.
            </p>
          </div>
          <Link
            href="#jobs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Browse all categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES_DATA.map((cat) => {
            const IconComponent = iconMap[cat.icon as keyof typeof iconMap] || Code2;

            return (
              <div
                key={cat.id}
                className="group relative p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-brand-200 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors duration-200 shadow-subtle">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {cat.jobCount} open jobs
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5">
                    {cat.popularSkills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
