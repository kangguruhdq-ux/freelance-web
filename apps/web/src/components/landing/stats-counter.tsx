import { STATS_DATA } from "@/data/landing-data";

export function StatsCounter() {
  return (
    <section className="border-y border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/80 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS_DATA.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-subtle dark:shadow-none hover:-translate-y-1 hover:shadow-card dark:hover:shadow-glow-brand/5 transition-all duration-300"
            >
              <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {stat.label}
              </p>
              <span className="mt-1 text-xs text-brand-600 dark:text-brand-400 font-medium">
                {stat.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
