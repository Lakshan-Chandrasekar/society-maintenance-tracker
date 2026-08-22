import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendMail, importantNoticeEmail } from "@/lib/mailer";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const notices = await prisma.notice.findMany({
    orderBy: [{ important: "desc" }, { createdAt: "desc" }],
    include: { postedBy: { select: { name: true } } },
  });

  return NextResponse.json({ notices });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can post notices." }, { status: 403 });
  }

  const { title, body, important } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
  }

  const notice = await prisma.notice.create({
    data: { title, body, important: Boolean(important), postedById: session.userId },
  });

  if (notice.important) {
    const residents = await prisma.user.findMany({ where: { role: "RESIDENT" }, select: { name: true, email: true } });
    // Fire-and-forget so posting the notice doesn't wait on every resident's email.
    Promise.allSettled(
      residents.map((r) => sendMail(r.email, `📌 Important notice: ${title}`, importantNoticeEmail(r.name, title, body)))
    ).catch(() => {});
  }

  return NextResponse.json({ notice });
}
