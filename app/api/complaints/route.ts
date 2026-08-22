import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isOverdue } from "@/lib/utils";

// GET: residents get their own complaints; admins get everything, with
// optional ?status= &category= &from= &to= filters.
export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (session.role === "RESIDENT") where.residentId = session.userId;
  if (status) where.status = status;
  if (category) where.category = category;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59`);
  }

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    include: {
      resident: { select: { name: true, flatNumber: true, email: true } },
      _count: { select: { history: true } },
    },
  });

  const withOverdue = complaints.map((c) => ({ ...c, overdue: isOverdue(c.createdAt, c.status) }));

  // Overdue-first ordering for the admin view, as required by the brief.
  if (session.role === "ADMIN") {
    withOverdue.sort((a, b) => Number(b.overdue) - Number(a.overdue) || +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  return NextResponse.json({ complaints: withOverdue });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (session.role !== "RESIDENT") {
    return NextResponse.json({ error: "Only residents can raise complaints." }, { status: 403 });
  }

  try {
    const { title, category, description, photoUrl } = await req.json();
    if (!title || !category || !description) {
      return NextResponse.json({ error: "Title, category and description are required." }, { status: 400 });
    }
    if (photoUrl && photoUrl.length > 6_000_000) {
      return NextResponse.json({ error: "Photo is too large. Please use an image under ~4MB." }, { status: 413 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        title,
        category,
        description,
        photoUrl: photoUrl || null,
        residentId: session.userId,
        history: {
          create: {
            status: "OPEN",
            note: "Complaint raised by resident.",
            actorId: session.userId,
          },
        },
      },
      include: { history: true },
    });

    return NextResponse.json({ complaint });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create the complaint. Please try again." }, { status: 500 });
  }
}
