/*
  Warnings:

  - You are about to drop the `JobUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JobUsers" DROP CONSTRAINT "JobUsers_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobUsers" DROP CONSTRAINT "JobUsers_userId_fkey";

-- DropTable
DROP TABLE "JobUsers";

-- CreateTable
CREATE TABLE "JobUser" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobUser" ADD CONSTRAINT "JobUser_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobUser" ADD CONSTRAINT "JobUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
