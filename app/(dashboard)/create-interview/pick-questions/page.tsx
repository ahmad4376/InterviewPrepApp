// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import {
//   ArrowLeft,
//   Search,
//   Loader2,
//   Code2,
//   Check,
//   ChevronLeft,
//   ChevronRight,
//   X,
// } from "lucide-react";
// import { Button } from "@/app/components/ui/button";
// import { Card } from "@/app/components/ui/card";
// import { Input } from "@/app/components/ui/input";
// import { cn } from "@/app/lib/cn";

// interface Problem {
//   id: string;
//   title: string;
//   titleSlug: string;
//   difficulty_bucket: "easy" | "medium" | "hard";
//   tags: string[];
// }

// interface PageData {
//   data: Problem[];
//   total: number;
//   page: number;
//   pageSize: number;
// }

// interface CodingMassConfig {
//   title: string;
//   timeLimit: number | null;
//   isMassInterview: boolean;
// }

// function isValidConfig(v: unknown): v is CodingMassConfig {
//   if (!v || typeof v !== "object") return false;
//   const o = v as Record<string, unknown>;
//   return typeof o.title === "string";
// }

// const PAGE_SIZE = 15;

// const DIFFICULTY_LABELS: Record<string, string> = {
//   easy: "Easy",
//   medium: "Medium",
//   hard: "Hard",
// };

// const DIFFICULTY_COLORS: Record<string, string> = {
//   easy: "text-accent border-accent/30 bg-accent/10",
//   medium: "text-amber-500 border-amber-500/30 bg-amber-500/10",
//   hard: "text-destructive border-destructive/30 bg-destructive/10",
// };

// export default function PickQuestionsPage() {
//   const router = useRouter();
//   const [config, setConfig] = useState<CodingMassConfig | null>(null);

//   // Filter state
//   const [search, setSearch] = useState("");
//   const [difficulty, setDifficulty] = useState<"" | "easy" | "medium" | "hard">("");
//   const [page, setPage] = useState(1);

//   // Data state
//   const [pageData, setPageData] = useState<PageData | null>(null);
//   const [fetching, setFetching] = useState(false);

//   // Selection state
//   const [selected, setSelected] = useState<Map<string, Problem>>(new Map());

//   // Submission state
//   const [submitting, setSubmitting] = useState(false);

//   // Load config from sessionStorage
//   useEffect(() => {
//     const raw = sessionStorage.getItem("codingMassConfig");
//     if (!raw) {
//       router.replace("/create-interview");
//       return;
//     }
//     try {
//       const parsed = JSON.parse(raw) as unknown;
//       if (!isValidConfig(parsed)) {
//         router.replace("/create-interview");
//         return;
//       }
//       setConfig(parsed);
//     } catch {
//       router.replace("/create-interview");
//     }
//   }, [router]);

//   // Fetch problems
//   const fetchProblems = useCallback(async () => {
//     setFetching(true);
//     try {
//       const params = new URLSearchParams({
//         problem_format: "leetcode",
//         page: String(page),
//         pageSize: String(PAGE_SIZE),
//       });
//       if (search.trim()) params.set("search", search.trim());
//       if (difficulty) params.set("difficulty", difficulty);

//       const res = await fetch(`/api/leetcode?${params.toString()}`);
//       const json = (await res.json()) as {
//         success: boolean;
//         data: Problem[];
//         total: number;
//         page: number;
//         pageSize: number;
//       };
//       if (json.success) {
//         setPageData({
//           data: json.data,
//           total: json.total,
//           page: json.page,
//           pageSize: json.pageSize,
//         });
//       }
//     } catch {
//       toast.error("Failed to load problems");
//     } finally {
//       setFetching(false);
//     }
//   }, [page, search, difficulty]);

//   useEffect(() => {
//     if (config) fetchProblems();
//   }, [config, fetchProblems]);

//   // Reset to page 1 when filters change
//   const applySearch = useCallback((value: string) => {
//     setSearch(value);
//     setPage(1);
//   }, []);

//   const applyDifficulty = useCallback((value: "" | "easy" | "medium" | "hard") => {
//     setDifficulty(value);
//     setPage(1);
//   }, []);

//   function toggleProblem(problem: Problem) {
//     setSelected((prev) => {
//       const next = new Map(prev);
//       if (next.has(problem.id)) {
//         next.delete(problem.id);
//       } else {
//         next.set(problem.id, problem);
//       }
//       return next;
//     });
//   }

//   function clearSelection() {
//     setSelected(new Map());
//   }

