import { Shield, Lock, MessageSquare, Scale, CheckCircle2 } from "lucide-react";

const TRUST_FEATURES = [
  {
    icon: Lock,
    title: "Milestone Escrow Hold",
    description:
      "Clients fund contract milestones in advance. Funds remain locked securely in escrow and only release when deliverables are approved.",
  },
  {
    icon: MessageSquare,
    title: "Integrated Realtime Chat",
    description:
      "Communicate directly with typing indicators, file attachment previews, and instant contract notifications without leaving the platform.",
  },
  {
    icon: Scale,
    title: "Impartial Dispute Mediation",
    description:
      "Admin moderation and clear audit logs ensure fairness if scope disagreements or timeline extensions ever occur.",
  },
  {
    icon: Shield,
    title: "Double-Blind Verified Reviews",
    description:
      "Both client and freelancer submit reviews independently after completion, guaranteeing honest, unmanipulated reputation scores.",
  },
];

export function TrustSecurity() {
  return (
    <section id="security" className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Enterprise-Grade Assurance
          </span>
          <h2 className="mt-1.5 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Security & Trust Built Into Every Interaction
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600">
            We eliminated the uncertainty of freelance contracting with programmatic safeguards and financial protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-brand-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-11 w-11 rounded-xl bg-white text-brand-600 border border-slate-200/80 flex items-center justify-center shadow-subtle mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Guaranteed by FreelanceHub</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
