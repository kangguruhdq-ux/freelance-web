"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Shield, Zap, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { WORKFLOW_STEPS_CLIENT, WORKFLOW_STEPS_FREELANCER } from "@/data/landing-data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-slate-50/70 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Frictionless Marketplace Workflow
          </span>
          <h2 className="mt-1.5 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            How FreelanceHub Works
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600">
            A transparent, escrow-protected process engineered for speed, quality, and mutual peace of mind.
          </p>
        </div>

        <Tabs defaultValue="clients" className="max-w-4xl mx-auto">
          {/* Switcher: For Clients vs For Freelancers */}
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="clients">For Ambitious Clients</TabsTrigger>
              <TabsTrigger value="freelancers">For Independent Talent</TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Clients */}
          <TabsContent value="clients">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {WORKFLOW_STEPS_CLIENT.map((step) => (
                <div
                  key={step.step}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between shadow-card"
                >
                  <div>
                    <span className="text-2xl font-black text-brand-600 tracking-tight">
                      {step.step}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-slate-900 leading-snug">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-brand-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Verified Milestone Guarantee</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/register">
                <Button size="lg" className="font-semibold gap-2">
                  Post Your First Job Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Tab 2: Freelancers */}
          <TabsContent value="freelancers">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {WORKFLOW_STEPS_FREELANCER.map((step) => (
                <div
                  key={step.step}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between shadow-card"
                >
                  <div>
                    <span className="text-2xl font-black text-brand-600 tracking-tight">
                      {step.step}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-slate-900 leading-snug">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-brand-600">
                    <Shield className="h-4 w-4" />
                    <span>Protected Escrow Payouts</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/register">
                <Button size="lg" className="font-semibold gap-2">
                  Join as an Elite Freelancer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
