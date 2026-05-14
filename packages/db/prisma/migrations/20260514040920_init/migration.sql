-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ENGINEER', 'PROJECT_MANAGER');

-- CreateEnum
CREATE TYPE "Infrastructure" AS ENUM ('ROAD', 'BRIDGE');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('MULTIYEAR', 'SOURCE_APPROVED', 'YEARLY_TENDERED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('RUNNING', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ENGINEER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "FiscalYear" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "infrastructureType" "Infrastructure" NOT NULL,
    "projectType" "ProjectType" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'RUNNING',
    "engineerId" TEXT NOT NULL,
    "originalContractPrice" DECIMAL(18,2) NOT NULL,
    "priceEscalation" DECIMAL(18,2),
    "contingencies" DECIMAL(18,2),
    "contractDate" DATE NOT NULL,
    "intendedCompletionDate" DATE NOT NULL,
    "completedAt" TIMESTAMP(3),
    "paymentTillLastFY" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paymentTillDate" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalAdvancePayment" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outstandingAdvanceTillLastFY" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outstandingAdvanceTillDate" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currentFYBudget" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "expectedPaymentTillFYEnd" DECIMAL(18,2),
    "expectedOutstandingAdvanceFYEnd" DECIMAL(18,2),
    "nextFYBudgetRequirement" DECIMAL(18,2),
    "physicalProgress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedById" TEXT,
    "fiscalYearId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariationOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "voNumber" INTEGER NOT NULL,
    "revisedContractAmount" DECIMAL(18,2) NOT NULL,
    "approvalDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VariationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionOfTime" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "eotNumber" INTEGER NOT NULL,
    "extendedToDate" DATE NOT NULL,
    "approvalDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtensionOfTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalYearSnapshot" (
    "id" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "openingPayment" DECIMAL(18,2) NOT NULL,
    "closingPayment" DECIMAL(18,2) NOT NULL,
    "fyPayment" DECIMAL(18,2) NOT NULL,
    "fyBudget" DECIMAL(18,2) NOT NULL,
    "fyAdvanceRecovered" DECIMAL(18,2) NOT NULL,
    "physicalProgress" DECIMAL(5,2) NOT NULL,
    "financialProgress" DECIMAL(5,2) NOT NULL,
    "surplusDeficit" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalYearSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_label_key" ON "FiscalYear"("label");

-- CreateIndex
CREATE INDEX "FiscalYear_isCurrent_idx" ON "FiscalYear"("isCurrent");

-- CreateIndex
CREATE INDEX "Project_engineerId_isArchived_status_idx" ON "Project"("engineerId", "isArchived", "status");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_isArchived_idx" ON "Project"("isArchived");

-- CreateIndex
CREATE INDEX "Project_fiscalYearId_idx" ON "Project"("fiscalYearId");

-- CreateIndex
CREATE INDEX "Project_projectType_idx" ON "Project"("projectType");

-- CreateIndex
CREATE INDEX "Project_infrastructureType_idx" ON "Project"("infrastructureType");

-- CreateIndex
CREATE INDEX "VariationOrder_projectId_idx" ON "VariationOrder"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "VariationOrder_projectId_voNumber_key" ON "VariationOrder"("projectId", "voNumber");

-- CreateIndex
CREATE INDEX "ExtensionOfTime_projectId_idx" ON "ExtensionOfTime"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionOfTime_projectId_eotNumber_key" ON "ExtensionOfTime"("projectId", "eotNumber");

-- CreateIndex
CREATE INDEX "FiscalYearSnapshot_fiscalYearId_idx" ON "FiscalYearSnapshot"("fiscalYearId");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYearSnapshot_projectId_fiscalYearId_key" ON "FiscalYearSnapshot"("projectId", "fiscalYearId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_idx" ON "AuditEvent"("actorUserId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariationOrder" ADD CONSTRAINT "VariationOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionOfTime" ADD CONSTRAINT "ExtensionOfTime_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalYearSnapshot" ADD CONSTRAINT "FiscalYearSnapshot_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalYearSnapshot" ADD CONSTRAINT "FiscalYearSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
