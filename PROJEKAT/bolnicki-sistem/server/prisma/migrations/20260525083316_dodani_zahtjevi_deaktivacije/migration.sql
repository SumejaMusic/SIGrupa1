-- DropForeignKey
ALTER TABLE "ReminderLog" DROP CONSTRAINT "ReminderLog_idPacijent_fkey";

-- CreateTable
CREATE TABLE "ZahtjevDeaktivacije" (
    "id" SERIAL NOT NULL,
    "idKorisnika" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NA_CEKANJU',
    "razlogKorisnika" TEXT,
    "adminObrazlozenje" TEXT,
    "idAdmina" INTEGER,
    "kreiranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "obradenAt" TIMESTAMP(3),

    CONSTRAINT "ZahtjevDeaktivacije_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ZahtjevDeaktivacije_idKorisnika_idx" ON "ZahtjevDeaktivacije"("idKorisnika");

-- CreateIndex
CREATE INDEX "ZahtjevDeaktivacije_status_idx" ON "ZahtjevDeaktivacije"("status");

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_idPacijent_fkey" FOREIGN KEY ("idPacijent") REFERENCES "Pacijent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZahtjevDeaktivacije" ADD CONSTRAINT "ZahtjevDeaktivacije_idKorisnika_fkey" FOREIGN KEY ("idKorisnika") REFERENCES "Korisnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
