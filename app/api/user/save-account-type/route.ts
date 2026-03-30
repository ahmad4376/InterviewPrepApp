import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "app/lib/mongodb";
import { User } from "app/models/User";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountType } = await req.json();
  if (!["user", "business"].includes(accountType))
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });

  // Save to Clerk unsafeMetadata for future reference
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    unsafeMetadata: { accountType },
  });

  // Save to MongoDB
  await connectDB();
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name  = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();

  await User.findOneAndUpdate(
    { clerkId: userId },
    { clerkId: userId, email, name, accountType },
    { upsert: true, new: true },
  );

  return NextResponse.json({ success: true, accountType });
}