import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "app/lib/mongodb";
import { Problem } from "app/models/LeetcodeQuestion";

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: "javascript", version: "18.15.0" },
  python: { language: "python", version: "3.10.0" },
  cpp: { language: "c++", version: "10.2.0" },
};

async function runOnPiston(sourceCode: string, language: string, stdin: string) {
  const lang = LANGUAGE_MAP[language];
  const res = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: lang ? lang.language : null,
      version: lang ? lang.version : null,
      files: [{ content: sourceCode }],
      stdin,
    }),
  });
  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { code, language, problemId } = await request.json();

    if (!code || !language || !problemId) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    if (!LANGUAGE_MAP[language]) {
      return NextResponse.json({ success: false, error: "Unsupported language" }, { status: 400 });
    }

    const problem = await Problem.findOne({ id: problemId });
    if (!problem) {
      return NextResponse.json({ success: false, error: "Problem not found" }, { status: 404 });
    }

    if (problem.examples.length === 0) {
      return NextResponse.json({ success: false, error: "No test cases found" }, { status: 400 });
    }

    const results = await Promise.all(
      problem.examples.map(async (tc, idx) => {
        try {
          const result = await runOnPiston(code, language, tc.input);
          const actualOutput = (result.run?.stdout ?? "").trim();
          const expectedOutput = tc.output.trim();
          const error = result.run?.stderr?.trim() || null;
          const passed = !error && actualOutput === expectedOutput;

          return {
            testCase: idx + 1,
            passed,
            input: tc.input,
            expected: expectedOutput,
            output: actualOutput,
            time: "N/A", // Piston doesn't return runtime
            error,
            hidden: idx >= 2,
          };
        } catch {
          return {
            testCase: idx + 1,
            passed: false,
            input: tc.input,
            expected: tc.output.trim(),
            output: "",
            time: "N/A",
            error: "Execution failed",
            hidden: idx >= 2,
          };
        }
      }),
    );

    const allPassed = results.every((r) => r.passed);

    return NextResponse.json({ success: true, allPassed, results });
  } catch (error) {
    console.error("Execution error:", error);
    return NextResponse.json({ success: false, error: "Execution failed" }, { status: 500 });
  }
}
