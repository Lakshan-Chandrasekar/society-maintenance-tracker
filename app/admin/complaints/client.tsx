"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/Badges";
import { formatDate } from "@/lib/utils";

const CATEGORIES = ["Plumbing", "Electrical", "Housekeeping", "Security", "Lift", "Parking", "Common Area", "Other"];

type Complaint = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  overdue: boolean;
  createdAt: string;
  resident: { name: string; flatNumber: string | null };
};

export default function AdminComplaintsClient() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", category: "", from: "", to: "" });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v as string);
    });
    const res = await fetch(`/api/complaints?${params.toString()}`);
    const data = await res.json();
    setComplaints(data.complaints || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const overdueCount = complaints.filter((c) => c.overdue).length;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">All complaints</h1>
          <p className="mt-1 text-sm text-ink-500">
            {overdueCount > 0 ? (
              <span className="font-medium text-red-600">{overdueCount} overdue, shown first.</span>
            ) : (
              "Nothing overdue right now."
            )}
          </p>
        </div>
      </div>

      <div className="card mt-5 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Status</label>
          <select className="input !w-40" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input !w-40" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">From</label>
          <input type="date" className="input !w-40" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input !w-40" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        {(filters.status || filters.category || filters.from || filters.to) && (
          <button
            onClick={() => setFilters({ status: "", category: "", from: "", to: "" })}
            className="btn-secondary !py-2.5 text-xs"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl2 border border-ink-100 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Complaint</th>
              <th className="px-4 py-3">Resident</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Raised</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                  Loading…
                </td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                  No complaints match these filters.
                </td>
              </tr>
            ) : (
              complaints.map((c) => (
                <tr key={c.id} className={c.overdue ? "bg-red-50/50" : ""}>
                  <td className="px-4 py-3">
                    <Link href={`/resident/complaints/${c.id}`} className="font-medium text-ink-900 hover:underline">
                      {c.title}
                    </Link>
                    {c.overdue && (
                      <div className="mt-1">
                        <OverdueBadge />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {c.resident.name}
                    {c.resident.flatNumber ? ` (${c.resident.flatNumber})` : ""}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{c.category}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-400">{formatDate(c.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
