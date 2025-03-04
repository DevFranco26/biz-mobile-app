-- CreateEnum
CREATE TYPE "enum_Users_role" AS ENUM ('superadmin', 'admin', 'supervisor', 'user');

-- CreateEnum
CREATE TYPE "enum_Subscriptions_status" AS ENUM ('active', 'canceled', 'inactive');

-- CreateTable
CREATE TABLE "Companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "language" TEXT NOT NULL DEFAULT 'en',

    CONSTRAINT "Companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "enum_Users_role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "presenceStatus" TEXT NOT NULL DEFAULT 'offline',
    "lastActiveAt" TIMESTAMP(3),
    "rateType" TEXT NOT NULL DEFAULT 'hourly',
    "rateValue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "departmentId" INTEGER,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "supervisorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaves" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "approverId" INTEGER,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "rejectionReason" TEXT,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locations" (
    "id" SERIAL NOT NULL,
    "adminid" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "latitude" DECIMAL(14,10) NOT NULL,
    "longitude" DECIMAL(14,10) NOT NULL,
    "radius" INTEGER NOT NULL DEFAULT 100,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER,

    CONSTRAINT "Locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payments" (
    "id" SERIAL NOT NULL,
    "chargeId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "amountCaptured" BIGINT,
    "currency" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "chargeStatus" TEXT,
    "createdTimestamp" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "billingDetails" JSONB,
    "shippingDetails" JSONB,
    "balanceTransactionId" TEXT,
    "chargeDescription" TEXT,
    "paymentOutcome" JSONB,
    "paymentIntentId" TEXT,
    "receiptEmail" TEXT,
    "requestId" TEXT,
    "idempotencyKey" TEXT,
    "eventType" TEXT NOT NULL,
    "subscriptionId" INTEGER,
    "companyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRecords" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "payType" TEXT NOT NULL,
    "hoursWorked" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "overtimeHours" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "overtimePay" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "grossPay" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "netPay" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollRecords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollSettings" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "cutoffCycle" TEXT NOT NULL DEFAULT 'bi-weekly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "overtimeRate" DECIMAL(10,2) NOT NULL DEFAULT 1.5,

    CONSTRAINT "PayrollSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayRates" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "payType" TEXT NOT NULL DEFAULT 'hourly',
    "rate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayRates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSchedules" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftSchedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlans" (
    "id" SERIAL NOT NULL,
    "planName" TEXT NOT NULL,
    "rangeOfUsers" TEXT NOT NULL DEFAULT '1',
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "description" TEXT,
    "features" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriptions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "paymentDateTime" TIMESTAMP(3),
    "expirationDateTime" TIMESTAMP(3),
    "renewalDateTime" TIMESTAMP(3),
    "status" "enum_Subscriptions_status" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeLogs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeOutDevice" JSONB,
    "timeInLat" DECIMAL(10,8),
    "timeInLong" DECIMAL(11,8),
    "timeOutLat" DECIMAL(10,8),
    "timeOutLong" DECIMAL(11,8),
    "timeInTimeZone" TEXT,
    "timeOutTimeZone" TEXT,
    "timeInDevice" JSONB,
    "coffeeBreakStart" TIMESTAMP(3),
    "coffeeBreakEnd" TIMESTAMP(3),
    "lunchBreakStart" TIMESTAMP(3),
    "lunchBreakEnd" TIMESTAMP(3),
    "totalHours" DECIMAL(5,2),
    "coffeeBreak2Start" TIMESTAMP(3),
    "coffeeBreak2End" TIMESTAMP(3),
    "timeInAt" TIMESTAMP(3),
    "timeOutAt" TIMESTAMP(3),

    CONSTRAINT "TimeLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserShiftAssignments" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "shiftScheduleId" INTEGER NOT NULL,
    "assignedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recurrence" TEXT NOT NULL DEFAULT 'all',

    CONSTRAINT "UserShiftAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "locationId" INTEGER,
    "restrictionenabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Companies_domain_key" ON "Companies"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Departments_name_companyId_unique" ON "Departments"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollSettings_companyId_key" ON "PayrollSettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PayRates_userId_key" ON "PayRates"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserShiftAssignments_userId_shiftScheduleId_key" ON "UserShiftAssignments"("userId", "shiftScheduleId");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departments" ADD CONSTRAINT "Departments_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departments" ADD CONSTRAINT "Departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaves" ADD CONSTRAINT "Leaves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaves" ADD CONSTRAINT "Leaves_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaves" ADD CONSTRAINT "Leaves_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locations" ADD CONSTRAINT "Locations_adminid_fkey" FOREIGN KEY ("adminid") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locations" ADD CONSTRAINT "Locations_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRecords" ADD CONSTRAINT "PayrollRecords_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRecords" ADD CONSTRAINT "PayrollRecords_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSettings" ADD CONSTRAINT "PayrollSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayRates" ADD CONSTRAINT "PayRates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSchedules" ADD CONSTRAINT "ShiftSchedules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriptions" ADD CONSTRAINT "Subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriptions" ADD CONSTRAINT "Subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeLogs" ADD CONSTRAINT "TimeLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShiftAssignments" ADD CONSTRAINT "UserShiftAssignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShiftAssignments" ADD CONSTRAINT "UserShiftAssignments_shiftScheduleId_fkey" FOREIGN KEY ("shiftScheduleId") REFERENCES "ShiftSchedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShiftAssignments" ADD CONSTRAINT "UserShiftAssignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
