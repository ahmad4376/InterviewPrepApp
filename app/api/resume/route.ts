import { NextResponse } from "next/server";
import { getAuthUserId } from "app/lib/auth";
import { connectDB } from "app/lib/mongodb";
import UserProfile from "app/models/UserProfile";
import type { ResumeData } from "app/lib/resumeParser";

// POST /api/resume — save or replace resume
export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { resumeData, fileName } = body as {
    resumeData: ResumeData;
    fileName?: string;
  };

  if (!resumeData) {
    return NextResponse.json({ error: "resumeData is required" }, { status: 400 });
  }

  await connectDB();

  // Upsert — create if not exists, update if exists
  await UserProfile.findOneAndUpdate(
    { userId },
    {
      userId,
      resumeData,
      resumeFileName: fileName ?? "resume.pdf",
    },
    { upsert: true, new: true },
  );

  return NextResponse.json({ success: true });
}

// DELETE /api/resume — remove resume
export async function DELETE() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  await UserProfile.findOneAndUpdate({ userId }, { resumeData: null, resumeFileName: null });

  return NextResponse.json({ success: true });
}
