-- CreateEnum
CREATE TYPE "SalaryPeriod" AS ENUM ('HOURLY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "job_postings" ADD COLUMN     "salaryPeriod" "SalaryPeriod";
