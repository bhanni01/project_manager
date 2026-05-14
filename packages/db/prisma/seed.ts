import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const pmPassword = "pm123";
  const engPassword = "eng123";
  const eng2Password = "eng2123";

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

  const eng2 = await prisma.user.upsert({
    where: { email: "eng2@example.com" },
    update: {},
    create: {
      email: "eng2@example.com",
      name: "Engineer Two",
      role: "ENGINEER",
      passwordHash: await bcrypt.hash(eng2Password, 10),
    },
  });

  const fy = await prisma.fiscalYear.upsert({
    where: { label: "2082/83" },
    update: {},
    create: {
      label: "2082/83",
      startDate: new Date("2025-07-16"),
      endDate: new Date("2026-07-15"),
      isCurrent: true,
    },
  });

  for (const u of [pm, eng, eng2]) {
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

  // Sample projects owned by Engineer Demo. Idempotent by projectName.
  const sampleProjects = [
    {
      projectName: "East-West Highway Section 7",
      infrastructureType: "ROAD" as const,
      projectType: "MULTIYEAR" as const,
      originalContractPrice: "125000000",
      priceEscalation: "5000000",
      contingencies: "2500000",
      contractDate: new Date("2024-09-01"),
      intendedCompletionDate: new Date("2027-06-30"),
      paymentTillLastFY: "20000000",
      paymentTillDate: "32500000",
      totalAdvancePayment: "10000000",
      outstandingAdvanceTillLastFY: "4000000",
      outstandingAdvanceTillDate: "2500000",
      currentFYBudget: "30000000",
      expectedPaymentTillFYEnd: "28000000",
      nextFYBudgetRequirement: "40000000",
      physicalProgress: "28.50",
      status: "RUNNING" as const,
    },
    {
      projectName: "Karnali Bridge Approach",
      infrastructureType: "BRIDGE" as const,
      projectType: "SOURCE_APPROVED" as const,
      originalContractPrice: "85000000",
      priceEscalation: "3000000",
      contingencies: "1500000",
      contractDate: new Date("2025-01-12"),
      intendedCompletionDate: new Date("2026-12-31"),
      paymentTillLastFY: "0",
      paymentTillDate: "12500000",
      totalAdvancePayment: "5000000",
      outstandingAdvanceTillLastFY: "0",
      outstandingAdvanceTillDate: "3000000",
      currentFYBudget: "20000000",
      expectedPaymentTillFYEnd: "18000000",
      nextFYBudgetRequirement: "35000000",
      physicalProgress: "15.00",
      status: "RUNNING" as const,
    },
    {
      projectName: "District Road A12",
      infrastructureType: "ROAD" as const,
      projectType: "YEARLY_TENDERED" as const,
      originalContractPrice: "12500000",
      priceEscalation: null,
      contingencies: null,
      contractDate: new Date("2024-08-01"),
      intendedCompletionDate: new Date("2025-06-30"),
      completedAt: new Date("2025-06-15"),
      paymentTillLastFY: "12500000",
      paymentTillDate: "12500000",
      totalAdvancePayment: "0",
      outstandingAdvanceTillLastFY: "0",
      outstandingAdvanceTillDate: "0",
      currentFYBudget: "0",
      physicalProgress: "100.00",
      status: "COMPLETED" as const,
    },
  ];

  for (const data of sampleProjects) {
    const existing = await prisma.project.findFirst({
      where: { projectName: data.projectName, engineerId: eng.id },
    });
    if (!existing) {
      await prisma.project.create({
        data: { ...data, engineerId: eng.id, fiscalYearId: fy.id },
      });
    }
  }

  // VOs + EoT on East-West Highway (idempotent)
  const eastWest = await prisma.project.findFirst({
    where: { projectName: "East-West Highway Section 7", engineerId: eng.id },
  });
  if (eastWest) {
    const voSeed = [
      {
        voNumber: 1,
        revisedContractAmount: "130000000",
        approvalDate: new Date("2025-03-15"),
        description: "Additional drainage works",
      },
      {
        voNumber: 2,
        revisedContractAmount: "135000000",
        approvalDate: new Date("2025-10-01"),
        description: "Embankment reinforcement after monsoon",
      },
    ];
    for (const v of voSeed) {
      const existing = await prisma.variationOrder.findFirst({
        where: { projectId: eastWest.id, voNumber: v.voNumber },
      });
      if (!existing) {
        await prisma.variationOrder.create({
          data: { projectId: eastWest.id, ...v },
        });
      }
    }

    const existingEoT = await prisma.extensionOfTime.findFirst({
      where: { projectId: eastWest.id, eotNumber: 1 },
    });
    if (!existingEoT) {
      await prisma.extensionOfTime.create({
        data: {
          projectId: eastWest.id,
          eotNumber: 1,
          extendedToDate: new Date("2027-09-30"),
          approvalDate: new Date("2025-10-01"),
          reason: "Monsoon delay carry-over",
        },
      });
    }
  }

  console.log("\nSeed complete.");
  console.log("  PM         →  pm@example.com   /  " + pmPassword);
  console.log("  Engineer   →  eng@example.com  /  " + engPassword);
  console.log("  Engineer 2 →  eng2@example.com /  " + eng2Password);
  console.log("  Current FY → 2082/83");
  console.log("  Sample projects: 3 (owned by Engineer Demo)\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
