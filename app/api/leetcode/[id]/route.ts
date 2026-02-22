import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "app/lib/mongodb";
import { Problem } from "app/models/LeetcodeQuestion";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const problem = await Problem.findOne({ id: params.id });

    if (!problem) {
      return NextResponse.json({ success: false, error: "Problem not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: problem }, { status: 200 });
  } catch (error) {
    console.error("Error fetching problem:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch problem" }, { status: 500 });
  }
}
