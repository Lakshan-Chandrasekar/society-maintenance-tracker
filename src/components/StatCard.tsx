export default function StatCard({
  label,
  value,
  accent = "ink",
  icon,
}: {
  label: string;
  value: number | string;
  accent?: "ink" | "clay" | "sage" | "red";
  icon?: React.ReactNode;
}) {
  const accents: Record<string, string> = {
    ink: "bg-ink-900 text-white",
    clay: "bg-clay-500 text-white",
    sage: "bg-sage-600 text-white",
    red: "bg-red-600 text-white",
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accents[accent]}`}>{icon}</div>
      <div>
        <p className="font-display text-2xl font-semibold leading-none text-ink-900">{value}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      </div>
    </div>
  );
}
