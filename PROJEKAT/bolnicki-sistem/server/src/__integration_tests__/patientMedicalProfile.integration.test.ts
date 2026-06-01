import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import app from "../app.js";

vi.mock("../emailService.js", () => ({
  posaljiPotvrdurezerv: vi.fn().mockResolvedValue(undefined),
  posaljiResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
  posaljiVerifikacioniKod: vi.fn().mockResolvedValue(undefined),
  posaljiOtkazivanjeRezerv: vi.fn().mockResolvedValue(undefined),
}));

const prisma = new PrismaClient();

const PACIJENT_EMAIL = "musicsumeja98@gmail.com";
const DOKTOR_ID = 1;
const TERMIN_ID = 1;
const TIP_PREGLEDA_ID = 1;

let pacijentToken: string;
let doktorToken: string;
let pacijentId: number;
let pacijentKorisnikId: number;
let doktorOdjelId: number;

beforeEach(async () => {
  const jwtSecret = process.env.JWT_SECRET ?? "test-secret";
  const pacijent = await prisma.pacijent.findFirst({
    where: { korisnik: { email: PACIJENT_EMAIL } },
    select: { id: true, idKorisnik: true },
  });
  const doktor = await prisma.doktor.findUnique({
    where: { id: DOKTOR_ID },
    select: { idKorisnik: true, idOdjela: true },
  });

  if (!pacijent || !doktor) {
    throw new Error("Test pacijent ili doktor nisu pronađeni u integration seed podacima.");
  }

  pacijentId = pacijent.id;
  pacijentKorisnikId = pacijent.idKorisnik;
  doktorOdjelId = doktor.idOdjela;

  pacijentToken = jwt.sign(
    { id: pacijentKorisnikId, uloga: "PACIJENT" },
    jwtSecret,
    { expiresIn: "1h" }
  );

  doktorToken = jwt.sign(
    { id: doktor.idKorisnik, uloga: "DOKTOR", doktorId: DOKTOR_ID },
    jwtSecret,
    { expiresIn: "1h" }
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});

const medicinskiProfilPayload = {
  alergije: "Penicilin i lateks",
  hronicneBolesti: "Astma",
  krvnaGrupa: "A+",
  doniraKrv: true,
  imaoOperacije: true,
  operacijeOpis: "Operacija slijepog crijeva 2020.",
};

async function pripremiRezervacijuZaDoktora() {
  await prisma.rezervacije.deleteMany({ where: { idTermina: TERMIN_ID } });
  await prisma.termin.update({
    where: { id: TERMIN_ID },
    data: { status: "SLOBODAN", pacijent: { disconnect: true } },
  });

  const rezervacija = await prisma.rezervacije.create({
    data: {
      idTermina: TERMIN_ID,
      idPacijent: pacijentId,
      idDoktor: DOKTOR_ID,
      idTipPregleda: TIP_PREGLEDA_ID,
      komentar: "Kontrolni pregled",
    },
  });

  await prisma.termin.update({
    where: { id: TERMIN_ID },
    data: { status: "ZAKAZAN", pacijent: { connect: { id: pacijentId } } },
  });

  return rezervacija;
}

async function generisiSlobodanBrojLicence() {
  const pocetniBroj = 900000 + Math.floor(Math.random() * 90000);

  for (let offset = 0; offset < 1000; offset += 1) {
    const brojLicence = pocetniBroj + offset;
    const postojeciDoktor = await prisma.doktor.findUnique({
      where: { brojLicence },
      select: { id: true },
    });

    if (!postojeciDoktor) {
      return brojLicence;
    }
  }

  throw new Error("Nije moguće generisati jedinstven broj licence za test doktora.");
}

async function kreirajDrugogDoktora() {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const brojLicence = await generisiSlobodanBrojLicence();
  const korisnik = await prisma.korisnik.create({
    data: {
      jmbg: "2222222222222",
      jmbgHash: `jmbg-hash-drugi-doktor-${suffix}`,
      ime: "Drugi",
      prezime: "Doktor",
      datumRodjenja: new Date("1982-02-02"),
      email: `drugi.doktor.${suffix}@test.com`,
      pristupnaSifra: "hash_placeholder",
      emailVerifikovan: true,
      uloga: "DOKTOR",
    },
  });

  return prisma.doktor.create({
    data: {
      idKorisnik: korisnik.id,
      idOdjela: doktorOdjelId,
      idSobe: null,
      brojLicence,
      specijalizacija: "Opca medicina",
      trajanjePregleda: 30,
    },
  });
}

describe("Medicinski profil pacijenta — integracioni testovi", () => {
  it("pacijent može sačuvati i ponovo dohvatiti medicinski profil", async () => {
    const updateRes = await request(app)
      .patch(`/api/users/${pacijentKorisnikId}/profile`)
      .set("Authorization", `Bearer ${pacijentToken}`)
      .send(medicinskiProfilPayload);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.korisnik.pacijentProfile).toMatchObject(medicinskiProfilPayload);

    const dbPacijent = await prisma.pacijent.findUnique({
      where: { id: pacijentId },
      select: {
        alergije: true,
        hronicneBolesti: true,
        krvnaGrupa: true,
        doniraKrv: true,
        imaoOperacije: true,
        operacijeOpis: true,
      },
    });

    expect(dbPacijent).toMatchObject(medicinskiProfilPayload);

    const getRes = await request(app)
      .get(`/api/users/${pacijentKorisnikId}/profile`)
      .set("Authorization", `Bearer ${pacijentToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.pacijentProfile).toMatchObject(medicinskiProfilPayload);
  });

  it("odbija nevalidnu krvnu grupu i ne mijenja postojeću vrijednost", async () => {
    await prisma.pacijent.update({
      where: { id: pacijentId },
      data: { krvnaGrupa: "O-" },
    });

    const res = await request(app)
      .patch(`/api/users/${pacijentKorisnikId}/profile`)
      .set("Authorization", `Bearer ${pacijentToken}`)
      .send({ krvnaGrupa: "X+" });

    expect(res.status).toBe(400);
    expect(res.body.errors?.[0]?.msg).toBe("Nevalidna krvna grupa");

    const dbPacijent = await prisma.pacijent.findUnique({
      where: { id: pacijentId },
      select: { krvnaGrupa: true },
    });

    expect(dbPacijent?.krvnaGrupa).toBe("O-");
  });

  it("doktor u detaljima rezervacije dobija ključne medicinske podatke pacijenta", async () => {
    await prisma.pacijent.update({
      where: { id: pacijentId },
      data: medicinskiProfilPayload,
    });
    const rezervacija = await pripremiRezervacijuZaDoktora();

    const res = await request(app)
      .get(`/api/rezervacije/doktor/${DOKTOR_ID}`)
      .set("Authorization", `Bearer ${doktorToken}`);

    expect(res.status).toBe(200);
    const rezervacijaIzOdgovora = res.body.find((r: any) => r.id === rezervacija.id);

    expect(rezervacijaIzOdgovora).toBeDefined();
    expect(rezervacijaIzOdgovora.pacijent).toMatchObject(medicinskiProfilPayload);
  });

  it("NFR-01: doktor ne može pristupiti medicinskim podacima pacijenata drugog doktora", async () => {
    const drugiDoktor = await kreirajDrugogDoktora();

    const res = await request(app)
      .get(`/api/rezervacije/doktor/${drugiDoktor.id}`)
      .set("Authorization", `Bearer ${doktorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.poruka).toBe("Nemate dozvolu za pregled rezervacija ovog doktora.");
  });
});
