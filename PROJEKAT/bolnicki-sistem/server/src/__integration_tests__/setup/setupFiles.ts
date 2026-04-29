import { beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";

// Direktne instance koje gledaju na test bazu/redis iz .env.test
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

const redis = new Redis(process.env.REDIS_URL!, {
  lazyConnect: false,
  maxRetriesPerRequest: 3,
});

// Briše sve redove u ispravnom redoslijedu (foreign key constraints)
// ali ostavlja seed podatke — seed se ponovo pokreće u globalSetup
beforeEach(async () => {
  await prisma.podsjetnik.deleteMany();
  await prisma.recept.deleteMany();
  await prisma.historijaPregleda.deleteMany();
  await prisma.rezervacijaSpecijalista.deleteMany();
  await prisma.rezervacije.deleteMany();
  await prisma.listaCekanja.deleteMany();
  await prisma.termin.deleteMany();
  await prisma.rasporedDoktora.deleteMany();
  await prisma.nalaz.deleteMany();

  // Resetuj autoincrement sekvencu za termine
  await prisma.$executeRaw`ALTER SEQUENCE "Termin_id_seq" RESTART WITH 1`;

  // Ponovo ubaci seed podatke da svaki test ima čistu ali popunjenu bazu
  const odjel = await prisma.odjel.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, naziv: "Opća medicina", opis: "Testni odjel" },
  });

  const soba = await prisma.soba.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      naziv: "Ordinacija 1",
      tip: "ORDINACIJA",
      sprat: 1,
      kapacitet: 2,
      statusSobe: "AKTIVNA",
    },
  });

  const korisnikDoktor = await prisma.korisnik.upsert({
    where: { email: "doktor@test.com" },
    update: {},
    create: {
      id: 1,
      jmbg: "1234567890123",
      ime: "Mirza",
      prezime: "Hodžić",
      datumRodjenja: new Date("1980-01-01"),
      email: "doktor@test.com",
      pristupnaSifra: "hash_placeholder",
      uloga: "DOKTOR",
    },
  });

  const doktor = await prisma.doktor.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idKorisnik: korisnikDoktor.id,
      idOdjela: odjel.id,
      idSobe: soba.id,
      brojLicence: 123456,
      specijalizacija: "Opća medicina",
      trajanjePregleda: 30,
    },
  });

  await prisma.rasporedDoktora.create({
    data: {
      idDoktor: doktor.id,
      danUSedmici: "PONEDJELJAK",
      vrijemeOd: new Date("2026-04-13T08:00:00"),
      vrijemeDo: new Date("2026-04-13T16:00:00"),
      datumOd: new Date("2026-04-13"),
      aktivan: true,
    },
  });

  const korisnikPacijent = await prisma.korisnik.upsert({
    where: { email: "pacijent@test.com" },
    update: {},
    create: {
      id: 2, // ← fiksirani ID da PACIJENT_KORISNIK_ID = 2 uvijek radi
      jmbg: "876543210987",
      ime: "Amra",
      prezime: "Testić",
      datumRodjenja: new Date("1995-05-15"),
      email: "pacijent@test.com",
      pristupnaSifra: "hash_placeholder",
      uloga: "PACIJENT",
    },
  });

  await prisma.pacijent.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idKorisnik: korisnikPacijent.id,
      brojKnjizice: 111222333,
      hronicniBolesnik: false,
    },
  });

  await prisma.tipPregleda.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      naziv: "Preventivni pregled",
      trajanjeMinuta: 30,
      zahtijevaSalu: false,
    },
  });

  await prisma.termin.createMany({
    data: [
      {
        id: 1,
        idDoktor: doktor.id,
        datum: new Date("2026-04-13"),
        vrijeme: 540,
        opis: "Jutarnji termin",
        status: "SLOBODAN",
      },
      {
        id: 2,
        idDoktor: doktor.id,
        datum: new Date("2026-04-13"),
        vrijeme: 570,
        opis: "Drugi jutarnji termin",
        status: "SLOBODAN",
      },
    ],
    skipDuplicates: true,
  });

  // Očisti sve Redis lockove
  const keys = await redis.keys("termin:lock:*");
  if (keys.length > 0) await redis.del(...keys);
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});