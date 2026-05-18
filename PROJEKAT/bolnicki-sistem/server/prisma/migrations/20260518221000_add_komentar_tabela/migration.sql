-- CreateTable
CREATE TABLE "Komentar" (
    "id" SERIAL NOT NULL,
    "idRezervacije" INTEGER NOT NULL,
    "idKorisnik" INTEGER,
    "tekst" TEXT NOT NULL,
    "jeDoktor" BOOLEAN NOT NULL DEFAULT false,
    "datumKreiranja" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Komentar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Komentar_idRezervacije_idx" ON "Komentar"("idRezervacije");

-- CreateIndex
CREATE INDEX "Komentar_idKorisnik_idx" ON "Komentar"("idKorisnik");

-- AddForeignKey
ALTER TABLE "Komentar" ADD CONSTRAINT "Komentar_idRezervacije_fkey" FOREIGN KEY ("idRezervacije") REFERENCES "Rezervacije"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Komentar" ADD CONSTRAINT "Komentar_idKorisnik_fkey" FOREIGN KEY ("idKorisnik") REFERENCES "Korisnik"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill existing reservation comments so old data remains visible.
INSERT INTO "Komentar" ("idRezervacije", "idKorisnik", "tekst", "jeDoktor", "datumKreiranja")
SELECT
    r."id",
    CASE
        WHEN r."doktorRezervisao" THEN d."idKorisnik"
        ELSE p."idKorisnik"
    END,
    r."komentar",
    r."doktorRezervisao",
    r."datumKreiranja"
FROM "Rezervacije" r
LEFT JOIN "Pacijent" p ON p."id" = r."idPacijent"
LEFT JOIN "Doktor" d ON d."id" = r."idDoktor"
WHERE r."komentar" IS NOT NULL
  AND length(trim(r."komentar")) > 0;
