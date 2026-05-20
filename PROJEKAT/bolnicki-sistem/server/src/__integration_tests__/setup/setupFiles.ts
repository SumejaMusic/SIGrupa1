import { beforeEach, afterAll, vi } from "vitest";
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";

(globalThis as any).pregledRoutes = Router();

vi.mock("../../middleware/autorizacija.js", () => {
  const autorizuj = (...uloge: any[]) => {
    const dozvoljeneUloge = uloge.flat().filter(Boolean);

    return (req: any, res: any, next: any) => {
      const korisnik = req.korisnik;

      if (!korisnik) {
        res.status(401).json({ poruka: "Niste prijavljeni." });
        return;
      }

      if (dozvoljeneUloge.length > 0 && !dozvoljeneUloge.includes(korisnik.uloga)) {
        res.status(403).json({
          poruka: "Nemate dozvolu za pristup ovom resursu.",
        });
        return;
      }

      next();
    };
  };

  return {
    autorizacija: autorizuj,
    autorizuj,
  };
});

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

const redis = new Redis(process.env.REDIS_URL!, {
  lazyConnect: false,
  maxRetriesPerRequest: 3,
});

beforeEach(async () => {
  // Brisanje u ispravnom redoslijedu — djeca prije roditelja (FK constraints)
  await prisma.podsjetnik.deleteMany();
  await prisma.recept.deleteMany();
  await prisma.historijaPregleda.deleteMany();
  await prisma.rezervacijaSpecijalista.deleteMany();
  await prisma.rezervacije.deleteMany();
  await prisma.listaCekanja.deleteMany();
  await prisma.termin.deleteMany();
  await prisma.rasporedDoktora.deleteMany();
  await prisma.nalaz.deleteMany();

  // Resetuj autoincrement sekvence da ID-evi budu predvidivi u testovima
  await prisma.$executeRaw`ALTER SEQUENCE "Termin_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "Rezervacije_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "RasporedDoktora_id_seq" RESTART WITH 1`;

  // ── Seed: Odjel ──────────────────────────────────────────────
  await prisma.odjel.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, naziv: "Opća medicina", opis: "Testni odjel" },
  });

  // ── Seed: Soba ───────────────────────────────────────────────
  await prisma.soba.upsert({
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

  // ── Seed: Korisnik doktora ───────────────────────────────────
  const korisnikDoktor = await prisma.korisnik.upsert({
    where: { email: "doktor@test.com" },
    update: { emailVerifikovan: true },
    create: {
      id: 1,
      jmbg: "1234567890123",
      jmbgHash: "jmbg-hash-doktor-test",
      ime: "Mirza",
      prezime: "Hodžić",
      datumRodjenja: new Date("1980-01-01"),
      email: "doktor@test.com",
      pristupnaSifra: "hash_placeholder",
      emailVerifikovan: true,
      uloga: "DOKTOR",
    },
  });

  // ── Seed: Doktor ─────────────────────────────────────────────
  const doktor = await prisma.doktor.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idKorisnik: korisnikDoktor.id,
      idOdjela: 1,
      idSobe: 1,
      brojLicence: 123456,
      specijalizacija: "Opća medicina",
      trajanjePregleda: 30,
    },
  });

  // ── Seed: Raspored doktora ───────────────────────────────────
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

  // ── Seed: Korisnik pacijenta ─────────────────────────────────
  // ID=2 je fiksirani — PACIJENT_KORISNIK_ID u testovima ovisi o ovome
  const korisnikPacijent = await prisma.korisnik.upsert({
    where: { email: "musicsumeja98@gmail.com" },
    update: { emailVerifikovan: true },
    create: {
      id: 2,
      jmbg: "876543210987",
      jmbgHash: "jmbg-hash-pacijent-test",
      ime: "Amra",
      prezime: "Testić",
      datumRodjenja: new Date("1995-05-15"),
      email: "musicsumeja98@gmail.com",
      pristupnaSifra: "hash_placeholder",
      emailVerifikovan: true,
      uloga: "PACIJENT",
    },
  });

  // ── Seed: Pacijent ───────────────────────────────────────────
  await prisma.pacijent.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idKorisnik: korisnikPacijent.id,
      brojKnjizice: "111222333",
      brojKnjiziceHash: "broj-knjizice-hash-test",
      hronicniBolesnik: false,
    },
  });

  // ── Seed: Tip pregleda ───────────────────────────────────────
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

  // ── Seed: Termini ─────────────────────────────────────────────
  // ID=1 i ID=2 su fiksirani — termin testovi ovise o njima
  await prisma.termin.createMany({
    data: [
      {
        id: 1,
        idDoktor: doktor.id,
        datum: new Date("2030-04-13"),
        vrijeme: 540, // 9:00
        opis: "Jutarnji termin",
        status: "SLOBODAN",
      },
      {
        id: 2,
        idDoktor: doktor.id,
        datum: new Date("2030-04-13"),
        vrijeme: 570, // 9:30
        opis: "Drugi jutarnji termin",
        status: "SLOBODAN",
      },
    ],
    skipDuplicates: true,
  });

  // ── Redis: Očisti sve lockove ────────────────────────────────
  const keys = await redis.keys("termin:lock:*");
  if (keys.length > 0) await redis.del(...keys);
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});
