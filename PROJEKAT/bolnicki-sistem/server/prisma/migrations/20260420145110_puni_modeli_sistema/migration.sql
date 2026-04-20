-- CreateEnum
CREATE TYPE "Uloga" AS ENUM ('ADMINISTRATOR', 'PACIJENT', 'DOKTOR', 'MEDICINSKO_OSOBLJE', 'VLASNIK');

-- CreateEnum
CREATE TYPE "StatusTermina" AS ENUM ('ZAKAZAN', 'POTVRDJEN', 'OTKAZAN');

-- CreateEnum
CREATE TYPE "TipSobe" AS ENUM ('ORDINACIJA', 'SALA', 'KABINET', 'LABORATORIJ');

-- CreateEnum
CREATE TYPE "StatusSobe" AS ENUM ('AKTIVNA', 'NEAKTIVNA', 'U_RENOVACIJI');

-- CreateEnum
CREATE TYPE "DanUSedmici" AS ENUM ('PONEDJELJAK', 'UTORAK', 'SRIJEDA', 'CETVRTAK', 'PETAK', 'SUBOTA', 'NEDJELJA');

-- CreateEnum
CREATE TYPE "StatusListeCekanja" AS ENUM ('CEKA', 'OBAVIJESTEN');

-- CreateEnum
CREATE TYPE "Prioritet" AS ENUM ('HITAN', 'HRONICNI_BOLESNIK', 'NORMALAN');

