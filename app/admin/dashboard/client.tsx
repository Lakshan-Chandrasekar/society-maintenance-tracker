"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import StatCard from "@/components/StatCard";

type DashboardData = {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  overdueCount: number;
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#c96a2c",
  IN_PROGRESS: "#d97706",
  RESOLVED: "#458560",
};

export default function AdminDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <main className="mx-auto max-w-5xl px-5 py-10 text-sm text-ink-500">Loading dashboard…</main>;
  }

  const statusData: { name: string; value: number }[] = Object.entries(data.byStatus).map(([name, value]) => ({
    name,
    value: value as number,
  }));
  const categoryData: { name: string; value: number }[] = Object.entries(data.byCategory)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink-950">Overview</h1>
      <p className="mt-1 text-sm text-ink-500">A snapshot of every complaint raised across the society.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total complaints" value={data.total} accent="ink" icon={<GridIcon />} />
        <StatCard label="Open" value={data.byStatus.OPEN || 0} accent="clay" icon={<DotIcon />} />
        <StatCard label="In progress" value={data.byStatus.IN_PROGRESS || 0} accent="sage" icon={<ClockIcon />} />
        <StatCard label="Overdue" value={data.overdueCount} accent="red" icon={<AlertIcon />} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="card p-6 lg:col-span-3">
          <h2 className="font-display text-base font-semibold text-ink-900">Complaints by category</h2>
          <p className="text-xs text-ink-400">Which issues show up most often.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e6eaef" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#74849c" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: "#404c66" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f4f6f8" }} contentStyle={{ borderRadius: 10, border: "1px solid #e6eaef", fontSize: 13 }} />
                <Bar dataKey="value" fill="#c96a2c" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-ink-900">Status split</h2>
          <p className="text-xs text-ink-400">Open vs in progress vs resolved.</p>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {statusData.map((s) => (
                    <Cell key={s.name} fill={STATUS_COLORS[s.name] || "#a1aec0"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e6eaef", fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-ink-600">
            {statusData.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.name] }} />
                {s.name.replace("_", " ")} ({s.value})
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function DotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}
