-- Remove duplicate RasporedDoktora records (keep lowest id per doctor+day)
DELETE FROM "RasporedDoktora" a
USING "RasporedDoktora" b
WHERE a."id" > b."id"
  AND a."idDoktor" = b."idDoktor"
  AND a."danUSedmici" = b."danUSedmici";

-- Drop date-range columns (templates are now perpetual)
ALTER TABLE "RasporedDoktora" DROP COLUMN IF EXISTS "datumOd";
ALTER TABLE "RasporedDoktora" DROP COLUMN IF EXISTS "datumDo";

-- Add unique constraint: one template per doctor per day
ALTER TABLE "RasporedDoktora" ADD CONSTRAINT "RasporedDoktora_idDoktor_danUSedmici_key" UNIQUE ("idDoktor", "danUSedmici");

-- Create RazlogIzuzetka enum
CREATE TYPE "RazlogIzuzetka" AS ENUM ('BOLOVANJE', 'KONFERENCIJA', 'GODISNJI', 'ADMIN');

-- Create IzuzetakRasporeda table
CREATE TABLE "IzuzetakRasporeda" (
    "id"        SERIAL          NOT NULL,
    "idDoktor"  INTEGER         NOT NULL,
    "datum"     DATE            NOT NULL,
    "vrijemeOd" TIME,
    "vrijemeDo" TIME,
    "razlog"    "RazlogIzuzetka" NOT NULL,
    "napomena"  TEXT,
    CONSTRAINT "IzuzetakRasporeda_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "IzuzetakRasporeda"
  ADD CONSTRAINT "IzuzetakRasporeda_idDoktor_datum_key" UNIQUE ("idDoktor", "datum");

ALTER TABLE "IzuzetakRasporeda"
  ADD CONSTRAINT "IzuzetakRasporeda_idDoktor_fkey"
  FOREIGN KEY ("idDoktor") REFERENCES "Doktor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
