import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthUserId } from "app/lib/auth";
import { connectDB } from "app/lib/mongodb";
import { generateFeedback } from "app/lib/openai";
import Interview from "app/models/Interview";
import type { TranscriptEntry } from "app/models/Interview";

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
  }

  await connectDB();

  const interview = await Interview.findOne({ _id: id, userId }).lean();

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  return NextResponse.json(interview);
}

const ALLOWED_STATUSES = ["scheduled", "in-progress", "completed"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
  }

  const body = await request.json();

  // Field edit path: update title/company/description (no status change)
  if (!body.status && (body.title || body.company || body.description)) {
    const { title, company, description } = body as {
      title?: string;
      company?: string;
      description?: string;
    };

    if (
      typeof title !== "string" || !title.trim() ||
      typeof company !== "string" || !company.trim() ||
      typeof description !== "string" || !description.trim()
    ) {
      return NextResponse.json(
        { error: "Title, company, and description are all required" },
        { status: 400 },
      );
    }

    await connectDB();

    const interview = await Interview.findOne({ _id: id, userId }).lean();
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if ((interview as { status: string }).status !== "scheduled") {
      return NextResponse.json(
        { error: "Only scheduled interviews can be edited" },
        { status: 400 },
      );
    }

    await Interview.findOneAndUpdate(
      { _id: id, userId },
      { title: title.trim(), company: company.trim(), description: description.trim() },
    );

    return NextResponse.json({
      success: true,
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
    });
  }

  // Status update path
  const { status, transcript } = body as {
    status: string;
    transcript?: TranscriptEntry[];
  };

  if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json(
      { error: "Invalid status. Must be one of: scheduled, in-progress, completed" },
      { status: 400 },
    );
  }

  await connectDB();

  // If completing with transcript, generate feedback
  if (status === "completed" && Array.isArray(transcript) && transcript.length > 0) {
    const interview = await Interview.findOne({ _id: id, userId }).lean();
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
      // Still save transcript and status even if feedback fails
    }

    const updated = await Interview.findOneAndUpdate(
      { _id: id, userId },
      { status, transcript, feedback },
      { new: true },
    );

    if (!updated) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: updated.status });
  }

  const updated = await Interview.findOneAndUpdate(
    { _id: id, userId },
    { status },
    { new: true },
  );

  if (!updated) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, status: updated.status });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
  }

  await connectDB();

  const deleted = await Interview.findOneAndDelete({ _id: id, userId });

  if (!deleted) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