//   async function handleSubmit() {
//     if (!config || selected.size === 0) return;
//     setSubmitting(true);
//     try {
//       const res = await fetch("/api/coding-interviews", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           title: config.title,
//           timeLimit: config.timeLimit,
//           isMassInterview: config.isMassInterview,
//           customProblemIds: Array.from(selected.keys()),
//         }),
//       });

//       if (!res.ok) {
//         const data = (await res.json()) as { error?: string };
//         throw new Error(data.error ?? "Failed to create interview");
//       }

//       sessionStorage.removeItem("codingMassConfig");
//       toast.success(
//         `Coding interview created with ${selected.size} problem${selected.size !== 1 ? "s" : ""}`,
//       );
//       router.push("/dashboard");
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Something went wrong");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   if (!config) return null;

//   const totalPages = pageData ? Math.ceil(pageData.total / PAGE_SIZE) : 0;
//   const selectedArray = Array.from(selected.values());

//   return (
//     <div className="max-w-4xl mx-auto space-y-5">
//       {/* Header */}
//       <div className="flex items-center gap-3">
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={() => router.back()}
//           className="gap-2 text-muted-foreground"
//         >
//           <ArrowLeft className="h-4 w-4" />
//           Back
//         </Button>
//       </div>

//       <div className="flex items-start justify-between gap-4 flex-wrap">
//         <div className="flex items-center gap-3">
//           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
//             <Code2 className="h-5 w-5 text-primary" />
//           </div>
//           <div>
//             <h1 className="text-lg font-bold text-foreground">Pick Questions</h1>
//             <p className="text-sm text-muted-foreground">{config.title}</p>
//           </div>
//         </div>

//         <Button
//           size="lg"
//           disabled={submitting || selected.size === 0}
//           onClick={handleSubmit}
//           className="gap-2 shrink-0"
//         >
//           {submitting ? (
//             <>
//               <Loader2 className="h-4 w-4 animate-spin" />
//               Creating...
//             </>
//           ) : (
//             <>
//               <Code2 className="h-4 w-4" />
//               Create Interview
//               {selected.size > 0 && (
//                 <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-semibold">
//                   {selected.size}
//                 </span>
//               )}
//             </>
//           )}
//         </Button>
//       </div>

//       {/* Selected chip strip */}
//       {selectedArray.length > 0 && (
//         <Card className="p-3">
//           <div className="flex items-center gap-2 flex-wrap">
//             <span className="text-xs font-medium text-muted-foreground shrink-0">
//               {selected.size} selected:
//             </span>
//             {selectedArray.slice(0, 8).map((p) => (
//               <button
//                 key={p.id}
//                 type="button"
//                 onClick={() => toggleProblem(p)}
//                 className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20 transition-colors"
//               >
//                 {p.title}
//                 <X className="h-3 w-3" />
//               </button>
//             ))}
//             {selectedArray.length > 8 && (
//               <span className="text-xs text-muted-foreground">
//                 +{selectedArray.length - 8} more
//               </span>
//             )}
//             <button
//               type="button"
//               onClick={clearSelection}
//               className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
//             >
//               Clear all
//             </button>
//           </div>
//         </Card>
//       )}

//       {/* Filters */}
//       <div className="flex gap-3 flex-wrap">
//         <div className="relative flex-1 min-w-48">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             placeholder="Search problems..."
//             value={search}
//             onChange={(e) => applySearch(e.target.value)}
//             className="pl-9"
//           />
//         </div>

//         <div className="flex gap-2">
//           {(["", "easy", "medium", "hard"] as const).map((d) => (
//             <button
//               key={d || "all"}
//               type="button"
//               onClick={() => applyDifficulty(d)}
//               className={cn(
//                 "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
//                 difficulty === d
//                   ? "border-primary bg-primary text-primary-foreground"
//                   : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
//               )}
//             >
//               {d === "" ? "All" : DIFFICULTY_LABELS[d]}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Problem list */}
//       <Card className="overflow-hidden">
//         {fetching ? (
//           <div className="flex items-center justify-center py-20">
//             <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//           </div>
//         ) : !pageData || pageData.data.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-20 text-center">
//             <Code2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
//             <p className="text-sm text-muted-foreground">No problems found</p>
//           </div>
//         ) : (
//           <div className="divide-y divide-border">
//             {pageData.data.map((problem) => {
//               const isSelected = selected.has(problem.id);
//               return (
//                 <button
//                   key={problem.id}
//                   type="button"
//                   onClick={() => toggleProblem(problem)}
//                   className={cn(
//                     "w-full flex items-center gap-4 px-4 py-3 text-left transition-colors",
//                     isSelected ? "bg-primary/5" : "hover:bg-muted/40",
//                   )}
//                 >
//                   {/* Checkbox */}
//                   <div
//                     className={cn(
//                       "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
//                       isSelected ? "border-primary bg-primary" : "border-border bg-background",
//                     )}
//                   >
//                     {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
//                   </div>