-- CreateTable
CREATE TABLE "Korisnik" (
    "id" SERIAL NOT NULL,
    "jmbg" TEXT NOT NULL,
    "ime" TEXT NOT NULL,
    "prezime" TEXT NOT NULL,
    "datumRodjenja" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "pristupnaSifra" TEXT NOT NULL,
    "brojTelefona" TEXT,
    "datumRegistracije" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brojNeuspjelihPrijava" INTEGER NOT NULL DEFAULT 0,
    "uloga" "Uloga" NOT NULL DEFAULT 'PACIJENT',

    CONSTRAINT "Korisnik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pacijent" (
    "id" SERIAL NOT NULL,
    "idKorisnik" INTEGER NOT NULL,
    "brojKnjizice" INTEGER NOT NULL,
    "hronicniBolesnik" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Pacijent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doktor" (
    "id" SERIAL NOT NULL,
    "idKorisnik" INTEGER NOT NULL,
    "idOdjela" INTEGER NOT NULL,
    "idSobe" INTEGER,
    "brojPregleda" INTEGER NOT NULL DEFAULT 0,
    "brojLicence" INTEGER NOT NULL,
    "specijalizacija" TEXT NOT NULL,
    "trajanjePregleda" INTEGER NOT NULL DEFAULT 15,

    CONSTRAINT "Doktor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediciskoOsoblje" (
    "id" SERIAL NOT NULL,
    "idKorisnik" INTEGER NOT NULL,
    "idOdjel" INTEGER NOT NULL,
    "pozicija" TEXT NOT NULL,
    "radnoVrijeme" INTEGER NOT NULL,

    CONSTRAINT "MediciskoOsoblje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Odjel" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "opis" TEXT,

    CONSTRAINT "Odjel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Termin" (
    "id" SERIAL NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "vrijeme" INTEGER NOT NULL,
    "opis" TEXT,
    "status" "StatusTermina" NOT NULL DEFAULT 'ZAKAZAN',
    "pacijentId" INTEGER,

    CONSTRAINT "Termin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rezervacije" (
    "id" SERIAL NOT NULL,
    "idTermina" INTEGER NOT NULL,
    "idPacijent" INTEGER NOT NULL,
    "idDoktor" INTEGER NOT NULL,
    "idSobe" INTEGER,
    "idTipPregleda" INTEGER,
    "doktorRezervisao" BOOLEAN NOT NULL DEFAULT false,
    "komentar" TEXT,
    "hitnost" BOOLEAN NOT NULL DEFAULT false,
    "datumKreiranja" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datumOtkazivanja" TIMESTAMP(3),
    "doktorOtkazao" BOOLEAN NOT NULL DEFAULT false,
    "zavrseno" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Rezervacije_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Podsjetnik" (
    "id" SERIAL NOT NULL,
    "idPacijent" INTEGER NOT NULL,
    "idRezervacije" INTEGER NOT NULL,
    "vrijemeTermina" INTEGER NOT NULL,
    "datumTermina" TIMESTAMP(3) NOT NULL,
    "datumSlanja" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusSlanja" TEXT NOT NULL,
    "nacinSlanja" TEXT NOT NULL,

    CONSTRAINT "Podsjetnik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "idKorisnika" INTEGER NOT NULL,
    "tipAkcije" TEXT NOT NULL,
    "vrijemeAkcije" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stariPodaci" TEXT,
    "noviPodaci" TEXT,
    "izmenjenaTabela" TEXT NOT NULL,
    "ipAdresa" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorijaPregleda" (
    "id" SERIAL NOT NULL,
    "idPacijent" INTEGER NOT NULL,
    "idDoktor" INTEGER NOT NULL,
    "idRezervacija" INTEGER NOT NULL,
    "idNalaz" INTEGER,
    "datumPregleda" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dijagnoza" TEXT NOT NULL,
    "terapija" TEXT NOT NULL,
    "biljeske" TEXT,

    CONSTRAINT "HistorijaPregleda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RezervacijaSpecijalista" (
    "id" SERIAL NOT NULL,
    "idSpecijaliste" INTEGER NOT NULL,
    "idDoktorOpste" INTEGER NOT NULL,
    "idRezervacije" INTEGER NOT NULL,
    "razlogPregleda" TEXT NOT NULL,

    CONSTRAINT "RezervacijaSpecijalista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nalaz" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "vrijemeNalaza" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opis" TEXT,
    "dokumentPDF" BYTEA,

    CONSTRAINT "Nalaz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Soba" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "tip" "TipSobe" NOT NULL,
    "sprat" INTEGER NOT NULL,
    "kapacitet" INTEGER NOT NULL DEFAULT 1,
    "opis" TEXT,
    "statusSobe" "StatusSobe" NOT NULL DEFAULT 'AKTIVNA',

    CONSTRAINT "Soba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RasporedDoktora" (
    "id" SERIAL NOT NULL,
    "idDoktor" INTEGER NOT NULL,
    "danUSedmici" "DanUSedmici" NOT NULL,
    "vrijemeOd" TIME NOT NULL,
    "vrijemeDo" TIME NOT NULL,
    "datumOd" TIMESTAMP(3) NOT NULL,
    "datumDo" TIMESTAMP(3),
    "aktivan" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RasporedDoktora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recept" (
    "id" SERIAL NOT NULL,
    "idHistorijaPregleda" INTEGER NOT NULL,
    "idDoktor" INTEGER NOT NULL,
    "nazivLijeka" TEXT NOT NULL,
    "doza" TEXT NOT NULL,
    "trajanje" INTEGER NOT NULL,
    "napomena" TEXT,
    "datumIzdavanja" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListaCekanja" (
    "id" SERIAL NOT NULL,
    "idPacijent" INTEGER NOT NULL,
    "idDoktor" INTEGER NOT NULL,
    "datumZahtjeva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusListeCekanja" NOT NULL DEFAULT 'CEKA',
    "prioritet" "Prioritet" NOT NULL DEFAULT 'NORMALAN',
    "napomena" TEXT,

    CONSTRAINT "ListaCekanja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipPregleda" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "opis" TEXT,
    "trajanjeMinuta" INTEGER NOT NULL,
    "zahtijevaSalu" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TipPregleda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Korisnik_jmbg_key" ON "Korisnik"("jmbg");

-- CreateIndex
CREATE UNIQUE INDEX "Korisnik_email_key" ON "Korisnik"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pacijent_idKorisnik_key" ON "Pacijent"("idKorisnik");

-- CreateIndex
CREATE UNIQUE INDEX "Pacijent_brojKnjizice_key" ON "Pacijent"("brojKnjizice");

-- CreateIndex
CREATE UNIQUE INDEX "Doktor_idKorisnik_key" ON "Doktor"("idKorisnik");

-- CreateIndex
CREATE UNIQUE INDEX "Doktor_brojLicence_key" ON "Doktor"("brojLicence");

-- CreateIndex
CREATE UNIQUE INDEX "MediciskoOsoblje_idKorisnik_key" ON "MediciskoOsoblje"("idKorisnik");

-- CreateIndex
CREATE UNIQUE INDEX "Podsjetnik_idRezervacije_key" ON "Podsjetnik"("idRezervacije");

-- CreateIndex
CREATE UNIQUE INDEX "HistorijaPregleda_idRezervacija_key" ON "HistorijaPregleda"("idRezervacija");

-- CreateIndex
CREATE UNIQUE INDEX "RezervacijaSpecijalista_idRezervacije_key" ON "RezervacijaSpecijalista"("idRezervacije");

-- AddForeignKey
ALTER TABLE "Pacijent" ADD CONSTRAINT "Pacijent_idKorisnik_fkey" FOREIGN KEY ("idKorisnik") REFERENCES "Korisnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doktor" ADD CONSTRAINT "Doktor_idKorisnik_fkey" FOREIGN KEY ("idKorisnik") REFERENCES "Korisnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doktor" ADD CONSTRAINT "Doktor_idOdjela_fkey" FOREIGN KEY ("idOdjela") REFERENCES "Odjel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doktor" ADD CONSTRAINT "Doktor_idSobe_fkey" FOREIGN KEY ("idSobe") REFERENCES "Soba"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediciskoOsoblje" ADD CONSTRAINT "MediciskoOsoblje_idKorisnik_fkey" FOREIGN KEY ("idKorisnik") REFERENCES "Korisnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediciskoOsoblje" ADD CONSTRAINT "MediciskoOsoblje_idOdjel_fkey" FOREIGN KEY ("idOdjel") REFERENCES "Odjel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Termin" ADD CONSTRAINT "Termin_pacijentId_fkey" FOREIGN KEY ("pacijentId") REFERENCES "Pacijent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezervacije" ADD CONSTRAINT "Rezervacije_idTermina_fkey" FOREIGN KEY ("idTermina") REFERENCES "Termin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezervacije" ADD CONSTRAINT "Rezervacije_idPacijent_fkey" FOREIGN KEY ("idPacijent") REFERENCES "Pacijent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezervacije" ADD CONSTRAINT "Rezervacije_idDoktor_fkey" FOREIGN KEY ("idDoktor") REFERENCES "Doktor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezervacije" ADD CONSTRAINT "Rezervacije_idSobe_fkey" FOREIGN KEY ("idSobe") REFERENCES "Soba"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezervacije" ADD CONSTRAINT "Rezervacije_idTipPregleda_fkey" FOREIGN KEY ("idTipPregleda") REFERENCES "TipPregleda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Podsjetnik" ADD CONSTRAINT "Podsjetnik_idPacijent_fkey" FOREIGN KEY ("idPacijent") REFERENCES "Pacijent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Podsjetnik" ADD CONSTRAINT "Podsjetnik_idRezervacije_fkey" FOREIGN KEY ("idRezervacije") REFERENCES "Rezervacije"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_idKorisnika_fkey" FOREIGN KEY ("idKorisnika") REFERENCES "Korisnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorijaPregleda" ADD CONSTRAINT "HistorijaPregleda_idPacijent_fkey" FOREIGN KEY ("idPacijent") REFERENCES "Pacijent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorijaPregleda" ADD CONSTRAINT "HistorijaPregleda_idDoktor_fkey" FOREIGN KEY ("idDoktor") REFERENCES "Doktor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorijaPregleda" ADD CONSTRAINT "HistorijaPregleda_idRezervacija_fkey" FOREIGN KEY ("idRezervacija") REFERENCES "Rezervacije"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorijaPregleda" ADD CONSTRAINT "HistorijaPregleda_idNalaz_fkey" FOREIGN KEY ("idNalaz") REFERENCES "Nalaz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RezervacijaSpecijalista" ADD CONSTRAINT "RezervacijaSpecijalista_idSpecijaliste_fkey" FOREIGN KEY ("idSpecijaliste") REFERENCES "Doktor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RezervacijaSpecijalista" ADD CONSTRAINT "RezervacijaSpecijalista_idDoktorOpste_fkey" FOREIGN KEY ("idDoktorOpste") REFERENCES "Doktor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RezervacijaSpecijalista" ADD CONSTRAINT "RezervacijaSpecijalista_idRezervacije_fkey" FOREIGN KEY ("idRezervacije") REFERENCES "Rezervacije"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RasporedDoktora" ADD CONSTRAINT "RasporedDoktora_idDoktor_fkey" FOREIGN KEY ("idDoktor") REFERENCES "Doktor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recept" ADD CONSTRAINT "Recept_idHistorijaPregleda_fkey" FOREIGN KEY ("idHistorijaPregleda") REFERENCES "HistorijaPregleda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recept" ADD CONSTRAINT "Recept_idDoktor_fkey" FOREIGN KEY ("idDoktor") REFERENCES "Doktor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaCekanja" ADD CONSTRAINT "ListaCekanja_idPacijent_fkey" FOREIGN KEY ("idPacijent") REFERENCES "Pacijent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaCekanja" ADD CONSTRAINT "ListaCekanja_idDoktor_fkey" FOREIGN KEY ("idDoktor") REFERENCES "Doktor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
