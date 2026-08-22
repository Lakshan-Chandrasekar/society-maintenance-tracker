import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can set priority." }, { status: 403 });
  }

  const { priority } = await req.json();
  if (!VALID_PRIORITIES.includes(priority)) {
    return NextResponse.json({ error: "Invalid priority value." }, { status: 400 });
  }

  const complaint = await prisma.complaint.update({
    where: { id: params.id },
    data: { priority },
  });

  return NextResponse.json({ complaint });
}
