import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isOverdue } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
    include: {
      resident: { select: { id: true, name: true, flatNumber: true, email: true } },
      history: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true, role: true } } } },
    },
  });

  if (!complaint) return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
  if (session.role === "RESIDENT" && complaint.residentId !== session.userId) {
    return NextResponse.json({ error: "You cannot view this complaint." }, { status: 403 });
  }

  return NextResponse.json({ complaint: { ...complaint, overdue: isOverdue(complaint.createdAt, complaint.status) } });
}
