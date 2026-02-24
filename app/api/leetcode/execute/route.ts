// import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from "app/lib/mongodb";
// import { Problem } from "app/models/LeetcodeQuestion";

// const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
//   javascript: { language: "javascript", version: "18.15.0" },
//   python: { language: "python", version: "3.10.0" },
//   cpp: { language: "c++", version: "10.2.0" },
// };

// async function runOnPiston(sourceCode: string, language: string, stdin: string) {
//   const lang = LANGUAGE_MAP[language];
//   const res = await fetch("https://emkc.org/api/v2/piston/execute", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       language: lang ? lang.language : null,
//       version: lang ? lang.version : null,
//       files: [{ content: sourceCode }],
//       stdin,
//     }),
//   });
//   return res.json();
// }

// export async function POST(request: NextRequest) {
//   try {
//     await connectDB();

//     const { code, language, problemId } = await request.json();

//     if (!code || !language || !problemId) {
//       return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
//     }

//     if (!LANGUAGE_MAP[language]) {
//       return NextResponse.json({ success: false, error: "Unsupported language" }, { status: 400 });
//     }

//     const problem = await Problem.findOne({ id: problemId });
//     if (!problem) {
//       return NextResponse.json({ success: false, error: "Problem not found" }, { status: 404 });
//     }

//     if (problem.examples.length === 0) {
//       return NextResponse.json({ success: false, error: "No test cases found" }, { status: 400 });
//     }

//     // With this:
//     const fullInput = problem.examples[0]?.input ?? "";
//     const fullExpected = (problem.examples[0]?.output ?? "").trim();

//     if (!fullInput) {
//       return NextResponse.json({ success: false, error: "No test cases found" }, { status: 400 });
//     }

//     const result = await runOnPiston(code, language, fullInput);
//     const actualOutput = (result.run?.stdout ?? "").trim();
//     const error = result.run?.stderr?.trim() || null;

//     // Compare line by line so we can show per-case results
//     const expectedLines = fullExpected
//       .split("\n")
//       .map((l: string) => l.trim())
//       .filter(Boolean);
//     const actualLines = actualOutput
//       .split("\n")
//       .map((l: string) => l.trim())
//       .filter(Boolean);

//     const inputLines = fullInput.trim().split("\n");
//     const firstLine = inputLines[0]?.trim() ?? "";
//     const t = parseInt(firstLine);

//     // Replace the results mapping:
//     const results = expectedLines.map((expected, idx) => ({
//       testCase: idx + 1,
//       passed: actualLines[idx] === expected,
//       input: `Test case ${idx + 1} of ${isNaN(t) ? "?" : t}`,
//       expected,
//       output: actualLines[idx] ?? "(no output)",
//       time: "N/A",
//       error: idx === 0 ? error : null,
//       hidden: idx >= 2,
//     }));

//     const allPassed = results.every((r) => r.passed);

//     return NextResponse.json({ success: true, allPassed, results });
//   } catch (error) {
//     console.error("Execution error:", error);
//     return NextResponse.json({ success: false, error: "Execution failed" }, { status: 500 });
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "app/lib/mongodb";
import { Problem } from "app/models/LeetcodeQuestion";

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: "node", version: "16.3.0" },
  python: { language: "python", version: "3.9.4" },
  cpp: { language: "gcc", version: "10.2.0" },
};

const PISTON_URL = process.env.PISTON_API_URL || "http://localhost:2000/api/v2/execute";

async function runOnPiston(code: string, language: string, stdin: string) {
  console.log(`[RUN ON PISTON] language=${language}, code ${code}`);
  const lang = LANGUAGE_MAP[language];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  console.log(
    `[PISTON REQUEST] language=${lang.language} version=${lang.version} stdin length=${stdin.length}`,
  );
  const response = await fetch(PISTON_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: lang.language,
      version: lang.version,
      files: [{ content: code }],
      stdin,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[PISTON ERROR] status=${response.status} body=${text}`);
    throw new Error(`Piston HTTP ${response.status}: ${text}`);
  }

  const json = await response.json();
  console.log(
    `[PISTON RESPONSE] stdout length=${json.run?.stdout?.length} stderr length=${json.run?.stderr?.length} code=${json.run?.code}`,
  );
  return json;
}

export async function POST(request: NextRequest) {
  console.log("========== [EXECUTE] Route called ==========");
  try {
    await connectDB();
    console.log("[EXECUTE] DB connected");

    const body = await request.json();
    const { code, language, problemId, example_type } = body;
    console.log(
      `[EXECUTE] Request: problemId=${problemId}, language=${language}, code length=${code?.length}, example_type=${example_type}`,
    );

    if (!code || !language || !problemId || !example_type) {
      console.log("[EXECUTE] Missing fields");
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const problem = await Problem.findOne({ id: problemId });
    if (!problem) {
      console.log(`[EXECUTE] Problem not found for id: ${problemId}`);
      return NextResponse.json({ success: false, error: "Problem not found" }, { status: 404 });
    }

    const examples = problem.examples || [];
    console.log(`[EXECUTE] Found problem: ${problem.title}, examples count: ${examples.length}`);

    if (examples.length === 0) {
      console.log("[EXECUTE] No examples/test cases");
      return NextResponse.json({ success: false, error: "No test cases" }, { status: 400 });
    }

    const results = [];
    for (let i = 0; i < examples.length; i++) {
      const ex = examples[i];
      const rawInput = (ex?.input ?? "").trim(); // <-- Declare rawInput first
      const expected = (ex?.output ?? "").trim(); // <-- Then expected

      // Now use rawInput to create the wrapped input
      const firstLine = rawInput.split("\n")[0]?.trim() ?? "";
      const looksLikeBatchHeader = /^\d+$/.test(firstLine) && rawInput.split("\n").length > 1;
      const input = looksLikeBatchHeader ? rawInput : `1\n${rawInput}`;
      console.log(`[TEST CASE ${i + 1}] input length=${input.length}, expected="${expected}"`);

      let output = "",
        error = null,
        time = "N/A",
        passed = false;
      try {
        const result = await runOnPiston(code, language, input);
        output = (result.run?.stdout ?? "").trim();
        const stderr = (result.run?.stderr ?? "").trim();
        const exitCode = result.run?.code;
        time = result.run?.wall_time ?? "N/A";

        if (exitCode !== 0 && exitCode !== undefined) {
          error = stderr || `Exit code: ${exitCode}`;
          passed = false;
        } else {
          passed = output === expected;
          if (stderr) {
            error = stderr;
          }
        }
        console.log(
          `[TEST CASE ${i + 1}] output="${output}", time=${time}, passed=${passed}, error=${error ? "yes" : "no"}`,
        );
      } catch (err: unknown) {
        error = err instanceof Error ? err.message : String(err);
        console.error(`[TEST CASE ${i + 1}] EXCEPTION: ${error}`);
      }

      results.push({
        testCase: i + 1,
        passed,
        input: rawInput.length > 200 ? rawInput.slice(0, 200) + "..." : rawInput, // rawInput is now defined
        expected,
        output: output || "(no output)",
        time,
        error,
        hidden: i >= 2,
      });
    }

    const allPassed = results.every((r) => r.passed);
    console.log(`[EXECUTE] All tests passed: ${allPassed}`);
    console.log(`[EXECUTE] Returning ${results.length} results`);

    return NextResponse.json({
      success: true,
      allPassed,
      results,
    });
  } catch (error: unknown) {
    console.error("[EXECUTE] Unhandled error:", error);
    const errorString = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorString }, { status: 500 });
  }
}
