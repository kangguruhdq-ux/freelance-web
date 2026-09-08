"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Filter, Briefcase, MapPin, DollarSign, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface JobItem {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  budgetType: string;
  experienceLevel: string;
  locationType: string;
  duration?: string;
  status: string;
  proposalsCount: number;
  createdAt: string;
  client: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  skills: string[];
}

function JobsListContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "ALL";
  const initialSearch = searchParams.get("search") || "";

  const [jobs, setJobs] = React.useState<JobItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = React.useState<string>(initialCategory);
  const [experience, setExperience] = React.useState<string>("ALL");

  React.useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (selectedCategory !== "ALL") params.set("category", selectedCategory);
        if (experience !== "ALL") params.set("experienceLevel", experience);

        const res = await fetch(`/api/jobs?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setJobs(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchJobs, 300);
    return () => clearTimeout(debounce);
  }, [search, selectedCategory, experience]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Explore High-Impact Projects</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Connect with vetted clients and submit proposals protected by milestone escrow.
            </p>
          </div>
          <Link href="/client/jobs/new">
            <Button className="font-semibold gap-2 shadow-sm">
              <Briefcase className="h-4 w-4" />
              Post a Project
            </Button>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4 sm:p-5 shadow-card bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search projects by title, keywords, tech stack..."
                className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="md:col-span-3">
              <select
                className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="web-development">Web Development</option>
                <option value="mobile-apps">Mobile Apps</option>
                <option value="ui-ux-design">UI/UX Design</option>
                <option value="ai-machine-learning">AI & Machine Learning</option>
                <option value="cloud-devops">Cloud & DevOps</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              >
                <option value="ALL">All Experience Levels</option>
                <option value="ENTRY">Entry Level</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="EXPERT">Expert Level</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Job Listings */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500 font-medium">Loading active marketplace jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <Card className="p-12 text-center space-y-4 border-slate-200 bg-white">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Filter className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No jobs match your search filters</h3>
                <p className="text-xs text-slate-500 mt-1">Try broadening your search criteria or resetting filters.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSelectedCategory("ALL"); setExperience("ALL"); }}>
                Clear Filters
              </Button>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card
                key={job.id}
                className="p-6 transition-all duration-200 hover:shadow-card-hover border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default" className="text-xs font-semibold">
                        {job.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {job.budgetType}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Link href={`/jobs/${job.id}`}>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {job.title}
                      </h2>
                    </Link>

                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {job.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 flex flex-col sm:items-end justify-between self-stretch pt-2 sm:pt-0">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Project Budget</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        ${job.budget.toLocaleString()}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {job.proposalsCount} {job.proposalsCount === 1 ? "proposal" : "proposals"}
                      </p>
                    </div>

                    <div className="pt-4">
                      <Link href={`/jobs/${job.id}`}>
                        <Button size="sm" className="gap-1.5 font-semibold text-xs">
                          View Job
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen py-24 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <JobsListContent />
    </React.Suspense>
  );
}
