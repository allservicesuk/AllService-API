-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "customResponses" JSONB;

-- AlterTable
ALTER TABLE "job_postings" ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "cvRequired" BOOLEAN NOT NULL DEFAULT true;
