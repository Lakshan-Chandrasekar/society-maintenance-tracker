import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendMail, statusChangeEmail } from "@/lib/mailer";

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can update complaint status." }, { status: 403 });
  }

  const { status, note } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
    include: { resident: true },
  });
  if (!complaint) return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
  if (complaint.status === "RESOLVED") {
    return NextResponse.json({ error: "This complaint is already resolved and closed." }, { status: 400 });
  }

  const updated = await prisma.complaint.update({
    where: { id: params.id },
    data: {
      status,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
      history: {
        create: { status, note: note || null, actorId: session.userId },
      },
    },
    include: { history: { orderBy: { createdAt: "asc" } }, resident: true },
  });

  // Best-effort notification; a mail failure should never block the status change.
  sendMail(
    complaint.resident.email,
    `Update on your complaint: ${complaint.title}`,
    statusChangeEmail(complaint.resident.name, complaint.title, status, note)
  ).catch(() => {});

  return NextResponse.json({ complaint: updated });
}
