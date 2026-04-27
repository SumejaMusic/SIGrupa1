
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Pokretanje seed-a...");

  // ─────────────────────────────────────────────
  // Odjel
  // ─────────────────────────────────────────────
  const odjel = await prisma.odjel.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      naziv: "Opća medicina",
      opis: "Testni odjel opće medicine",
    },
  });
  console.log("Odjel kreiran:", odjel.naziv);

  // ─────────────────────────────────────────────
  // Soba
  // ─────────────────────────────────────────────
  const soba = await prisma.soba.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      naziv: "Ordinacija 1",
      tip: "ORDINACIJA",
      sprat: 1,
      kapacitet: 2,
      opis: "Testna ordinacija",
      statusSobe: "AKTIVNA",
    },
  });
  console.log("Soba kreirana:", soba.naziv);

  // ─────────────────────────────────────────────
  // Korisnik — Doktor
  // ─────────────────────────────────────────────
  const korisnikDoktor = await prisma.korisnik.upsert({
    where: { email: "doktor@test.com" },
    update: {},
    create: {
      jmbg: "1234567890123",
      ime: "Mirza",
      prezime: "Hodžić",
      datumRodjenja: new Date("1980-01-01"),
      email: "doktor@test.com",
      pristupnaSifra: "hash_placeholder",
      brojTelefona: "61111111",
      datumRegistracije: new Date(),
      brojNeuspjelihPrijava: 0,
      uloga: "DOKTOR",
    },
  });

  // ─────────────────────────────────────────────
  // Doktor
  // ─────────────────────────────────────────────
  const doktor = await prisma.doktor.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idKorisnik: korisnikDoktor.id,
      idOdjela: odjel.id,
      idSobe: soba.id,
      brojPregleda: 0,
      brojLicence: 123456,
      specijalizacija: "Opća medicina",
      trajanjePregleda: 30,
    },
  });
  console.log("Doktor kreiran: Dr.", korisnikDoktor.prezime);

  // ─────────────────────────────────────────────
  // Raspored doktora
  // ─────────────────────────────────────────────
  await prisma.rasporedDoktora.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idDoktor: doktor.id,
      danUSedmici: "PONEDJELJAK",
      vrijemeOd: new Date("2026-04-13T08:00:00"),
      vrijemeDo: new Date("2026-04-13T16:00:00"),
      datumOd: new Date("2026-04-13"),
      datumDo: null,
      aktivan: true,
    },
  });
  console.log("Raspored doktora kreiran");

  // ─────────────────────────────────────────────
  // Korisnik — Pacijent
  // ─────────────────────────────────────────────
  const korisnikPacijent = await prisma.korisnik.upsert({
    where: { email: "pacijent@test.com" },
    update: {},
    create: {
      jmbg: "876543210987",
      ime: "Amra",
      prezime: "Testić",
      datumRodjenja: new Date("1995-05-15"),
      email: "pacijent@test.com",
      pristupnaSifra: "hash_placeholder",
      brojTelefona: "62222222",
      datumRegistracije: new Date(),
      brojNeuspjelihPrijava: 0,
      uloga: "PACIJENT",
    },
  });

  // ─────────────────────────────────────────────
  // Pacijent
  // ─────────────────────────────────────────────
  const pacijent = await prisma.pacijent.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idKorisnik: korisnikPacijent.id,
      brojKnjizice: 111222333,
      hronicniBolesnik: false,
    },
  });
  console.log("Pacijent kreiran:", korisnikPacijent.ime, korisnikPacijent.prezime);

  // ─────────────────────────────────────────────
  // Tip pregleda
  // ─────────────────────────────────────────────
  const tipPregleda = await prisma.tipPregleda.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      naziv: "Preventivni pregled",
      opis: "Standardni preventivni pregled",
      trajanjeMinuta: 30,
      zahtijevaSalu: false,
    },
  });
  console.log("Tip pregleda kreiran:", tipPregleda.naziv);

  // ─────────────────────────────────────────────
  // Slobodni termini
  // ─────────────────────────────────────────────
  const termin1 = await prisma.termin.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idDoktor: doktor.id,
      datum: new Date("2026-04-13"),//u tsu je "godina-mjesec-dan"
      vrijeme: 540,
      opis: "Jutarnji termin",
      status: "ZAKAZAN",
    },
  });

  const termin2 = await prisma.termin.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      idDoktor: doktor.id,
      datum: new Date("2026-04-13"),
      vrijeme: 570,
      opis: "Drugi jutarnji termin",
      status: "ZAKAZAN",
    },
  });
  console.log("Termini kreirani:", termin1.vrijeme, termin2.vrijeme);

  console.log("\nSeed završen uspješno!");
  console.log("─────────────────────────────────");
  console.log("Test podaci:");
  console.log("  Doktor ID:   ", doktor.id);
  console.log("  Pacijent ID: ", pacijent.id);
  console.log("  Termin IDs:  ", termin1.id, termin2.id);
}

main()
  .catch((e) => {
    console.error("Seed greška:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });