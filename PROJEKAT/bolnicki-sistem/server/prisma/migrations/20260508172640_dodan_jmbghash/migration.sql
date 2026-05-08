/*
  Warnings:

  - A unique constraint covering the columns `[jmbgHash]` on the table `Korisnik` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jmbgHash` to the `Korisnik` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Korisnik_jmbg_key";

-- AlterTable
ALTER TABLE "Korisnik" ADD COLUMN     "jmbgHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Termin" ALTER COLUMN "status" SET DEFAULT 'SLOBODAN';

-- CreateIndex
CREATE UNIQUE INDEX "Korisnik_jmbgHash_key" ON "Korisnik"("jmbgHash");
