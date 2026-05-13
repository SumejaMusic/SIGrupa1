/*
  Warnings:

  - A unique constraint covering the columns `[brojKnjiziceHash]` on the table `Pacijent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `brojKnjiziceHash` to the `Pacijent` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Pacijent_brojKnjizice_key";

-- AlterTable
ALTER TABLE "Pacijent" ADD COLUMN     "brojKnjiziceHash" TEXT NOT NULL,
ALTER COLUMN "brojKnjizice" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Pacijent_brojKnjiziceHash_key" ON "Pacijent"("brojKnjiziceHash");
