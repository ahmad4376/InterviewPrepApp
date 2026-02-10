import { CheckCircle2, TrendingUp, Star } from "lucide-react";
import type { InterviewFeedback } from "app/models/Interview";

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={18}
          className={i < Math.round(score) ? "fill-[#3ecf8e] text-[#3ecf8e]" : "text-gray-600"}
        />
      ))}
      <span className="ml-2 text-sm text-gray-400">{score.toFixed(1)}/5</span>
    </div>
  );
}

function LargeStarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={32}
          className={i < Math.round(score) ? "fill-[#3ecf8e] text-[#3ecf8e]" : "text-gray-600"}
        />
      ))}
      <span className="ml-3 text-2xl font-bold text-white">{score.toFixed(1)}</span>
      <span className="text-lg text-gray-400">/5</span>
    </div>
  );
}

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  return (
    <div className="h-2 w-full rounded-full bg-white/10">
      <div className="h-2 rounded-full bg-[#3ecf8e]" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function FeedbackDisplay({ feedback }: { feedback: InterviewFeedback }) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          Overall Score
        </h2>
        <LargeStarRating score={feedback.overallScore} />
        <p className="text-gray-300 mt-4 leading-relaxed">{feedback.summary}</p>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {feedback.categories.map((cat) => (
          <div
            key={cat.name}
            className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold text-sm">{cat.name}</h3>
              <span className="text-[#3ecf8e] font-bold text-sm">{cat.score}/5</span>
            </div>
            <ScoreBar score={cat.score} />
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">{cat.feedback}</p>
          </div>
        ))}
      </div>

      {/* Per-Question Feedback */}
      {feedback.questionFeedback && feedback.questionFeedback.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Question-by-Question
          </h2>
          <div className="space-y-4">
            {feedback.questionFeedback.map((qf, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="text-white text-sm font-medium flex-1">
                    Q{i + 1}: {qf.question}
                  </p>
                  <StarRating score={qf.score} />
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{qf.assessment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
          <h2 className="text-sm font-medium text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Strengths
          </h2>
          <ul className="space-y-2">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="text-sm font-medium text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            Areas for Improvement
          </h2>
          <ul className="space-y-2">
            {feedback.improvements.map((imp, i) => (
              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-amber-400 mt-0.5 shrink-0">&uarr;</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
