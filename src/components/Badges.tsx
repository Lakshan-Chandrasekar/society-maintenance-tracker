import { classNames } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN: "bg-clay-100 text-clay-700",
    IN_PROGRESS: "bg-amber-100 text-amber-800",
    RESOLVED: "bg-sage-100 text-sage-700",
  };
  const label: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
  };
  return <span className={classNames("tag", map[status] || "bg-ink-100 text-ink-600")}>{label[status] || status}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    LOW: "bg-ink-100 text-ink-600",
    MEDIUM: "bg-amber-100 text-amber-800",
    HIGH: "bg-red-100 text-red-700",
  };
  const dot: Record<string, string> = {
    LOW: "bg-ink-400",
    MEDIUM: "bg-amber-500",
    HIGH: "bg-red-500",
  };
  return (
    <span className={classNames("tag", map[priority] || "bg-ink-100 text-ink-600")}>
      <span className={classNames("h-1.5 w-1.5 rounded-full", dot[priority])} />
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="tag animate-pulse bg-red-600 text-white">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      Overdue
    </span>
  );
}
