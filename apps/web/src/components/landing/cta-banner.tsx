import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 p-8 sm:p-12 lg:p-16 text-white overflow-hidden shadow-2xl">
          {/* Subtle geometric background glow */}
          <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">
              Start in Minutes
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to build something great?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              Join thousands of forward-thinking businesses and talented independent professionals moving projects forward with confidence.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 h-12 shadow-lg shadow-brand-500/25"
                >
                  Find Talent
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 font-semibold px-8 h-12"
                >
                  Start Freelancing
                </Button>
              </Link>
            </div>

            {/* Guarantee points */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>No credit card required to browse</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Milestone escrow protection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>24/7 mediation & dispute support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
