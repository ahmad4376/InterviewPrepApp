"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, ArrowLeft, ArrowRight, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";

interface CustomQuestion {
  question:     string;
  sampleAnswer: string;
  rubric:       string[];
}

interface Config {
  title:           string;
  company:         string;
  description:     string;
  jobLevel:        string;
  numQuestions:    number;
  interviewType:   "hr" | "technical";
  isMassInterview: boolean;
}

export default function CustomQuestionsPage() {
    const router = useRouter();
    const [config, setConfig]           = useState<Config | null>(null);
    const [questions, setQuestions]     = useState<CustomQuestion[]>([]);
    const [currentIdx, setCurrentIdx]   = useState(0);
    const [submitting, setSubmitting]   = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [direction, setDirection]     = useState<"next" | "prev">("next");
    const [animating, setAnimating]     = useState(false);

    useEffect(() => {
        const raw = sessionStorage.getItem("customInterviewConfig");
        if (!raw) { router.replace("/create-interview"); return; }
        try {
        const cfg: Config = JSON.parse(raw);
        setConfig(cfg);
        setQuestions(
                Array.from({ length: cfg.numQuestions }, () => ({
                    question:     "",
                    sampleAnswer: "",
                    rubric:       [""],
                })),
            );
        } catch {
        router.replace("/create-interview");
        }
    }, [router]);

    const updateQuestion = (field: keyof CustomQuestion, value: string) => {
        setQuestions((prev) =>
        prev.map((q, i) => (i === currentIdx ? { ...q, [field]: value } : q)),
        );
    };

    const navigate = (dir: "next" | "prev") => {
        if (animating) return;
        setDirection(dir);
        setAnimating(true);
        setTimeout(() => {
        setCurrentIdx((i) => (dir === "next" ? i + 1 : i - 1));
        setAnimating(false);
        }, 200);
    };

    const addQuestion = () => {
        setQuestions((prev) => [...prev, { question: "", sampleAnswer: "", rubric: [""] }]);
        setDirection("next");
        setAnimating(true);
        setTimeout(() => {
        setCurrentIdx(questions.length);
        setAnimating(false);
        }, 200);
    };

    const deleteQuestion = () => {
        if (questions.length === 1) {
        toast.error("You need at least one question");
        return;
        }
        setQuestions((prev) => prev.filter((_, i) => i !== currentIdx));
        setCurrentIdx((i) => Math.max(0, i - 1));
    };

    const addRubricPoint = () => {
        setQuestions((prev) =>
            prev.map((q, i) =>
            i === currentIdx ? { ...q, rubric: [...q.rubric, ""] } : q,
            ),
        );
    };

    const updateRubricPoint = (pointIdx: number, value: string) => {
        setQuestions((prev) =>
            prev.map((q, i) =>
            i === currentIdx
                ? { ...q, rubric: q.rubric.map((p, pi) => (pi === pointIdx ? value : p)) }
                : q,
            ),
        );
    };

    const removeRubricPoint = (pointIdx: number) => {
        setQuestions((prev) =>
            prev.map((q, i) =>
            i === currentIdx
                ? { ...q, rubric: q.rubric.filter((_, pi) => pi !== pointIdx) }
                : q,
            ),
        );
    };

    const handleCreate = async () => {
        if (!config) return;

        const valid = questions.filter((q) => {
        if (!q.question.trim()) return false;
            const hasSampleAnswer = q.sampleAnswer.trim().length > 0;
            const hasRubric       = q.rubric.some((p) => p.trim().length > 0);
            return hasSampleAnswer || hasRubric;
        });

        if (valid.length === 0) {
            toast.error("Each question needs either a Sample Answer or at least one Rubric criteria");
            return;
        }

        // Check if current page has an issue before submitting
        const currentInvalid = questions.findIndex((q) => {
            if (!q.question.trim()) return false; // empty questions are skipped anyway
            return !q.sampleAnswer.trim() && q.rubric.every((p) => !p.trim());
        });

        if (currentInvalid !== -1) {
            toast.error(`Question ${currentInvalid + 1} needs either a Sample Answer or Rubric`);
            setCurrentIdx(currentInvalid);
            return;
        }

        setSubmitting(true);
        try {
        const res = await fetch("/api/interviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title:             config.title,
                company:           config.company,
                description:       config.description,
                jobLevel:          config.jobLevel,
                interviewType:     config.interviewType,
                isMassInterview:   config.isMassInterview,
                isCustomInterview: true,
                customQuestions:   valid.map((q) => ({
                    question:     q.question,
                    sampleAnswer: q.sampleAnswer,
                    rubric:       q.rubric.filter((p) => p.trim()),
                })),
                numQuestions: valid.length,
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error ?? "Failed to create interview");
        }

        sessionStorage.removeItem("customInterviewConfig");
        toast.success("Interview created");
        router.push("/dashboard");
        } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
        setSubmitting(false);
        setShowConfirm(false);
        }
    };

    if (!config || questions.length === 0) {
        return (
        <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#3ecf8e]" />
        </div>
        );
    }

    const current      = questions[currentIdx]!;
    const isLast       = currentIdx === questions.length - 1;
    const isFirst      = currentIdx === 0;
    const filledCount  = questions.filter((q) => q.question.trim()).length;
    const allFilled    = filledCount === questions.length;

    return (
        <div className="min-h-screen bg-[#0b0b0b] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
            <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-[#3ecf8e] opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}
            />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
            <div>
                <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition mb-2"
                >
                <ArrowLeft size={14} />
                Back
                </button>
                <h1 className="text-2xl font-bold text-white">{config.title}</h1>
                <p className="text-sm text-gray-400 mt-1">
                Question{" "}
                <span className="text-white font-semibold">{currentIdx + 1}</span>
                {" "}of{" "}
                <span className="text-white font-semibold">{questions.length}</span>
                {" "}·{" "}
                <span className={allFilled ? "text-[#3ecf8e]" : "text-gray-500"}>
                    {filledCount} filled
                </span>
                </p>
            </div>

            {/* Create Interview button — top right on last question */}
            {isLast && (
                <button
                onClick={() => setShowConfirm(true)}
                disabled={submitting || filledCount === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-[#3ecf8e] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#36be81] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                <CheckCircle2 size={16} />
                Create Interview
                </button>
            )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-white/10 rounded-full mb-8">
            <div
                className="h-1 bg-[#3ecf8e] rounded-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
            </div>

            {/* Question Card */}
            <div
            className={`transition-all duration-200 ${
                animating
                ? direction === "next"
                    ? "opacity-0 translate-x-4"
                    : "opacity-0 -translate-x-4"
                : "opacity-100 translate-x-0"
            }`}
            >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur space-y-6">
                {/* Question field */}
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Question
                    <span className="text-red-400 ml-1">*</span>
                </label>
                <textarea
                    rows={4}
                    value={current.question}
                    onChange={(e) => updateQuestion("question", e.target.value)}
                    placeholder="e.g. Tell me about a time you handled a difficult team conflict..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-[#3ecf8e] focus:outline-none focus:ring-1 focus:ring-[#3ecf8e] resize-none text-sm leading-relaxed"
                />
                </div>

                {/* Sample Answer field */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sample Answer
                        <span className="text-gray-500 ml-2 text-xs font-normal">(used for scoring guidance)</span>
                    </label>
                    <textarea
                        rows={5}
                        value={current.sampleAnswer}
                        onChange={(e) => updateQuestion("sampleAnswer", e.target.value)}
                        placeholder="e.g. A strong answer would demonstrate empathy, active listening, and conflict resolution skills. The candidate should describe a specific situation using the STAR method..."
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-[#3ecf8e] focus:outline-none focus:ring-1 focus:ring-[#3ecf8e] resize-none text-sm leading-relaxed"
                    />
                </div>

                {/* Rubric field */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Rubric
                        <span className="text-gray-500 ml-2 text-xs font-normal">
                        (scoring criteria — fill either this or Sample Answer)
                        </span>
                    </label>

                    <div className="space-y-2">
                        {current.rubric.map((point, pi) => (
                        <div key={pi} className="flex items-start gap-2">
                            <span className="mt-2.5 text-[#3ecf8e] text-xs shrink-0">•</span>
                            <input
                            type="text"
                            value={point}
                            onChange={(e) => updateRubricPoint(pi, e.target.value)}
                            placeholder={`Criteria ${pi + 1}...`}
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#3ecf8e] focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]"
                            />
                            {current.rubric.length > 1 && (
                            <button
                                onClick={() => removeRubricPoint(pi)}
                                className="mt-2 text-gray-600 hover:text-red-400 transition"
                            >
                                <X size={14} />
                            </button>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    onClick={addRubricPoint}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#3ecf8e] transition"
                >
                    <Plus size={12} />
                    Add criteria
                </button>

                {/* Validation hint */}
                {!current.sampleAnswer.trim() && current.rubric.every((p) => !p.trim()) && (
                    <p className="text-xs text-red-400 mt-2">
                    Please fill in either a Sample Answer or at least one Rubric criteria.
                    </p>
                )}
                </div>

                {/* Delete button */}
                <div className="flex justify-end">
                <button
                    onClick={deleteQuestion}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition"
                >
                    <Trash2 size={13} />
                    Delete this question
                </button>
                </div>
            </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
            <button
                onClick={() => navigate("prev")}
                disabled={isFirst || animating}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ArrowLeft size={14} />
                Previous
            </button>

            <div className="flex items-center gap-2">
                {/* Dot indicators */}
                {questions.map((q, i) => (
                <button
                    key={i}
                    onClick={() => {
                    if (i === currentIdx) return;
                    setDirection(i > currentIdx ? "next" : "prev");
                    setAnimating(true);
                    setTimeout(() => { setCurrentIdx(i); setAnimating(false); }, 200);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIdx
                        ? "bg-[#3ecf8e] w-4"
                        : q.question.trim()
                        ? "bg-white/40"
                        : "bg-white/15"
                    }`}
                />
                ))}
            </div>

            {isLast ? (
                <button
                onClick={addQuestion}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition"
                >
                <Plus size={14} />
                Add Question
                </button>
            ) : (
                <button
                onClick={() => navigate("next")}
                disabled={isLast || animating}
                className="inline-flex items-center gap-2 rounded-lg bg-[#3ecf8e] px-4 py-2.5 text-sm font-medium text-black hover:bg-[#36be81] transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                Next
                <ArrowRight size={14} />
                </button>
            )}
            </div>
        </div>

        {/* Confirm Modal */}
        {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-2">Create Interview</h2>
                <p className="text-sm text-gray-400 mb-1">
                You have added{" "}
                <span className="text-white font-semibold">{questions.filter(q => q.question.trim()).length} questions</span>{" "}
                for:
                </p>
                <p className="text-sm text-[#3ecf8e] font-medium mb-2">{config.title}</p>
                {questions.some(q => !q.question.trim()) && (
                <p className="text-xs text-yellow-400 mb-4">
                    ⚠ {questions.filter(q => !q.question.trim()).length} empty question(s) will be skipped.
                </p>
                )}
                <p className="text-xs text-gray-500 mb-6">
                This will schedule the interview. Candidates will be asked your custom questions in order.
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
                    onClick={handleCreate}
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