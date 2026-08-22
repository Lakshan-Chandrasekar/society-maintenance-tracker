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
  description: string;
  status: string;
  priority: string;
  overdue: boolean;
  createdAt: string;
  photoUrl: string | null;
};

export default function ResidentDashboardClient() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/complaints");
    const data = await res.json();
    setComplaints(data.complaints || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const openCount = complaints.filter((c) => c.status !== "RESOLVED").length;

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">Your complaints</h1>
          <p className="mt-1 text-sm text-ink-500">
            {openCount > 0 ? `${openCount} still open or in progress.` : "Nothing pending right now."}
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? "Close" : "＋ Raise a complaint"}
        </button>
      </div>

      {showForm && (
        <div className="mt-6">
          <ComplaintForm
            onCreated={() => {
              setShowForm(false);
              load();
            }}
          />
        </div>
      )}

      <div className="mt-8 space-y-3">
        {loading ? (
          <SkeletonList />
        ) : complaints.length === 0 ? (
          <EmptyState />
        ) : (
          complaints.map((c) => (
            <Link
              key={c.id}
              href={`/resident/complaints/${c.id}`}
              className="card flex items-start gap-4 p-4 transition-shadow hover:shadow-soft"
            >
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-400">
                  <CategoryIcon category={c.category} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-ink-900">{c.title}</h3>
                  {c.overdue && <OverdueBadge />}
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-ink-500">{c.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="tag bg-ink-100 text-ink-600">{c.category}</span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                  <span className="text-xs text-ink-400">{formatDate(c.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}

function ComplaintForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Please choose an image under 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, description, photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit the complaint.");
        return;
      }
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label className="label">Title</label>
        <input required className="input" placeholder="e.g. Leaking pipe in kitchen" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Photo (optional)</label>
          <input type="file" accept="image/*" onChange={handlePhoto} className="input !py-1.5 file:mr-3 file:rounded-md file:border-0 file:bg-ink-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white" />
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          required
          rows={4}
          className="input resize-none"
          placeholder="Describe the issue in a few lines…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="Preview" className="h-28 w-28 rounded-lg border border-ink-200 object-cover" />
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Submitting…" : "Submit complaint"}
      </button>
    </form>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center gap-2 p-12 text-center">
      <div className="mb-2 h-12 w-12 rounded-full bg-sage-100" />
      <p className="font-medium text-ink-800">No complaints yet</p>
      <p className="text-sm text-ink-500">When something needs fixing, raise it here and track it through to resolution.</p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card flex gap-4 p-4">
          <div className="h-16 w-16 animate-pulse rounded-lg bg-ink-100" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-1/3 animate-pulse rounded bg-ink-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-ink-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 12h8M12 8v8" opacity={category === "Other" ? 0.4 : 1} />
    </svg>
  );
}
