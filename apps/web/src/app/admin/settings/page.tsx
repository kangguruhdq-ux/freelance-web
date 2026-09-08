"use client";

import * as React from "react";
import {
  Settings,
  ShieldAlert,
  Save,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

interface PlatformSettings {
  platformFeePercent: number;
  maintenanceMode: boolean;
  minJobBudget: number;
  escrowAutoReleaseDays: number;
  disputeSlaHours: number;
  requireEmailVerification: boolean;
  allowNewRegistrations: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<PlatformSettings>({
    platformFeePercent: 10,
    maintenanceMode: false,
    minJobBudget: 50,
    escrowAutoReleaseDays: 14,
    disputeSlaHours: 48,
    requireEmailVerification: true,
    allowNewRegistrations: true,
  });

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/settings");
      if (res.success && res.settings) {
        setSettings(res.settings);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to load settings" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });

      if (res.success && res.settings) {
        setSettings(res.settings);
        setFeedback({
          type: "success",
          message: "Platform governance parameters updated and logged to audit trail.",
        });
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update platform settings" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            System Settings &amp; Platform Controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure financial fee models, maintenance windows, escrow automated release, and registration rules.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          className="text-xs font-semibold dark:border-slate-800 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Reload
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="underline font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {settings.maintenanceMode && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Maintenance Mode is Currently ACTIVE
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              Public user registration and non-admin checkout actions are throttled.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Marketplace Financial Parameters */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Fee Structure &amp; Escrow Rules
            </h2>
            <p className="text-xs text-slate-400">
              Platform revenue commission and automated milestone timeouts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Platform Take-Rate Fee (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={settings.platformFeePercent}
                onChange={(e) =>
                  setSettings({ ...settings, platformFeePercent: Number(e.target.value) })
                }
                className="text-xs h-9 dark:bg-slate-800 dark:border-slate-700"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Applied automatically to all escrow milestone releases.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Job Budget ($)
              </label>
              <Input
                type="number"
                min="1"
                value={settings.minJobBudget}
                onChange={(e) =>
                  setSettings({ ...settings, minJobBudget: Number(e.target.value) })
                }
                className="text-xs h-9 dark:bg-slate-800 dark:border-slate-700"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Minimum permissible listing price for new job posts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Escrow Auto-Release Window (Days)
              </label>
              <Input
                type="number"
                min="1"
                value={settings.escrowAutoReleaseDays}
                onChange={(e) =>
                  setSettings({ ...settings, escrowAutoReleaseDays: Number(e.target.value) })
                }
                className="text-xs h-9 dark:bg-slate-800 dark:border-slate-700"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Days before submitted work is automatically approved if client is unresponsive.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Dispute SLA Target (Hours)
              </label>
              <Input
                type="number"
                min="1"
                value={settings.disputeSlaHours}
                onChange={(e) =>
                  setSettings({ ...settings, disputeSlaHours: Number(e.target.value) })
                }
                className="text-xs h-9 dark:bg-slate-800 dark:border-slate-700"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Maximum expected mediation timeframe for opened dispute claims.
              </p>
            </div>
          </div>
        </Card>

        {/* Security & Access Controls */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Access Governance &amp; Security Controls
            </h2>
            <p className="text-xs text-slate-400">
              Registration throttles and maintenance killswitches.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Enable Platform Maintenance Mode
                </span>
                <span className="text-[11px] text-slate-400">
                  Suspends marketplace activity for database updates and migrations.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowNewRegistrations}
                onChange={(e) =>
                  setSettings({ ...settings, allowNewRegistrations: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Allow Public User Registrations
                </span>
                <span className="text-[11px] text-slate-400">
                  Uncheck to temporarily freeze new onboarding.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) =>
                  setSettings({ ...settings, requireEmailVerification: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Require Email Verification for Job Posting
                </span>
                <span className="text-[11px] text-slate-400">
                  Mitigates spam listings by enforcing verified email domains.
                </span>
              </div>
            </label>
          </div>
        </Card>

        {/* Save CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            className="text-xs h-9 dark:border-slate-800"
          >
            Discard Changes
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs h-9 font-semibold px-4 shadow-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving..." : "Save Platform Configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
