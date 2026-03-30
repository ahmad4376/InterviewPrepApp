"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Search, X, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, ArrowLeft,
} from "lucide-react";

interface ProblemListItem {
  id: string;
  title: string;
  tags: string[];
  difficulty_bucket: string;
}

type Difficulty = "" | "easy" | "medium" | "hard";
const PAGE_SIZE = 20;

function getDifficultyColor(d: string) {
  switch (d.toLowerCase()) {
    case "easy":   return "text-green-400";
    case "medium": return "text-yellow-400";
    case "hard":   return "text-red-400";
    default:       return "text-gray-400";
  }
}

export default function PickQuestionsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<{
    title: string; difficulty: number; numProblems: number; timeLimit: number | null;
  } | null>(null);

  const [problems, setProblems]       = useState<ProblemListItem[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [search, setSearch]           = useState("");
  const [difficulty, setDifficulty]   = useState<Difficulty>("");
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  // Load config from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("customMassConfig");
    if (!raw) { router.replace("/create-interview"); return; }
    try { setConfig(JSON.parse(raw)); }
    catch { router.replace("/create-interview"); }
  }, [router]);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageSize: String(PAGE_SIZE),
        page: String(page),
      });
      if (search)     params.set("search", search);
      if (difficulty) params.set("difficulty", difficulty);

      const res  = await fetch(`/api/leetcode?${params}`);
      const data = await res.json();
      setProblems(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, difficulty]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);
  useEffect(() => { setPage(1); }, [search, difficulty]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (config && next.size >= config.numProblems) {
          toast.error(`You can only select ${config.numProblems} questions`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!config) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/coding-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:           config.title,
          difficulty:      config.difficulty,
          numProblems:     config.numProblems,
          timeLimit:       config.timeLimit,
          isMassInterview: true,
          isCustomMass:    true,
          customProblemIds: Array.from(selected),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create interview");
      }

      sessionStorage.removeItem("customMassConfig");
      toast.success("Custom coding interview created");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const totalPages    = Math.ceil(total / PAGE_SIZE);
  const numProblems   = config?.numProblems ?? 0;
  const selectionFull = selected.size === numProblems;

  if (!config) return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#3ecf8e]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition mb-2"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <h1 className="text-2xl font-bold text-white">Select Questions</h1>
            <p className="text-sm text-gray-400 mt-1">
              Choose exactly{" "}
              <span className={selectionFull ? "text-[#3ecf8e] font-semibold" : "text-white font-semibold"}>
                {selected.size}/{numProblems}
              </span>{" "}
              questions for <span className="text-white font-medium">{config.title}</span>
            </p>
          </div>

          {/* Confirm button */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!selectionFull || submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3ecf8e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#36be81] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Confirm Selection
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-8 py-2 text-sm text-white placeholder-gray-500 focus:border-[#3ecf8e] focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="appearance-none rounded-lg border border-white/10 bg-white/5 pl-3 pr-8 py-2 text-sm text-gray-300 focus:border-[#3ecf8e] focus:outline-none cursor-pointer"
            >
              <option value=""       className="bg-[#0c0c0c]">All Difficulties</option>
              <option value="easy"   className="bg-[#0c0c0c]">Easy</option>
              <option value="medium" className="bg-[#0c0c0c]">Medium</option>
              <option value="hard"   className="bg-[#0c0c0c]">Hard</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Selected chips */}
        {selected.size > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {Array.from(selected).map((id) => {
              const p = problems.find((pr) => pr.id === id);
              return (
                <span key={id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#3ecf8e]/15 border border-[#3ecf8e]/30 px-3 py-1 text-xs text-[#3ecf8e]">
                  {p?.title ?? id}
                  <button onClick={() => toggleSelect(id)} className="hover:text-white">
                    <X size={11} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Problem List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-[#3ecf8e]" />
          </div>
        ) : problems.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-gray-400">No problems match your search.</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="grid grid-cols-[40px_1fr_100px_80px] gap-4 px-5 py-2.5 border-b border-white/10 text-xs text-gray-500 uppercase tracking-wider">
                <span />
                <span>Title</span>
                <span>Tags</span>
                <span className="text-right">Difficulty</span>
              </div>
              <div className="divide-y divide-white/5">
                {problems.map((p) => {
                  const isSelected = selected.has(p.id);
                  const isDisabled = !isSelected && selectionFull;
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      disabled={isDisabled}
                      className={`w-full grid grid-cols-[40px_1fr_100px_80px] gap-4 px-5 py-3 text-left transition items-center ${
                        isSelected
                          ? "bg-[#3ecf8e]/10 hover:bg-[#3ecf8e]/15"
                          : isDisabled
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center justify-center">
                        {isSelected ? (
                          <CheckCircle2 size={16} className="text-[#3ecf8e]" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-gray-600" />
                        )}
                      </span>
                      <span className="text-sm text-white truncate text-left">{p.title}</span>
                      <span className="text-xs text-gray-500 truncate">
                        {p.tags.slice(0, 2).join(", ")}
                      </span>
                      <span className={`text-xs font-medium text-right capitalize ${getDifficultyColor(p.difficulty_bucket)}`}>
                        {p.difficulty_bucket}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Confirm Selection</h2>
            <p className="text-sm text-gray-400 mb-1">
              You have selected <span className="text-white font-semibold">{selected.size} questions</span> for:
            </p>
            <p className="text-sm text-[#3ecf8e] font-medium mb-6">{config.title}</p>
            <p className="text-xs text-gray-500 mb-6">
              This will create a mass interview with your chosen questions. Candidates will receive the same set.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 rounded-lg bg-white/10 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-lg bg-[#3ecf8e] py-2.5 text-sm font-semibold text-black hover:bg-[#36be81] transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Yes, Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}