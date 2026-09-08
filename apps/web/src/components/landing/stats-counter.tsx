import { STATS_DATA } from "@/data/landing-data";

export function StatsCounter() {
  return (
    <section className="border-y border-slate-200/80 bg-slate-50/50 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS_DATA.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-slate-200/60 shadow-subtle"
            >
              <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {stat.label}
              </p>
              <span className="mt-1 text-xs text-brand-600 font-medium">
                {stat.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
