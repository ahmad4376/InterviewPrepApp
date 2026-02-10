/**
 * Seed script — imports question bank from combined_2.json into MongoDB.
 * Assigns difficulty_score heuristically based on tags.
 *
 * Usage: npx tsx scripts/seed-questions.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import mongoose from "mongoose";

// Load .env.local manually since we're outside Next.js
// Read and parse .env.local ourselves to avoid dotenv dependency
function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      // Remove surrounding quotes
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // file not found is ok
  }
}

loadEnvFile(join(process.cwd(), ".env.local"));

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  console.error("MONGO_URL not found in .env.local");
  process.exit(1);
}

// Difficulty heuristic based on tags
const EASY_TAGS = new Set([
  "basics",
  "introduction",
  "variables",
  "data-types",
  "strings",
  "numbers",
  "booleans",
  "comments",
  "syntax",
]);

const MEDIUM_EASY_TAGS = new Set([
  "functions",
  "arrays",
  "objects",
  "loops",
  "control-flow",
  "operators",
  "comparison",
  "equality",
  "properties",
  "methods",
  "conditionals",
]);

const MEDIUM_TAGS = new Set([
  "scope",
  "hoisting",
  "this",
  "closures",
  "prototypes",
  "dom",
  "events",
  "callbacks",
  "error-handling",
  "json",
  "iife",
  "es6",
  "destructuring",
  "spread",
  "template-literals",
]);

const HARD_TAGS = new Set([
  "async",
  "promises",
  "generators",
  "iterators",
  "proxy",
  "reflect",
  "symbols",
  "weakmap",
  "weakset",
  "modules",
  "performance",
  "memory",
  "optimization",
  "patterns",
  "design-patterns",
]);

const VERY_HARD_TAGS = new Set([
  "engine",
  "v8",
  "event-loop",
  "concurrency",
  "worker",
  "service-worker",
  "webassembly",
  "security",
  "architecture",
  "advanced",
]);

function assignDifficulty(tags: string[]): number {
  const lowerTags = tags.map((t) => t.toLowerCase());

  let score = 3; // default to medium

  for (const tag of lowerTags) {
    if (EASY_TAGS.has(tag)) score = Math.min(score, 1);
    else if (MEDIUM_EASY_TAGS.has(tag)) score = Math.min(score, 2);
    else if (MEDIUM_TAGS.has(tag)) score = Math.max(score, 3);
    else if (HARD_TAGS.has(tag)) score = Math.max(score, 4);
    else if (VERY_HARD_TAGS.has(tag)) score = Math.max(score, 5);
  }

  // Use answer length as secondary signal
  return score;
}

interface RawQuestion {
  question_id: string;
  question_title: string;
  question_text: string;
  answer_text: string;
  tags: string[];
  rank_value?: number;
  difficulty_score?: number;
}

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URL!);
  console.log("Connected.");

  const dataPath = join(__dirname, "data", "combined_2.json");
  const raw: RawQuestion[] = JSON.parse(readFileSync(dataPath, "utf-8"));
  console.log(`Loaded ${raw.length} questions from combined_2.json`);

  const collection = mongoose.connection.collection("questions");

  let upserted = 0;
  let updated = 0;

  for (const q of raw) {
    const difficulty = q.difficulty_score ?? assignDifficulty(q.tags || []);

    const result = await collection.updateOne(
      { question_id: q.question_id },
      {
        $set: {
          question_id: q.question_id,
          question_title: q.question_title || "",
          question_text: q.question_text,
          answer_text: q.answer_text,
          tags: q.tags || [],
          rank_value: q.rank_value ?? 0,
          difficulty_score: difficulty,
        },
      },
      { upsert: true },
    );

    if (result.upsertedCount) upserted++;
    else if (result.modifiedCount) updated++;
  }

  console.log(`Done. Upserted: ${upserted}, Updated: ${updated}`);

  // Log difficulty distribution
  const pipeline = [
    { $group: { _id: "$difficulty_score", count: { $sum: 1 } } },
    { $sort: { _id: 1 as const } },
  ];
  const dist = await collection.aggregate(pipeline).toArray();
  console.log("Difficulty distribution:", dist.map((d) => `${d._id}: ${d.count}`).join(", "));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
