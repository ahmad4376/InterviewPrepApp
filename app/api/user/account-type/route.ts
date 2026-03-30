import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "app/lib/mongodb";
import { User } from "app/models/User";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ clerkId: userId });
  if (!user) return NextResponse.json({ accountType: "user" });

  return NextResponse.json({ accountType: user.accountType });
}