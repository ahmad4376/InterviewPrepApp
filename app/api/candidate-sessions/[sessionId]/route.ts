import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthUserId } from "app/lib/auth";
import { connectDB } from "app/lib/mongodb";
import { generateFeedback } from "app/lib/openai";
import CandidateSession from "app/models/CandidateSession";
import Interview from "app/models/Interview";
import type { TranscriptEntry } from "app/models/Interview";

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  if (!isValidObjectId(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  await connectDB();

  const session = await CandidateSession.findOne({ _id: sessionId }).lean();
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Authorized: candidate themselves OR interview creator
  const isCandidate = (session.candidateUserId as string) === userId;
  let isCreator = false;
  if (!isCandidate) {
    const interview = await Interview.findOne({
      _id: session.interviewId,
      userId,
    }).lean();
    isCreator = !!interview;
  }

  if (!isCandidate && !isCreator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(session);
}

const ALLOWED_STATUSES = ["scheduled", "in-progress", "completed"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  if (!isValidObjectId(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  const body = await request.json();
  const { status, transcript } = body as {
    status: string;
    transcript?: TranscriptEntry[];
  };

  if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await connectDB();

  // Only the candidate can update their own session
  const session = await CandidateSession.findOne({
    _id: sessionId,
    candidateUserId: userId,
  }).lean();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Generate feedback when completing with transcript
  if (status === "completed" && Array.isArray(transcript) && transcript.length > 0) {
    const interview = await Interview.findOne({ _id: session.interviewId }).lean();
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    let feedback = null;
    try {
      feedback = await generateFeedback(
        transcript,
        interview.title as string,
        interview.company as string,
      );
    } catch (err) {
      console.error("Feedback generation failed:", err);
    }

    await CandidateSession.findOneAndUpdate({ _id: sessionId }, { status, transcript, feedback });

    return NextResponse.json({ success: true, status });
  }

  await CandidateSession.findOneAndUpdate({ _id: sessionId }, { status });
  return NextResponse.json({ success: true, status });
}
