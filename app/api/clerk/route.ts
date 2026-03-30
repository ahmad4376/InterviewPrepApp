import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { connectDB } from "app/lib/mongodb";
import { User } from "app/models/User";

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "No secret" }, { status: 500 });

  const body = await req.text();
  const headers = {
    "svix-id":        req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = new Webhook(secret).verify(body, headers) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created") {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      unsafe_metadata,
    } = event.data as {
      id: string;
      email_addresses: { email_address: string }[];
      first_name: string;
      last_name: string;
      unsafe_metadata: { accountType?: string };
    };

    await connectDB();
    await User.findOneAndUpdate(
      { clerkId: id },
      {
        clerkId: id,
        email: email_addresses[0]?.email_address ?? "",
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        accountType: unsafe_metadata?.accountType === "business" ? "business" : "user",
      },
      { upsert: true, new: true },
    );
  }

  return NextResponse.json({ received: true });
}