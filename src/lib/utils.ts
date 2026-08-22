export const OVERDUE_THRESHOLD_DAYS = Number(process.env.OVERDUE_THRESHOLD_DAYS || 5);

export function isOverdue(createdAt: Date | string, status: string, thresholdDays = OVERDUE_THRESHOLD_DAYS) {
  if (status === "RESOLVED") return false;
  const created = new Date(createdAt).getTime();
  const ageDays = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return ageDays > thresholdDays;
}

export function daysOpen(createdAt: Date | string) {
  const created = new Date(createdAt).getTime();
  return Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
}

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}
