ALTER TABLE "Korisnik"
ADD COLUMN "nalogZakljucan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "vrijemeZakljucavanja" TIMESTAMP(3),
ADD COLUMN "zadnjiNeuspjeliPokusaj" TIMESTAMP(3);
