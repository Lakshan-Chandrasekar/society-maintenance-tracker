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

export default function NoticeBoardClient() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notices")
      .then((r) => r.json())
      .then((d) => setNotices(d.notices || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink-950">Notice board</h1>
      <p className="mt-1 text-sm text-ink-500">Announcements from the society management committee.</p>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-ink-400">Loading notices…</p>
        ) : notices.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-500">No notices posted yet.</div>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className={`card p-5 ${n.important ? "border-clay-300 bg-clay-50/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-base font-semibold text-ink-900">{n.title}</h3>
                {n.important && (
                  <span className="tag shrink-0 bg-clay-500 text-white">
                    📌 Pinned
                  </span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{n.body}</p>
              <p className="mt-3 text-xs text-ink-400">
                {n.postedBy.name} · {formatDate(n.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
