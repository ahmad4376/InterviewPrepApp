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

    // With this:
    const fullInput = problem.examples[0]?.input ?? "";
    const fullExpected = (problem.examples[0]?.output ?? "").trim();

    if (!fullInput) {
      return NextResponse.json({ success: false, error: "No test cases found" }, { status: 400 });
    }

    const result = await runOnPiston(code, language, fullInput);
    const actualOutput = (result.run?.stdout ?? "").trim();
    const error = result.run?.stderr?.trim() || null;

    // Compare line by line so we can show per-case results
    const expectedLines = fullExpected
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);
    const actualLines = actualOutput
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    const inputLines = fullInput.trim().split("\n");
    const firstLine = inputLines[0]?.trim() ?? "";
    const t = parseInt(firstLine);

    // Replace the results mapping:
    const results = expectedLines.map((expected, idx) => ({
      testCase: idx + 1,
      passed: actualLines[idx] === expected,
      input: `Test case ${idx + 1} of ${isNaN(t) ? "?" : t}`,
      expected,
      output: actualLines[idx] ?? "(no output)",
      time: "N/A",
      error: idx === 0 ? error : null,
      hidden: idx >= 2,
    }));

    const allPassed = results.every((r) => r.passed);

    return NextResponse.json({ success: true, allPassed, results });
  } catch (error) {
    console.error("Execution error:", error);
    return NextResponse.json({ success: false, error: "Execution failed" }, { status: 500 });
  }
}
