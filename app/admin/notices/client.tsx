"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

type Notice = {
  id: string;
  title: string;
  body: string;
  important: boolean;
  createdAt: string;
  postedBy: { name: string };
};

export default function AdminNoticesClient() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [important, setImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/notices");
    const data = await res.json();
    setNotices(data.notices || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, important }),
      });
      setTitle("");
      setBody("");
      setImportant(false);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink-950">Notice board</h1>
      <p className="mt-1 text-sm text-ink-500">Post updates for all residents. Important notices are pinned and emailed out.</p>

      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="label">Title</label>
          <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Water supply maintenance on Sunday" />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea required rows={3} className="input resize-none" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} className="h-4 w-4 rounded border-ink-300" />
          Mark as important (pins it and emails every resident)
        </label>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Posting…" : "Post notice"}
        </button>
      </form>

      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-sm text-ink-400">Loading…</p>
        ) : (
          notices.map((n) => (
            <div key={n.id} className={`card p-5 ${n.important ? "border-clay-300 bg-clay-50/60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-base font-semibold text-ink-900">{n.title}</h3>
                {n.important && <span className="tag shrink-0 bg-clay-500 text-white">📌 Pinned</span>}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{n.body}</p>
              <p className="mt-3 text-xs text-ink-400">{formatDate(n.createdAt)}</p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
