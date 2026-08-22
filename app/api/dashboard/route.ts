import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isOverdue } from "@/lib/utils";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const complaints = await prisma.complaint.findMany({
    select: { status: true, category: true, createdAt: true, priority: true },
  });

  const byStatus: Record<string, number> = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  let overdueCount = 0;

  for (const c of complaints) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
    if (isOverdue(c.createdAt, c.status)) overdueCount += 1;
  }

  return NextResponse.json({
    total: complaints.length,
    byStatus,
    byCategory,
    byPriority,
    overdueCount,
  });
}
