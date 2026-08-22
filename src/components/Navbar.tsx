"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar({
  name,
  role,
}: {
  name: string;
  role: "RESIDENT" | "ADMIN";
}) {
  const pathname = usePathname();
  const router = useRouter();

  const links =
    role === "ADMIN"
      ? [
          { href: "/admin/dashboard", label: "Dashboard" },
          { href: "/admin/complaints", label: "Complaints" },
          { href: "/admin/notices", label: "Notice Board" },
        ]
      : [
          { href: "/resident/dashboard", label: "My Complaints" },
          { href: "/notices", label: "Notice Board" },
        ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-[#f8f6f2]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href={role === "ADMIN" ? "/admin/dashboard" : "/resident/dashboard"} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 font-display text-sm font-semibold text-clay-200">
            M
          </div>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold text-ink-900">Maple Residency</p>
            <p className="-mt-0.5 text-[11px] tracking-wide text-ink-400">Maintenance Desk</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === l.href ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink-800">{name}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink-400">{role === "ADMIN" ? "Administrator" : "Resident"}</p>
          </div>
          <button onClick={logout} className="btn-secondary !px-3 !py-2 text-xs">
            Sign out
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-ink-100 px-5 py-2 sm:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
              pathname === l.href ? "bg-ink-900 text-white" : "text-ink-600"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
