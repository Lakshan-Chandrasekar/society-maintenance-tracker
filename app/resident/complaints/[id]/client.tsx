"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/Badges";
import { formatDate } from "@/lib/utils";

type HistoryEntry = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  actor: { name: string; role: string };
};

type ComplaintDetail = {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  overdue: boolean;
  createdAt: string;
  photoUrl: string | null;
  resident: { name: string; flatNumber: string | null; email: string };
  history: HistoryEntry[];
};

const NEXT_STATUS: Record<string, string[]> = {
  OPEN: ["IN_PROGRESS", "RESOLVED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: [],
};

export default function ComplaintDetailClient({ id, isAdmin }: { id: string; isAdmin: boolean }) {
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/complaints/${id}`);
    const data = await res.json();
    if (res.ok) setComplaint(data.complaint);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update status.");
        return;
      }
      setNote("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function updatePriority(priority: string) {
    setBusy(true);
    try {
      await fetch(`/api/complaints/${id}/priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl px-5 py-10 text-sm text-ink-500">Loading…</main>;
  }
  if (!complaint) {
    return <main className="mx-auto max-w-3xl px-5 py-10 text-sm text-ink-500">Complaint not found.</main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href={isAdmin ? "/admin/complaints" : "/resident/dashboard"}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"
      >
        ← Back
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-950">{complaint.title}</h1>
            <p className="mt-1 text-sm text-ink-500">
              {complaint.resident.name}
              {complaint.resident.flatNumber ? ` · Flat ${complaint.resident.flatNumber}` : ""} · {formatDate(complaint.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {complaint.overdue && <OverdueBadge />}
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{complaint.description}</p>
        <span className="tag mt-3 inline-flex bg-ink-100 text-ink-600">{complaint.category}</span>

        {complaint.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={complaint.photoUrl} alt="Complaint" className="mt-4 max-h-96 w-full rounded-lg border border-ink-200 object-cover" />
        )}
      </div>

      {isAdmin && complaint.status !== "RESOLVED" && (
        <div className="card mt-5 p-6">
          <h2 className="font-display text-base font-semibold text-ink-900">Admin actions</h2>

          <div className="mt-3">
            <label className="label">Priority</label>
            <div className="flex gap-2">
              {["LOW", "MEDIUM", "HIGH"].map((p) => (
                <button
                  key={p}
                  disabled={busy}
                  onClick={() => updatePriority(p)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    complaint.priority === p ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 text-ink-600 hover:border-ink-400"
                  }`}
                >
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="label">Note (optional)</label>
            <textarea
              rows={2}
              className="input resize-none"
              placeholder="Add context for the resident…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-4 flex gap-2">
            {NEXT_STATUS[complaint.status].map((s) => (
              <button key={s} disabled={busy} onClick={() => updateStatus(s)} className="btn-primary">
                Mark {s === "IN_PROGRESS" ? "In Progress" : "Resolved"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-5 p-6">
        <h2 className="font-display text-base font-semibold text-ink-900">History</h2>
        <ol className="mt-4 space-y-5 border-l border-ink-200 pl-5">
          {complaint.history.map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white bg-clay-500 shadow" />
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={h.status} />
                <span className="text-xs text-ink-400">{formatDate(h.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-600">
                {h.actor.name} {h.actor.role === "ADMIN" ? "(admin)" : ""}
                {h.note ? ` — ${h.note}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
