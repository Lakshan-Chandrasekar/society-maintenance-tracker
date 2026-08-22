"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"RESIDENT" | "ADMIN">("RESIDENT");
  const [form, setForm] = useState({ name: "", email: "", password: "", flatNumber: "", inviteCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(role === "ADMIN" ? { "x-admin-invite": form.inviteCode } : {}),
        },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create your account.");
        return;
      }
      router.push(data.user.role === "ADMIN" ? "/admin/dashboard" : "/resident/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f6f2] px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 font-display text-sm font-semibold text-clay-200">
            M
          </div>
          <p className="font-display text-base font-semibold text-ink-900">Maple Residency</p>
        </Link>

        <div className="card p-7">
          <h1 className="font-display text-xl font-semibold text-ink-950">Create your account</h1>
          <p className="mt-1 text-sm text-ink-500">Set up access to the maintenance desk.</p>

          <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-lg bg-ink-100 p-1">
            {(["RESIDENT", "ADMIN"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                  role === r ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
                }`}
              >
                {r === "RESIDENT" ? "Resident" : "Admin"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {role === "RESIDENT" && (
              <div>
                <label className="label">Flat number</label>
                <input
                  className="input"
                  placeholder="e.g. B-402"
                  value={form.flatNumber}
                  onChange={(e) => setForm({ ...form, flatNumber: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {role === "ADMIN" && (
              <div>
                <label className="label">Admin invite code</label>
                <input
                  required
                  className="input"
                  placeholder="Provided by the society committee"
                  value={form.inviteCode}
                  onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
                />
              </div>
            )}

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-ink-500">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-clay-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
