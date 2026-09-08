"use client";

import * as React from "react";
import { X, Check, Edit3, DollarSign, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    headline?: string;
    bio?: string;
    location?: string;
    hourlyRate?: number;
    availability?: string;
  };
  onSuccess?: () => void;
}

export function ProfileEditModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: ProfileEditModalProps) {
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const [headline, setHeadline] = React.useState(initialData?.headline || "");
  const [bio, setBio] = React.useState(initialData?.bio || "");
  const [location, setLocation] = React.useState(initialData?.location || "");
  const [hourlyRate, setHourlyRate] = React.useState(
    initialData?.hourlyRate ? String(initialData.hourlyRate) : "50"
  );
  const [availability, setAvailability] = React.useState(
    initialData?.availability || "AVAILABLE"
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setHeadline(initialData?.headline || "");
      setBio(initialData?.bio || "");
      setLocation(initialData?.location || "Remote");
      setHourlyRate(initialData?.hourlyRate ? String(initialData.hourlyRate) : "50");
      setAvailability(initialData?.availability || "AVAILABLE");
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const rateNum = parseFloat(hourlyRate);
    if (isNaN(rateNum) || rateNum < 0) {
      setError("Please enter a valid hourly rate.");
      setSaving(false);
      return;
    }

    try {
      const res = await apiFetch("/profiles/me", {
        method: "PUT",
        body: JSON.stringify({
          headline: headline.trim(),
          bio: bio.trim(),
          location: location.trim(),
          hourlyRate: rateNum,
          availability,
        }),
      });

      if (res.success) {
        toast.success("Profile updated successfully!");
        await refreshUser();
        onSuccess?.();
        onClose();
      } else {
        const msg = res.error || "Failed to update profile.";
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err.message || "Network error while saving profile.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 id="edit-profile-title" className="text-base font-bold text-slate-900 dark:text-white">
                Edit Professional Profile
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your public headline, rates, and availability
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Professional Headline */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Professional Title / Headline <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g. Senior Full-Stack Architect | Next.js & Cloud Systems"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="text-xs h-10"
            />
          </div>

          {/* Availability Status Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Current Availability
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAvailability("AVAILABLE")}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  availability === "AVAILABLE"
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Available
              </button>

              <button
                type="button"
                onClick={() => setAvailability("LIMITED")}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  availability === "LIMITED"
                    ? "bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Limited
              </button>

              <button
                type="button"
                onClick={() => setAvailability("UNAVAILABLE")}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  availability === "UNAVAILABLE"
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-700 dark:text-slate-300 ring-2 ring-slate-400/20"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Unavailable
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hourly Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Hourly Rate ($/hr)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="5"
                  step="1"
                  required
                  placeholder="65"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="text-xs h-10 pl-8"
                />
                <DollarSign className="h-3.5 w-3.5 absolute left-3 top-3.5 text-slate-400" />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Location
              </label>
              <div className="relative">
                <Input
                  placeholder="e.g. Jakarta, ID or Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="text-xs h-10 pl-8"
                />
                <MapPin className="h-3.5 w-3.5 absolute left-3 top-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* About Me / Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              About Me / Professional Bio
            </label>
            <textarea
              rows={4}
              placeholder="Highlight your background, core architectural proficiencies, past deliverables, and communication style..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 leading-relaxed resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="text-xs font-bold gap-1.5 bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
            >
              {saving ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
