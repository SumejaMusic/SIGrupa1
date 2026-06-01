ALTER TABLE "Pacijent" ADD COLUMN "alergije" TEXT;
ALTER TABLE "Pacijent" ADD COLUMN "hronicneBolesti" TEXT;
ALTER TABLE "Pacijent" ADD COLUMN "krvnaGrupa" TEXT;
ALTER TABLE "Pacijent" ADD COLUMN "doniraKrv" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Pacijent" ADD COLUMN "imaoOperacije" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Pacijent" ADD COLUMN "operacijeOpis" TEXT;
