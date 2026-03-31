"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VolumeData {
  date: string;
  count: number;
  completed: number;
}

interface VolumeChartProps {
  data: VolumeData[];
}

export default function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No interview data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(v) =>
            new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })
          }
        />
        <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          name="Total"
          stroke="#3ecf8e"
          fill="url(#colorTotal)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="completed"
          name="Completed"
          stroke="#8b5cf6"
          fill="url(#colorCompleted)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
