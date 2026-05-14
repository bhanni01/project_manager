import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const pmPassword = "pm123";
  const engPassword = "eng123";

  const pm = await prisma.user.upsert({
    where: { email: "pm@example.com" },
    update: {},
    create: {
      email: "pm@example.com",
      name: "PM Demo",
      role: "PROJECT_MANAGER",
      passwordHash: await bcrypt.hash(pmPassword, 10),
    },
  });

  const eng = await prisma.user.upsert({
    where: { email: "eng@example.com" },
    update: {},
    create: {
      email: "eng@example.com",
      name: "Engineer Demo",
      role: "ENGINEER",
      passwordHash: await bcrypt.hash(engPassword, 10),
    },
  });

  await prisma.fiscalYear.upsert({
    where: { label: "2082/83" },
    update: {},
    create: {
      label: "2082/83",
      startDate: new Date("2025-07-16"),
      endDate: new Date("2026-07-15"),
      isCurrent: true,
    },
  });

  // Audit USER_CREATE for each seeded user (idempotent: skipped on re-seed because
  // upsert returns existing user without re-running create). We log only when the
  // event hasn't been logged yet — keyed by (action, targetId).
  for (const u of [pm, eng]) {
    const existing = await prisma.auditEvent.findFirst({
      where: { action: "USER_CREATE", targetId: u.id },
    });
    if (!existing) {
      await prisma.auditEvent.create({
        data: {
          action: "USER_CREATE",
          actorUserId: null,
          targetType: "User",
          targetId: u.id,
          afterJson: { email: u.email, name: u.name, role: u.role },
        },
      });
    }
  }

  console.log("\nSeed complete.");
  console.log("  PM        →  pm@example.com  /  " + pmPassword);
  console.log("  Engineer  →  eng@example.com /  " + engPassword);
  console.log("  Current FY → 2082/83\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
