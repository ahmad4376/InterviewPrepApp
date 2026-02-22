// app/(dashboard)/coding-interview/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  GripVertical,
  Timer,
  Cpu,
} from "lucide-react";

interface TestResult {
  passed: boolean;
  input: string;
  output: string;
  expected: string;
  time: string;
}

interface Problem {
  id: string;
  title: string;
  tags: string[];
  difficulty_bucket: string;
  time_limit?: string | null;
  memory_limit?: string | null;
  stmt_body: string;
}

export default function CodingInterviewPage() {
  const [language, setLanguage] = useState<"python" | "cpp" | "javascript">("javascript");
  const [code, setCode] = useState(`function twoSum(nums, target) {
    // Write your solution here
    
}`);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "solution" | "submissions">(
    "description",
  );
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [leftWidth, setLeftWidth] = useState(40); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [problemsLoading, setProblemsLoading] = useState(true);

  // Update code template when language changes
  useEffect(() => {
    switch (language) {
      case "python":
        setCode(`def twoSum(nums, target):
    # Write your solution here
    pass`);
        break;
      case "cpp":
        setCode(`#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        
    }
};`);
        break;
      case "javascript":
      default:
        setCode(`function twoSum(nums, target) {
    // Write your solution here
    
}`);
        break;
    }
  }, [language]);

  useEffect(() => {
    async function fetchProblems() {
      try {
        const [easyRes, mediumRes] = await Promise.all([
          fetch("/api/leetcode?difficulty=easy"),
          fetch("/api/leetcode?difficulty=medium"),
        ]);
        const easyData = await easyRes.json();
        const mediumData = await mediumRes.json();

        const easyPool: Problem[] = easyData.data ?? [];
        const mediumPool: Problem[] = mediumData.data ?? [];

        // Pick 2 random easy, 1 random medium
        const shuffled = (arr: Problem[]) => arr.sort(() => Math.random() - 0.5);
        const selected = [...shuffled(easyPool).slice(0, 2), ...shuffled(mediumPool).slice(0, 1)];

        setProblems(selected);
      } catch (e) {
        console.error("Failed to fetch problems", e);
      } finally {
        setProblemsLoading(false);
      }
    }
    fetchProblems();
  }, []);

  const currentProblem = problems[currentProblemIndex];

  const problem = currentProblem
    ? {
        id: currentProblem.id,
        title: currentProblem.title,
        difficulty: currentProblem.difficulty_bucket,
        recommendedTime: currentProblem.time_limit ?? "N/A",
        timeComplexity: "N/A",
        spaceComplexity: "N/A",
        description: currentProblem.stmt_body,
        examples: [
          {
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
          },
          {
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]",
            explanation: "nums[1] + nums[2] == 6, we return [1, 2].",
          },
        ],
        constraints: currentProblem.tags.map((tag) => `Topic: ${tag}`),
      }
    : null;

  // Handle drag to resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Limit between 20% and 80%
      const clampedWidth = Math.min(Math.max(newLeftWidth, 20), 80);
      setLeftWidth(clampedWidth);
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleRun = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Simulate test execution
    setTimeout(() => {
      setTestResults([
        {
          passed: true,
          input: problem ? problem.examples[0]!.input : "",
          output: "[0,1]",
          expected: "[0,1]",
          time: "48ms",
        },
        {
          passed: true,
          input: problem ? problem.examples[1]!.input : "",
          output: "[1,2]",
          expected: "[1,2]",
          time: "52ms",
        },
        {
          passed: true,
          input: problem ? problem.examples[2]!.input : "",
          output: "[0,1]",
          expected: "[0,1]",
          time: "44ms",
        },
        {
          passed: false,
          input: "nums = [1,2,3,4], target = 7",
          output: "[2,3]",
          expected: "[2,3]",
          time: "51ms",
        },
      ]);
      setIsRunning(false);
    }, 1500);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "hard":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (problemsLoading) {
    return (
      <div className="h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3ecf8e]" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-screen bg-[#0b0b0b] flex items-center justify-center text-gray-400">
        No problems found. Please populate the database first.
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0b0b0b] text-gray-200 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="border-b border-gray-800 bg-[#0f0f0f] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-white">{problem.title}</h1>
          <span className={`text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500">
            {currentProblemIndex + 1} / {problems.length}
          </span>
          {currentProblemIndex < problems.length - 1 && (
            <button
              onClick={() => setCurrentProblemIndex((i) => i + 1)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-md border border-gray-700 text-sm transition"
            >
              Next Question →
            </button>
          )}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "python" | "cpp" | "javascript")}
            className="bg-gray-800 text-gray-200 px-3 py-1.5 rounded-md border border-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
        </div>
      </div>

      {/* Main Content - Resizable Split View */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - Problem Description */}
        <div className="overflow-y-auto bg-[#0f0f0f]" style={{ width: `${leftWidth}%` }}>
          {/* Tabs */}
          <div className="flex border-b border-gray-800 sticky top-0 bg-[#0f0f0f] z-10">
            <button
              onClick={() => setActiveTab("description")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "description"
                  ? "text-[#3ecf8e] border-b-2 border-[#3ecf8e]"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("solution")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "solution"
                  ? "text-[#3ecf8e] border-b-2 border-[#3ecf8e]"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Solution
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "submissions"
                  ? "text-[#3ecf8e] border-b-2 border-[#3ecf8e]"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Submissions
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "description" && (
              <div className="space-y-6">
                {/* Recommended Time & Complexity Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-2 text-[#3ecf8e] mb-2">
                      <Timer className="w-4 h-4" />
                      <span className="text-sm font-medium">Time Limit</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{problem.recommendedTime}</div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-2 text-[#3ecf8e] mb-2">
                      <Cpu className="w-4 h-4" />
                      <span className="text-sm font-medium">Memory Limit</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {currentProblem?.memory_limit ?? "N/A"}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {currentProblem?.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-800 border border-gray-700 px-2.5 py-0.5 text-xs text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Problem Statement */}
                <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {problem.description}
                </div>

                {/* Static Examples */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium">Examples:</h3>
                  {problem.examples.map((example, idx) => (
                    <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="mb-2">
                        <span className="text-gray-400 text-sm">Input: </span>
                        <code className="text-[#3ecf8e] text-sm">{example.input}</code>
                      </div>
                      <div className="mb-2">
                        <span className="text-gray-400 text-sm">Output: </span>
                        <code className="text-white text-sm">{example.output}</code>
                      </div>
                      {example.explanation && (
                        <div>
                          <span className="text-gray-400 text-sm">Explanation: </span>
                          <span className="text-gray-300 text-sm">{example.explanation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "solution" && (
              <div className="text-gray-400 text-center py-12">
                <p>Official solution will appear here after you submit.</p>
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="text-gray-400 text-center py-12">
                <p>Your submissions will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Draggable Divider */}
        <div
          className={`w-1 hover:w-1.5 bg-gray-700 hover:bg-[#3ecf8e] cursor-col-resize transition-all duration-150 relative group ${
            isDragging ? "bg-[#3ecf8e] w-1.5" : ""
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:text-white">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>

        {/* Right Panel - Code Editor & Results */}
        <div className="flex flex-col bg-[#0b0b0b]" style={{ width: `${100 - leftWidth}%` }}>
          {/* Editor Toolbar */}
          <div className="bg-[#0f0f0f] border-b border-gray-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Code</span>
            </div>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="bg-[#3ecf8e] hover:bg-[#36be81] text-black px-4 py-1.5 rounded-md text-sm font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Editor */}
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                fontFamily: "JetBrains Mono, Fira Code, monospace",
                fontLigatures: true,
              }}
            />
          </div>

          {/* Test Results Panel */}
          {(testResults.length > 0 || isRunning) && (
            <div className="h-64 border-t border-gray-800 bg-[#0f0f0f] overflow-y-auto">
              <div className="px-4 py-2 border-b border-gray-800">
                <h3 className="text-sm font-medium text-white">Test Results</h3>
              </div>
              <div className="p-4">
                {isRunning ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-[#3ecf8e]" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-sm text-gray-400">
                        Passed: {testResults.filter((r) => r.passed).length}/{testResults.length}
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-400">
                        Runtime: {testResults[0]?.time || "N/A"}
                      </span>
                    </div>
                    {testResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          result.passed
                            ? "border-green-500/20 bg-green-500/5"
                            : "border-red-500/20 bg-red-500/5"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {result.passed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-300">
                                Test Case {idx + 1}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Input: {result.input}
                              </div>
                              <div className="text-xs mt-1">
                                <span className="text-gray-400">Expected: </span>
                                <span className="text-gray-300">{result.expected}</span>
                              </div>
                              <div className="text-xs">
                                <span className="text-gray-400">Output: </span>
                                <span className={result.passed ? "text-green-400" : "text-red-400"}>
                                  {result.output}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {result.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
