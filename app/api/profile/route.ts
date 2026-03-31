import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getAuthUserId } from "app/lib/auth";
import { connectDB } from "app/lib/mongodb";
import Interview from "app/models/Interview";
import type { IInterview } from "app/models/Interview";
import UserProfile from "app/models/UserProfile";

type InterviewLean = Pick<
  IInterview,
  "title" | "company" | "status" | "createdAt" | "interviewType" | "feedback" | "isMassInterview"
> & { _id: unknown };

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();

  await connectDB();

  const [interviews, userProfile] = await Promise.all([
    Interview.find({ userId })
      .sort({ createdAt: -1 })
      .select("title company status createdAt interviewType feedback isMassInterview")
      .lean<InterviewLean[]>(),
    UserProfile.findOne({ userId }).lean(),
  ]);

  const completed = interviews.filter((i) => i.status === "completed").length;
  const scheduled = interviews.filter((i) => i.status === "scheduled").length;

  const interviewList = interviews.map((i) => ({
    _id: String(i._id),
    title: i.title,
    company: i.company,
    status: i.status,
    interviewType: i.interviewType ?? "technical",
    createdAt: i.createdAt,
    score: i.feedback?.overallScore ?? null,
    hasFeedback: !!i.feedback,
    numQuestions: 0,
  }));

  return NextResponse.json({
    user: {
      name: clerkUser ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() : "User",
      email: clerkUser?.emailAddresses?.[0]?.emailAddress ?? "",
      imageUrl: clerkUser?.imageUrl ?? null,
    },
    stats: {
      completed,
      scheduled,
      total: interviews.length,
    },
    resume: userProfile?.resumeData
      ? {
          fileName: userProfile.resumeFileName,
          data: userProfile.resumeData,
        }
      : null,
    interviews: interviewList,
  });
}
