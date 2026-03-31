"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PipelineData {
  scheduled: number;
  "in-progress": number;
  completed: number;
}

interface PipelineChartProps {
  data: PipelineData;
}

const STATUS_CONFIG = [
  { key: "scheduled", label: "Scheduled", color: "#6b7280" },
  { key: "in-progress", label: "In Progress", color: "#f59e0b" },
  { key: "completed", label: "Completed", color: "#3ecf8e" },
] as const;

export default function PipelineChart({ data }: PipelineChartProps) {
  const chartData = STATUS_CONFIG.map((s) => ({
    name: s.label,
    value: data[s.key],
    color: s.color,
  })).filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No interview data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#111",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
