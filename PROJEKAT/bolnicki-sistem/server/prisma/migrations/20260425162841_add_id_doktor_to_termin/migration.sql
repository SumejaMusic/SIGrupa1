/*
  Warnings:

  - Added the required column `idDoktor` to the `Termin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Termin" ADD COLUMN     "idDoktor" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Termin" ADD CONSTRAINT "Termin_idDoktor_fkey" FOREIGN KEY ("idDoktor") REFERENCES "Doktor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
