"use client";

import { useState, useEffect } from "react";
import {
  UserCircle2,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  BarChart3,
  RefreshCw,
  Trash2,
  Loader2,
  Pencil,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import ResumeUpload from "../../components/ResumeUpload";
import type { ResumeData } from "app/lib/resumeParser";
import Image from "next/image";

interface ProfileData {
  user: { name: string; email: string; imageUrl: string | null };
  stats: { completed: number; scheduled: number; total: number };
  resume: { fileName: string | null; data: ResumeData } | null;
  interviews: {
    _id: string;
    title: string;
    company: string;
    status: "scheduled" | "in-progress" | "completed";
    interviewType: "technical" | "hr" | "coding";
    createdAt: string;
    score: number | null;
    hasFeedback?: boolean;
  }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center gap-4">
      <div
        className={`rounded-lg p-2.5 ${accent ? "bg-[#3ecf8e]/15 text-[#3ecf8e]" : "bg-white/10 text-gray-400"}`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function InterviewBadge({ type }: { type: "technical" | "hr" | "coding" }) {
  const map = {
    technical: { label: "Technical", color: "bg-blue-500/15 text-blue-400" },
    hr: { label: "HR", color: "bg-purple-500/15 text-purple-400" },
    coding: { label: "Coding", color: "bg-orange-500/15 text-orange-400" },
  };
  const { label, color } = map[type];
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

function StatusBadge({ status }: { status: "scheduled" | "in-progress" | "completed" }) {
  const map = {
    completed: { label: "Completed", icon: CheckCircle2, color: "text-[#3ecf8e]" },
    scheduled: { label: "Scheduled", icon: Calendar, color: "text-yellow-400" },
    "in-progress": { label: "In Progress", icon: Clock, color: "text-blue-400" },
  };
  const { label, icon: Icon, color } = map[status];
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function InterviewRow({ interview }: { interview: ProfileData["interviews"][0] }) {
  const date = new Date(interview.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/5 transition">
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-lg bg-white/5 border border-white/10 p-2 shrink-0">
          <Briefcase size={14} className="text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{interview.title}</p>
          <p className="text-xs text-gray-500">
            {interview.company} · {date}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <InterviewBadge type={interview.interviewType} />
        <StatusBadge status={interview.status} />
        {interview.score !== null && (
          <span className="text-xs font-semibold text-[#3ecf8e] w-8 text-right">
            {interview.score}%
          </span>
        )}
        {interview.status === "completed" && interview.hasFeedback && (
          <Link
            href={`/feedback/${interview._id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-[#3ecf8e]/15 px-2.5 py-1 text-xs font-medium text-[#3ecf8e] hover:bg-[#3ecf8e]/25 transition"
          >
            Feedback
            <ArrowRight size={11} />
          </Link>
        )}
      </div>
    </div>
  );
}

function ResumeSection({
  initial,
  onUpdate,
}: {
  initial: ProfileData["resume"];
  onUpdate: (resume: ProfileData["resume"]) => void;
}) {
  const [resume, setResume] = useState(initial);
  const [replacing, setReplacing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleResumeData = async (data: ResumeData | null) => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: data, fileName: data.name ?? "resume.pdf" }),
      });
      if (!res.ok) throw new Error();
      const updated = { fileName: data.name ?? "resume.pdf", data };
      setResume(updated);
      onUpdate(updated);
      setReplacing(false);
      toast.success("Resume saved");
    } catch {
      toast.error("Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/resume", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setResume(null);
      onUpdate(null);
      toast.success("Resume removed");
    } catch {
      toast.error("Failed to remove resume");
    } finally {
      setDeleting(false);
    }
  };

  if (!resume || replacing) {
    return (
      <div className="space-y-3">
        {saving ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            Saving resume...
          </div>
        ) : (
          <ResumeUpload onResumeData={handleResumeData} disabled={false} />
        )}
        {replacing && (
          <button
            type="button"
            onClick={() => setReplacing(false)}
            className="text-xs text-gray-500 hover:text-gray-300 transition"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#3ecf8e]/30 bg-[#3ecf8e]/5 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <FileText size={18} className="text-[#3ecf8e] shrink-0" />
        <div>
          <p className="text-sm font-medium text-white">Resume uploaded</p>
          <p className="text-xs text-gray-500">
            {resume.fileName ?? "resume.pdf"} · Ready for interviews
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setReplacing(true)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:border-[#3ecf8e]/50 hover:text-white transition"
        >
          <RefreshCw size={12} />
          Replace
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
        >
          {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          Delete
        </button>
      </div>
    </div>
  );
}

function InterviewHistory({ interviews }: { interviews: ProfileData["interviews"] }) {
  const [filter, setFilter] = useState<"all" | "completed" | "scheduled">("all");

  const filtered = interviews.filter((i) => filter === "all" || i.status === filter);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <BarChart3 size={18} className="text-[#3ecf8e]" />
          <span className="font-semibold text-white">Interview History</span>
          <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
            {interviews.length}
          </span>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1">
          {(["all", "completed", "scheduled"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                filter === f
                  ? "bg-[#3ecf8e]/15 text-[#3ecf8e]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-3 py-2 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-6">No interviews found</p>
        ) : (
          filtered.map((interview) => <InterviewRow key={interview._id} interview={interview} />)
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { openUserProfile } = useClerk();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json() as Promise<ProfileData>;
      })
      .then(setData)
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#3ecf8e]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
        {error || "Something went wrong"}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      {/* Profile Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            {data.user.imageUrl ? (
              <Image
                src={data.user.imageUrl}
                alt={data.user.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-[#3ecf8e]/40"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 flex items-center justify-center">
                <UserCircle2 size={32} className="text-[#3ecf8e]" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-white">{data.user.name}</h1>
            <p className="text-sm text-gray-400">{data.user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="flex items-center gap-1.5 rounded-lg bg-[#3ecf8e] px-3 py-2 text-xs font-medium text-black hover:bg-[#33b87a] transition shrink-0"
          >
            <Pencil size={12} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={CheckCircle2}
          label="Interviews Completed"
          value={data.stats.completed}
          accent
        />
        <StatCard icon={Calendar} label="Interviews Scheduled" value={data.stats.scheduled} />
      </div>

      {/* Resume */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Resume</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Upload your resume once — it will be used across all your interviews automatically.
          </p>
        </div>
        <ResumeSection
          initial={data.resume}
          onUpdate={(resume) => setData((d) => (d ? { ...d, resume } : d))}
        />
      </div>

      {/* Interview History */}
      <InterviewHistory interviews={data.interviews} />
    </div>
  );
}
