"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, MapPin, DollarSign, Briefcase, ExternalLink, Github, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface FreelancerProfile {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  headline: string;
  bio: string;
  location: string;
  hourlyRate: number;
  experienceLevel: string;
  availability: string;
  rating: number;
  completedJobs: number;
  memberSince: string;
  skills: Array<{ id: string; name: string; slug: string }>;
  portfolio: Array<{
    id: string;
    title: string;
    description: string;
    coverImage: string;
    projectUrl?: string;
    githubUrl?: string;
    technologies: string[];
  }>;
}

export default function FreelancerProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const [profile, setProfile] = React.useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;

    fetch(`/api/profiles/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setProfile(data.profile);
        }
      })
      .catch((err) => console.error("Error fetching profile:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-slate-500">The freelancer profile you are searching for does not exist or has been removed.</p>
        <Link href="/#freelancers">
          <Button variant="outline">Browse Talent</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>

        {/* Profile Card */}
        <Card className="p-6 sm:p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-5">
              <div className="h-20 w-20 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-sm">
                {profile.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {profile.name}
                  </h1>
                  <Badge variant="secondary" className="font-bold text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                    TOP RATED
                  </Badge>
                </div>
                <p className="text-base font-semibold text-brand-600 dark:text-brand-400">{profile.headline}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {profile.location}
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    {profile.rating.toFixed(1)} Rating
                  </span>
                  <span>{profile.completedJobs} jobs completed</span>
                </div>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <p className="text-xs uppercase font-semibold text-slate-400">Hourly Rate</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                ${profile.hourlyRate}<span className="text-xs font-normal text-slate-500">/hr</span>
              </p>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 sm:justify-end mt-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Available for Hire
              </span>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">About Me</h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Skills &amp; Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <Badge key={s.id} variant="outline" className="px-3 py-1 text-xs font-medium bg-slate-50 text-slate-700">
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Portfolio Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Featured Portfolio ({profile.portfolio.length})
            </h2>
          </div>

          {profile.portfolio.length === 0 ? (
            <Card className="p-8 text-center bg-white border-slate-200">
              <Briefcase className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No portfolio items published yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.portfolio.map((item) => (
                <Card key={item.id} className="p-6 bg-white border-slate-200 shadow-card space-y-3">
                  <div className="h-40 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="text-xs font-semibold text-slate-400 absolute">Featured Project</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{item.description}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.technologies.map((tech) => (
                      <span key={tech} className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-600">
                        {tech}
                      </span>
                    ))}
                  </div>

                  {(item.projectUrl || item.githubUrl) && (
                    <div className="pt-2 flex items-center gap-3 border-t border-slate-100">
                      {item.projectUrl && (
                        <a
                          href={item.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                        >
                          Live Demo <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {item.githubUrl && (
                        <a
                          href={item.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-slate-600 hover:text-slate-800 inline-flex items-center gap-1"
                        >
                          Code Repository <Github className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
