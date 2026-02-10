/**
 * Shared types for the adaptive interview system.
 * Used by both server (question selection) and client (scoring, sampling).
 * Must not import any server-only modules.
 */

export interface IPoolQuestion {
  question_id: string;
  question_title: string;
  question_text: string;
  answer_text: string;
  tags: string[];
  difficulty_score: number;
}

/** Quality assessment from the LLM */
export type ResponseQuality = "excellent" | "good" | "partial" | "poor";

/** LLM-determined action for next question selection */
export type NextAction = "move_on" | "go_deeper";

/** Parameters the LLM provides via function call */
export interface LlmAnalysis {
  response_quality: ResponseQuality;
  next_action: NextAction;
  suggested_topics: string[];
  user_response_summary: string;
}

export interface AdaptiveState {
  pool: IPoolQuestion[];
  samplingPlan: number[];
  currentPlanIndex: number;
  questionsAsked: number;
  totalQuestions: number;
  currentQuestionId: string | null;
  currentExpectedAnswer: string;
  currentQuestionTags: string[];
  topicsAsked: string[];
}

export type AdaptiveResult =
  | { action: "ask"; question: IPoolQuestion }
  | { action: "end" };