//                   {/* Title */}
//                   <span className="flex-1 text-sm text-foreground truncate">{problem.title}</span>

//                   {/* Difficulty badge */}
//                   <span
//                     className={cn(
//                       "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
//                       DIFFICULTY_COLORS[problem.difficulty_bucket] ?? "",
//                     )}
//                   >
//                     {DIFFICULTY_LABELS[problem.difficulty_bucket] ?? problem.difficulty_bucket}
//                   </span>
//                 </button>
//               );
//             })}
//           </div>
//         )}
//       </Card>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex items-center justify-between">
//           <p className="text-xs text-muted-foreground">
//             {pageData
//               ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, pageData.total)} of ${pageData.total} problems`
//               : ""}
//           </p>
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               disabled={page <= 1 || fetching}
//               onClick={() => setPage((p) => p - 1)}
//               className="gap-1"
//             >
//               <ChevronLeft className="h-4 w-4" />
//               Prev
//             </Button>
//             <span className="text-xs text-muted-foreground px-1">
//               {page} / {totalPages}
//             </span>
//             <Button
//               variant="outline"
//               size="sm"
//               disabled={page >= totalPages || fetching}
//               onClick={() => setPage((p) => p + 1)}
//               className="gap-1"
//             >
//               Next
//               <ChevronRight className="h-4 w-4" />
//             </Button>
//           </div>
//         </div>
//       )}

//       {selected.size === 0 && (
//         <p className="text-center text-xs text-muted-foreground">
//           Select at least one problem to create the interview.
//         </p>
//       )}
//     </div>
//   );
// }
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Loader2,
  Code2,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Trash2,
  ListChecks,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { cn } from "@/app/lib/cn";

interface Problem {
  id: string;
  title: string;
  titleSlug: string;
  difficulty_bucket: "easy" | "medium" | "hard";
  tags: string[];
}

interface PageData {
  data: Problem[];
  total: number;
  page: number;
  pageSize: number;
}

interface MCQOption {
  id: string;
  text: string;
}

interface MCQuestion {
  id: string;
  question: string;
  options: MCQOption[];
  correctOptionId: string;
}

interface CodingMassConfig {
  title: string;
  timeLimit: number | null;
  isMassInterview: boolean;
  includesCoding?: boolean;
  includesMCQ?: boolean;
}

function isValidConfig(v: unknown): v is CodingMassConfig {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.title === "string";
}

const PAGE_SIZE = 15;

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-accent border-accent/30 bg-accent/10",
  medium: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  hard: "text-destructive border-destructive/30 bg-destructive/10",
};

