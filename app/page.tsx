import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function Home() {
  const session = getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin/dashboard" : "/resident/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-clay-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-sage-200/40 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 font-display text-sm font-semibold text-clay-200">
              M
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold text-ink-900">Maple Residency</p>
              <p className="-mt-0.5 text-[11px] tracking-wide text-ink-400">Maintenance Desk</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary">Sign in</Link>
            <Link href="/register" className="btn-primary">Get started</Link>
          </div>
        </header>

        <section className="mx-auto mt-16 max-w-3xl text-center sm:mt-24">
          <span className="tag mx-auto mb-6 bg-white text-ink-600 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-500" /> Built for apartment societies
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.15] text-ink-950 sm:text-5xl">
            Complaints that don&apos;t
            <span className="italic text-clay-600"> disappear </span>
            into a WhatsApp group.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-600">
            Residents raise issues with a photo and get status updates by email. Admins see what&apos;s overdue,
            what&apos;s piling up by category, and clear it — with a full history for every complaint.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-primary !px-6 !py-3 text-[15px]">
              Raise your first complaint
            </Link>
            <Link href="/login" className="btn-secondary !px-6 !py-3 text-[15px]">
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            {
              title: "Raise & track",
              body: "Log a complaint with a category, description and photo. Watch its status move from Open to Resolved.",
              accent: "bg-clay-500",
            },
            {
              title: "Priority & overdue flags",
              body: "Admins triage by priority, and anything sitting open too long surfaces automatically at the top.",
              accent: "bg-ink-800",
            },
            {
              title: "Notice board & email",
              body: "Important announcements get pinned, and residents are emailed the moment something changes.",
              accent: "bg-sage-600",
            },
          ].map((f) => (
            <div key={f.title} className="card p-6 text-left">
              <div className={`mb-4 h-9 w-9 rounded-lg ${f.accent}`} />
              <h3 className="font-display text-lg font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.body}</p>
            </div>
          ))}
        </section>

        <footer className="mt-24 border-t border-ink-100 py-8 text-center text-xs text-ink-400">
          Maple Residency Maintenance Desk — built as a society management demo.
        </footer>
      </div>
    </main>
  );
}
