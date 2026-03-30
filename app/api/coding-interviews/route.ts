import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "app/lib/mongodb";
import { getAuthUserId } from "app/lib/auth";
import CodingInterview from "app/models/CodingInterview";
import { Problem } from "app/models/LeetcodeQuestion";

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const interviews = await CodingInterview.find({ userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json(interviews);
  } catch (error) {
    console.error("Error fetching coding interviews:", error);
    return NextResponse.json({ error: "Failed to fetch coding interviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    // const { title, difficulty = "mixed", numProblems = 5, timeLimit = null, tags = [] } = body;
    const { title, difficulty = 3, numProblems = 5, timeLimit = null, tags = [], isMassInterview = false, isCustomMass = false, customProblemIds = [] } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (![3, 5, 10].includes(numProblems)) {
      return NextResponse.json({ error: "numProblems must be 3, 5, or 10" }, { status: 400 });
    }

    // Select problems based on difficulty and tags
    const filter: Record<string, unknown> = {
      problem_format: "leetcode",
    };
    if (tags.length > 0) {
      filter.tags = { $in: tags };
    }

    let problemIds: string[] = [];

    if (isCustomMass && Array.isArray(customProblemIds) && customProblemIds.length > 0) {
      // Custom mass interview — use exactly the problems the user selected
      problemIds = customProblemIds.slice(0, numProblems);
    } else {
      // Numeric difficulty distribution
      const distributions: Record<number, { easy: number; medium: number; hard: number }> = {
        1: { easy: 1.0,  medium: 0.0,  hard: 0.0 },
        2: { easy: 0.7,  medium: 0.3,  hard: 0.0 },
        3: { easy: 0.5,  medium: 0.5,  hard: 0.0 },
        4: { easy: 0.2,  medium: 0.6,  hard: 0.2 },
        5: { easy: 0.0,  medium: 0.6,  hard: 0.4 },
      };

      const dist = distributions[Number(difficulty)] ? distributions[Number(difficulty)] : distributions[3];
      const easyCount  = Math.round(numProblems * (dist ? dist.easy : 0));
      const hardCount  = Math.round(numProblems * (dist ? dist.hard : 0));
      const mediumCount = numProblems - easyCount - hardCount;

      const filter: Record<string, unknown> = {};
      if (tags.length > 0) filter.tags = { $in: tags };

      const fetchBucket = async (bucket: string, count: number) => {
        if (count <= 0) return [];
        const results = await Problem.aggregate([
          { $match: { ...filter, difficulty_bucket: bucket } },
          { $sample: { size: count } },
          { $project: { id: 1 } },
        ]);
        return results.map((p: { id: string }) => p.id);
      };

      const [easy, medium, hard] = await Promise.all([
        fetchBucket("easy",   easyCount),
        fetchBucket("medium", mediumCount),
        fetchBucket("hard",   hardCount),
      ]);

      problemIds = [...easy, ...medium, ...hard].slice(0, numProblems);
    }

    if (problemIds.length === 0) {
      return NextResponse.json({ error: "No problems found matching criteria" }, { status: 400 });
    }

    console.log("difficulty type: ", typeof difficulty);
    console.log("difficulty: ",difficulty);
    const interview = await CodingInterview.create({
      userId,
      title,
      difficulty,
      numProblems: problemIds.length,
      timeLimit,
      tags,
      status: "scheduled",
      problems: problemIds,
      isMassInterview: !!(isMassInterview || isCustomMass),
      isCustomMass: !!isCustomMass,
      ...(isMassInterview || isCustomMass ? { shareToken: crypto.randomUUID() } : {}),
      submissions: problemIds.map((pid) => ({
        problemId: pid,
        language: "javascript",
        code: "",
        status: "not_attempted",
        testsPassed: 0,
        testsTotal: 0,
        runtime: "N/A",
        submittedAt: null,
      })),
    });

    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    console.error("Error creating coding interview:", error);
    return NextResponse.json({ error: "Failed to create coding interview" }, { status: 500 });
  }
}