export default function PickQuestionsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<CodingMassConfig | null>(null);
  const [activeTab, setActiveTab] = useState<"coding" | "mcq">("coding");

  // Coding questions state
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<"" | "easy" | "medium" | "hard">("");
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [fetching, setFetching] = useState(false);
  const [selectedCoding, setSelectedCoding] = useState<Map<string, Problem>>(new Map());

  // MCQ state
  const [mcqQuestions, setMcqQuestions] = useState<MCQuestion[]>([]);
  const [editingMCQ, setEditingMCQ] = useState<MCQuestion | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Load config from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("codingMassConfig");
    if (!raw) {
      router.replace("/create-interview");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!isValidConfig(parsed)) {
        router.replace("/create-interview");
        return;
      }
      setConfig(parsed);
      
      // Set initial tab based on what's included
      if (parsed.includesMCQ && !parsed.includesCoding) {
        setActiveTab("mcq");
      }
    } catch {
      router.replace("/create-interview");
    }
  }, [router]);

  // Fetch coding problems
  const fetchProblems = useCallback(async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({
        problem_format: "leetcode",
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search.trim()) params.set("search", search.trim());
      if (difficulty) params.set("difficulty", difficulty);

      const res = await fetch(`/api/leetcode?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPageData({
          data: json.data,
          total: json.total,
          page: json.page,
          pageSize: json.pageSize,
        });
      }
    } catch {
      toast.error("Failed to load problems");
    } finally {
      setFetching(false);
    }
  }, [page, search, difficulty]);

  useEffect(() => {
    if (config && config.includesCoding) fetchProblems();
  }, [config, fetchProblems]);

  const applySearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const applyDifficulty = useCallback((value: "" | "easy" | "medium" | "hard") => {
    setDifficulty(value);
    setPage(1);
  }, []);

  function toggleProblem(problem: Problem) {
    setSelectedCoding((prev) => {
      const next = new Map(prev);
      if (next.has(problem.id)) {
        next.delete(problem.id);
      } else {
        next.set(problem.id, problem);
      }
      return next;
    });
  }

  function clearCodingSelection() {
    setSelectedCoding(new Map());
  }

  // MCQ functions
  function createNewMCQ() {
    const newMCQ: MCQuestion = {
      id: crypto.randomUUID(),
      question: "",
      options: [
        { id: crypto.randomUUID(), text: "" },
        { id: crypto.randomUUID(), text: "" },
      ],
      correctOptionId: "",
    };
    setEditingMCQ(newMCQ);
  }

  function saveMCQ() {
    if (!editingMCQ) return;
    
    // Validation
    if (!editingMCQ.question.trim()) {
      toast.error("Question text is required");
      return;
    }
    
    const validOptions = editingMCQ.options.filter((opt) => opt.text.trim());
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }
    
    if (!editingMCQ.correctOptionId) {
      toast.error("Please select the correct answer");
      return;
    }

    const updatedMCQ = {
      ...editingMCQ,
      options: validOptions,
    };

    setMcqQuestions((prev) => {
      const existing = prev.findIndex((q) => q.id === editingMCQ.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = updatedMCQ;
        return updated;
      }
      return [...prev, updatedMCQ];
    });

    setEditingMCQ(null);
    toast.success("Question saved");
  }

  function deleteMCQ(id: string) {
    setMcqQuestions((prev) => prev.filter((q) => q.id !== id));
    toast.success("Question deleted");
  }

  function addMCQOption() {
    if (!editingMCQ) return;
    setEditingMCQ({
      ...editingMCQ,
      options: [...editingMCQ.options, { id: crypto.randomUUID(), text: "" }],
    });
  }

  function removeMCQOption(optionId: string) {
    if (!editingMCQ) return;
    setEditingMCQ({
      ...editingMCQ,
      options: editingMCQ.options.filter((opt) => opt.id !== optionId),
      correctOptionId:
        editingMCQ.correctOptionId === optionId ? "" : editingMCQ.correctOptionId,
    });
  }

  function updateMCQQuestion(text: string) {
    if (!editingMCQ) return;
    setEditingMCQ({ ...editingMCQ, question: text });
  }

  function updateMCQOption(optionId: string, text: string) {
    if (!editingMCQ) return;
    setEditingMCQ({
      ...editingMCQ,
      options: editingMCQ.options.map((opt) =>
        opt.id === optionId ? { ...opt, text } : opt,
      ),
    });
  }

  function setCorrectOption(optionId: string) {
    if (!editingMCQ) return;
    setEditingMCQ({ ...editingMCQ, correctOptionId: optionId });
  }

  async function handleSubmit() {
    if (!config) return;

    const hasCoding = config.includesCoding && selectedCoding.size > 0;
    const hasMCQ = config.includesMCQ && mcqQuestions.length > 0;

    if (!hasCoding && !hasMCQ) {
      toast.error("Please add at least one question (coding or MCQ)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/coding-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: config.title,
          timeLimit: config.timeLimit,
          isMassInterview: config.isMassInterview,
          customProblemIds: hasCoding ? Array.from(selectedCoding.keys()) : undefined,
          mcqQuestions: hasMCQ ? mcqQuestions : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create interview");
      }

      sessionStorage.removeItem("codingMassConfig");
      
      const questionCount = (hasCoding ? selectedCoding.size : 0) + (hasMCQ ? mcqQuestions.length : 0);
      toast.success(`Interview created with ${questionCount} question${questionCount !== 1 ? "s" : ""}`);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!config) return null;

  const totalPages = pageData ? Math.ceil(pageData.total / PAGE_SIZE) : 0;
  const selectedCodingArray = Array.from(selectedCoding.values());

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Configure Interview Questions</h1>
            <p className="text-sm text-muted-foreground">{config.title}</p>
          </div>
        </div>

        <Button
          size="lg"
          disabled={submitting || (selectedCoding.size === 0 && mcqQuestions.length === 0)}
          onClick={handleSubmit}
          className="gap-2 shrink-0"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Code2 className="h-4 w-4" />
              Create Interview
              {(selectedCoding.size > 0 || mcqQuestions.length > 0) && (
                <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-semibold">
                  {selectedCoding.size + mcqQuestions.length}
                </span>
              )}
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      {config.includesCoding && config.includesMCQ && (
        <div className="flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("coding")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "coding"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Coding Questions
              {selectedCoding.size > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {selectedCoding.size}
                </span>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mcq")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "mcq"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              MCQ Questions
              {mcqQuestions.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {mcqQuestions.length}
                </span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Coding Questions Tab */}
      {config.includesCoding && activeTab === "coding" && (
        <>
          {/* Selected coding chip strip */}
          {selectedCodingArray.length > 0 && (
            <Card className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground shrink-0">
                  {selectedCoding.size} selected:
                </span>
                {selectedCodingArray.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProblem(p)}
                    className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20 transition-colors"
                  >
                    {p.title}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                {selectedCodingArray.length > 8 && (
                  <span className="text-xs text-muted-foreground">
                    +{selectedCodingArray.length - 8} more
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearCodingSelection}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </div>
            </Card>
          )}

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problems..."
                value={search}
                onChange={(e) => applySearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              {(["", "easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d || "all"}
                  type="button"
                  onClick={() => applyDifficulty(d)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    difficulty === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {d === "" ? "All" : DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Problem list */}
          <Card className="overflow-hidden">
            {fetching ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !pageData || pageData.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Code2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No problems found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pageData.data.map((problem) => {
                  const isSelected = selectedCoding.has(problem.id);
                  return (
                    <button
                      key={problem.id}
                      type="button"
                      onClick={() => toggleProblem(problem)}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3 text-left transition-colors",
                        isSelected ? "bg-primary/5" : "hover:bg-muted/40",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-border bg-background",
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>

                      <span className="flex-1 text-sm text-foreground truncate">
                        {problem.title}
                      </span>

                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          DIFFICULTY_COLORS[problem.difficulty_bucket] ?? "",
                        )}
                      >
                        {DIFFICULTY_LABELS[problem.difficulty_bucket] ??
                          problem.difficulty_bucket}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {pageData
                  ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, pageData.total)} of ${pageData.total} problems`
                  : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || fetching}
                  onClick={() => setPage((p) => p - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground px-1">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || fetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MCQ Questions Tab */}
      {config.includesMCQ && activeTab === "mcq" && (
        <div className="space-y-4">
          {/* MCQ List */}
          {mcqQuestions.length > 0 && (
            <div className="space-y-3">
              {mcqQuestions.map((mcq, index) => (
                <Card key={mcq.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-2">
                        {index + 1}. {mcq.question}
                      </p>
                      <div className="space-y-1">
                        {mcq.options.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2 text-xs">
                            <div
                              className={cn(
                                "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                                opt.id === mcq.correctOptionId
                                  ? "border-accent bg-accent/10"
                                  : "border-border",
                              )}
                            >
                              {opt.id === mcq.correctOptionId && (
                                <div className="h-2 w-2 rounded-full bg-accent" />
                              )}
                            </div>
                            <span className="text-muted-foreground">{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMCQ(mcq)}
                        className="h-8 w-8 p-0"
                      >
                        <Code2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMCQ(mcq.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Add MCQ Button */}
          {!editingMCQ && (
            <Button
              variant="outline"
              onClick={createNewMCQ}
              className="w-full gap-2 border-dashed"
            >
              <Plus className="h-4 w-4" />
              Add MCQ Question
            </Button>
          )}

          {/* MCQ Editor */}
          {editingMCQ && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {mcqQuestions.find((q) => q.id === editingMCQ.id) ? "Edit" : "New"} MCQ Question
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="mcq-question">Question</Label>
                  <Textarea
                    id="mcq-question"
                    value={editingMCQ.question}
                    onChange={(e) => updateMCQQuestion(e.target.value)}
                    placeholder="Enter your question here..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div>
                  <Label>Options (select the correct answer)</Label>
                  <div className="space-y-2 mt-2">
                    {editingMCQ.options.map((option, idx) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCorrectOption(option.id)}
                          className={cn(
                            "h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors",
                            option.id === editingMCQ.correctOptionId
                              ? "border-accent bg-accent/10"
                              : "border-border hover:border-accent/50",
                          )}
                        >
                          {option.id === editingMCQ.correctOptionId && (
                            <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                          )}
                        </button>
                        <Input
                          value={option.text}
                          onChange={(e) => updateMCQOption(option.id, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1"
                        />
                        {editingMCQ.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMCQOption(option.id)}
                            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addMCQOption}
                    className="mt-2 gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Add Option
                  </Button>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setEditingMCQ(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={saveMCQ} className="flex-1 gap-2">
                    <Check className="h-4 w-4" />
                    Save Question
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {mcqQuestions.length === 0 && !editingMCQ && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No MCQ questions added yet. Click the button above to create one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}