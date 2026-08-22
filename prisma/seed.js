/* Seeds a demo admin, a demo resident, and a couple of sample complaints/notices.
   Run with: npm run seed   (after DATABASE_URL is set and `npx prisma db push` has run) */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@maple.test" },
    update: {},
    create: {
      name: "Priya Menon",
      email: "admin@maple.test",
      passwordHash,
      role: "ADMIN",
    },
  });

  const resident = await prisma.user.upsert({
    where: { email: "resident@maple.test" },
    update: {},
    create: {
      name: "Arjun Rao",
      email: "resident@maple.test",
      passwordHash,
      role: "RESIDENT",
      flatNumber: "B-402",
    },
  });

  const existing = await prisma.complaint.findFirst({ where: { residentId: resident.id } });
  if (!existing) {
    await prisma.complaint.create({
      data: {
        title: "Leaking pipe under kitchen sink",
        category: "Plumbing",
        description: "There has been a slow leak for two days, water is pooling under the cabinet.",
        residentId: resident.id,
        priority: "HIGH",
        history: { create: { status: "OPEN", note: "Complaint raised by resident.", actorId: resident.id } },
      },
    });

    await prisma.notice.create({
      data: {
        title: "Water supply maintenance this Sunday",
        body: "Water will be shut off from 10am to 1pm for tank cleaning. Please store water in advance.",
        important: true,
        postedById: admin.id,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Admin login:    admin@maple.test / password123");
  console.log("Resident login: resident@maple.test / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
