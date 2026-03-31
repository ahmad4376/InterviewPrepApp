import { NextResponse } from "next/server";
import { getAuthUserId, getAuthContext } from "app/lib/auth";
import { connectDB } from "app/lib/mongodb";
import { generatePoolQuestions, generateHRQuestions } from "app/lib/openai";
import { selectQuestions } from "app/lib/questionSelection";
import { buildSamplingPlan } from "app/lib/sampling";
import {
  checkUsageLimit,
  checkFeature,
  incrementUsage,
  getUserWithTier,
} from "app/lib/subscription/gate";
import Interview from "app/models/Interview";
import type { IPoolQuestion } from "app/lib/types";
import type { ResumeData } from "app/lib/resumeParser";

const DEFAULT_QUESTIONS = 5;
const MAX_QUESTIONS = 20;
const POOL_MULTIPLIER = 4;
const MIN_DB_QUESTIONS = 3;

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check monthly voice interview usage limit
  const { allowed, used, limit } = await checkUsageLimit(userId, "voiceInterviews");
  if (!allowed) {
    return NextResponse.json(
      {
        error: "Monthly interview limit reached",
        used,
        limit,
        upgrade: true,
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("title" in body) ||
    !("company" in body) ||
    !("description" in body) ||
    typeof (body as { title: unknown }).title !== "string" ||
    typeof (body as { company: unknown }).company !== "string" ||
    typeof (body as { description: unknown }).description !== "string"
  ) {
    return NextResponse.json(
      { error: "title, company, and description are required strings" },
      { status: 400 },
    );
  }

  const { title, company, description } = body as {
    title: string;
    company: string;
    description: string;
  };
  const isMassInterview = !!(body as { isMassInterview?: boolean }).isMassInterview;
  const rawFocusAreas = (body as Record<string, unknown>).focusAreas;
  const focusAreas = Array.isArray(rawFocusAreas)
    ? rawFocusAreas.filter((a): a is string => typeof a === "string")
    : undefined;

  // Gate mass interviews to Business tier
  if (isMassInterview) {
    const canMass = await checkFeature(userId, "massInterviews");
    if (!canMass) {
      return NextResponse.json(
        { error: "Mass interviews require a Business plan", upgrade: true },
        { status: 403 },
      );
    }
  }

  // Pull resume data from user profile (if they've uploaded one)
  const user = await getUserWithTier(userId);
  const resumeData = (user.resumeData as ResumeData | null) ?? null;

  // Validate interviewType
  const VALID_INTERVIEW_TYPES = ["technical", "hr"] as const;
  const rawInterviewType = (body as { interviewType?: string }).interviewType;
  const interviewType: "technical" | "hr" =
    typeof rawInterviewType === "string" &&
    VALID_INTERVIEW_TYPES.includes(rawInterviewType as "technical" | "hr")
      ? (rawInterviewType as "technical" | "hr")
      : "technical";

  // Validate jobLevel
  const VALID_JOB_LEVELS = ["associate", "junior", "mid", "senior", "lead"];
  const rawJobLevel = (body as { jobLevel?: string }).jobLevel;
  const jobLevel =
    typeof rawJobLevel === "string" && VALID_JOB_LEVELS.includes(rawJobLevel) ? rawJobLevel : "mid";

  // Validate numQuestions
  const rawNumQuestions = (body as { numQuestions?: unknown }).numQuestions;
  const numQuestions = Math.max(
    1,
    Math.min(MAX_QUESTIONS, Math.round(Number(rawNumQuestions) || DEFAULT_QUESTIONS)),
  );
  const poolSize = numQuestions * POOL_MULTIPLIER;

  if (!title.trim() || !company.trim() || !description.trim()) {
    return NextResponse.json(
      { error: "title, company, and description must not be empty" },
      { status: 400 },
    );
  }

  let questionPool: IPoolQuestion[] = [];

  if (interviewType === "hr") {
    // HR interviews use LLM-generated HR screening questions with focus areas
    console.log("Generating HR screening questions via LLM");
    questionPool = await generateHRQuestions(title, description, poolSize, focusAreas);
  } else {
    // Technical interviews: Fetch questions from DB (pool is larger than what we'll ask)
    try {
      questionPool = await selectQuestions(title, description, poolSize);
      console.log(`Selected ${questionPool.length} questions from DB (wanted ${poolSize})`);
    } catch (err) {
      console.error("DB question selection failed, falling back to OpenAI:", err);
    }

    // If not enough relevant DB questions, discard them and use OpenAI generation
    if (questionPool.length < MIN_DB_QUESTIONS) {
      console.log(
        `Only ${questionPool.length} DB questions found (need ${MIN_DB_QUESTIONS}), using OpenAI generation`,
      );
      questionPool = await generatePoolQuestions(title, description, poolSize, resumeData);
    }
  }

  const totalQuestions = Math.min(numQuestions, questionPool.length);

  // Build sampling plan using job level
  const samplingPlan = buildSamplingPlan(
    totalQuestions,
    jobLevel as "associate" | "junior" | "mid" | "senior" | "lead",
  );

  // Build display questions (simplified) from the pool
  const displayQuestions = questionPool.slice(0, totalQuestions).map((q) => ({
    text: q.question_text,
    topic: q.tags[0] || q.question_title || "General",
  }));

  await connectDB();

  // Stamp org context if user is acting within an organization
  const { orgId } = await getAuthContext();

  const interview = await Interview.create({
    userId,
    organizationId: orgId ?? null,
    title,
    company,
    description,
    jobLevel,
    interviewType,
    questions: displayQuestions,
    status: "scheduled",
    // Candidate resume data
    resumeData,
    // Adaptive state
    questionPool,
    samplingPlan,
    currentQuestionId: null,
    currentQuestionText: "",
    currentExpectedAnswer: "",
    questionsAsked: 0,
    totalQuestions,
    currentPlanIndex: 0,
    // Mass interview
    isMassInterview,
    ...(isMassInterview ? { shareToken: crypto.randomUUID() } : {}),
  });

  // Track usage after successful creation
  await incrementUsage(userId, "voiceInterviews");

  return NextResponse.json(
    {
      interviewId: String(interview._id),
      questions: interview.questions as typeof displayQuestions,
      shareToken: (interview.shareToken as string | null) ?? undefined,
    },
    { status: 201 },
  );
}

export async function GET(_request: Request) {
  const { userId, orgId } = await getAuthContext();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // When in an org context, show org-scoped interviews; otherwise personal
  const filter = orgId ? { organizationId: orgId } : { userId, organizationId: null };

  const interviews = await Interview.find(filter)
    .sort({ createdAt: -1 })
    .select(
      "title company status createdAt feedback isMassInterview shareToken interviewType userId",
    )
    .lean();

  const result = interviews.map((i) => ({
    _id: i._id,
    title: i.title,
    company: i.company,
    status: i.status,
    createdAt: i.createdAt,
    hasFeedback: !!i.feedback,
    isMassInterview: !!i.isMassInterview,
    shareToken: i.shareToken ?? null,
    interviewType: i.interviewType ?? "technical",
  }));

  return NextResponse.json(result);
}
