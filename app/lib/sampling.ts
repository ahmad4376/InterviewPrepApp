/**
 * Adaptive sampling logic for interview question selection.
 * Client-compatible — no server-only imports.
 */

import type { AdaptiveState, AdaptiveResult, LlmAnalysis } from "./types";
import { getTargetDifficulty, rankCandidates } from "./scoring";

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
}

const MID_DISTRIBUTION = [0.1, 0.2, 0.35, 0.25, 0.1];

export function buildSamplingPlan(totalQuestions: number): number[] {
  const raw = MID_DISTRIBUTION.map((p) => p * totalQuestions);
  const counts = raw.map((v) => Math.floor(v));
  const assigned = counts.reduce((a, b) => a + b, 0);

  const remaining = totalQuestions - assigned;
  if (remaining > 0) {
    const fractions = raw
      .map((v, i) => ({ idx: i, frac: v - Math.floor(v) }))
      .sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < remaining; i++) {
      const frac = fractions[i % fractions.length]!;
      counts[frac.idx]!++;
    }
  }

  const plan: number[] = [];
  for (let i = 0; i < counts.length; i++) {
    const difficulty = i + 1;
    for (let j = 0; j < (counts[i] ?? 0); j++) plan.push(difficulty);
  }

  shuffleInPlace(plan);
  return plan.slice(0, totalQuestions);
}

/**
 * Select the next question based on the LLM's analysis.
 * Mutates state.pool in place (removes selected question).
 * Advances state.currentPlanIndex.
 */
export function selectNextQuestion(
  state: AdaptiveState,
  analysis: LlmAnalysis,
): AdaptiveResult {
  // Check if we've asked enough questions
  if (state.questionsAsked >= state.totalQuestions) {
    return { action: "end" };
  }

  // Check if pool is exhausted
  if (state.pool.length === 0) {
    return { action: "end" };
  }

  // Determine target difficulty from sampling plan + quality adjustment
  const planIdx = Math.min(
    state.currentPlanIndex,
    state.samplingPlan.length - 1,
  );
  const planDifficulty = state.samplingPlan[planIdx] ?? 3;
  const targetDifficulty = getTargetDifficulty(
    planDifficulty,
    analysis.response_quality,
  );

  // Determine which topics to search for
  let searchTopics = analysis.suggested_topics;

  // If "go_deeper" and LLM didn't suggest topics, fall back to current question's tags
  if (analysis.next_action === "go_deeper" && searchTopics.length === 0) {
    searchTopics = state.currentQuestionTags;
  }

  // Rank all remaining questions by topic match + difficulty fit
  const ranked = rankCandidates(state.pool, searchTopics, targetDifficulty);

  // Apply topic diversity penalty and random jitter to break ties
  const recentTopics = new Set(
    (state.topicsAsked ?? []).slice(-3).map((t) => t.toLowerCase()),
  );
  const REPEAT_PENALTY = 0.15;
  const JITTER_MAX = 0.05;

  const diversified = ranked.map((c) => {
    const primaryTag = (c.question.tags[0] ?? "").toLowerCase();
    const penalty =
      primaryTag && recentTopics.has(primaryTag) ? REPEAT_PENALTY : 0;
    return {
      ...c,
      adjustedScore: c.totalScore - penalty + Math.random() * JITTER_MAX,
    };
  });
  diversified.sort((a, b) => b.adjustedScore - a.adjustedScore);

  // Pick the best candidate (must have some topic relevance if topics were provided)
  let selected = diversified[0]?.question ?? null;

  // Fallback: if no topic match at all, pick by difficulty distance with randomization
  if (
    !selected ||
    (searchTopics.length > 0 && (diversified[0]?.topicScore ?? 0) === 0)
  ) {
    const byDifficulty = [...state.pool].map((q) => ({
      q,
      dist: Math.abs(q.difficulty_score - targetDifficulty),
    }));
    byDifficulty.sort((a, b) => a.dist - b.dist);
    const minDist = byDifficulty[0]?.dist ?? Infinity;
    const tied = byDifficulty.filter((x) => x.dist === minDist);
    selected = tied[Math.floor(Math.random() * tied.length)]?.q ?? null;
  }

  if (!selected) {
    return { action: "end" };
  }

  // Remove selected question from pool
  const idx = state.pool.findIndex(
    (q) => q.question_id === selected!.question_id,
  );
  if (idx !== -1) {
    state.pool.splice(idx, 1);
  }

  // Track topic for diversity
  const primaryTopic = (selected.tags[0] ?? "").toLowerCase();
  if (primaryTopic) {
    if (!state.topicsAsked) state.topicsAsked = [];
    state.topicsAsked.push(primaryTopic);
  }

  // Advance plan index
  state.currentPlanIndex = Math.min(
    state.currentPlanIndex + 1,
    state.samplingPlan.length,
  );

  return { action: "ask", question: selected };
}
