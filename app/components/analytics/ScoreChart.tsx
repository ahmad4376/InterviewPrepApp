"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ScoreData {
  date: string;
  overall: number;
  correctness: number;
  depth: number;
  communication: number;
  count: number;
}

interface ScoreChartProps {
  data: ScoreData[];
}

export default function ScoreChart({ data }: ScoreChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No completed interviews yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(v) =>
            new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })
          }
        />
        <YAxis stroke="#6b7280" fontSize={12} domain={[0, 5]} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
        <Bar dataKey="correctness" name="Correctness" fill="#3ecf8e" radius={[2, 2, 0, 0]} />
        <Bar dataKey="depth" name="Depth" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
        <Bar dataKey="communication" name="Communication" fill="#f59e0b" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
