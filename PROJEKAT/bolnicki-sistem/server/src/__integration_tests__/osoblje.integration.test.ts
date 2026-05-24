// osoblje.integration.test.ts — novi fajl

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import { redis } from "../lib/redis.js";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

vi.mock("../emailService.js", () => ({
  posaljiPotvrdurezerv: vi.fn().mockResolvedValue(undefined),
  posaljiOtkazivanjeRezerv: vi.fn().mockResolvedValue(undefined),
  posaljiResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
  posaljiVerifikacioniKod: vi.fn().mockResolvedValue(undefined),
}));

const DOKTOR_ID = 1;
let OSOBLJE_TOKEN: string;
let PACIJENT_KORISNIK_ID: number;

beforeAll(async () => {
  PACIJENT_KORISNIK_ID = Number(process.env.TEST_KORISNIK_ID ?? "2");
  const jwtSecret = process.env.JWT_SECRET ?? "test-secret";

  OSOBLJE_TOKEN = jwt.sign(
    { id: 99, uloga: "MEDICINSKO_OSOBLJE" },
    jwtSecret,
    { expiresIn: "1h" }
  );
});

async function obrisiTermin(id: number) {
  await prisma.historijaPregleda.deleteMany({
    where: { rezervacija: { idTermina: id } },
  });
  await prisma.rezervacije.deleteMany({ where: { idTermina: id } });
  await prisma.termin.deleteMany({ where: { id } });
  await redis.del(`termin:lock:${id}`);
}

describe("GET /api/osoblje/termini", () => {
  it("vraća dnevne termine za današnji datum", async () => {
    const res = await request(app)
      .get("/api/osoblje/termini")
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća 400 za neispravan format datuma", async () => {
    const res = await request(app)
      .get("/api/osoblje/termini")
      .query({ datum: "nije-datum" })
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`);

    expect(res.status).toBe(400);
    expect(res.body.poruka).toContain("datum");
  });

  it("vraća termine za specifičan datum", async () => {
    const res = await request(app)
      .get("/api/osoblje/termini")
      .query({ datum: "2026-06-01" })
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/osoblje/termini/pretraga", () => {
  it("vraća rezultate za validno ime", async () => {
    const res = await request(app)
      .get("/api/osoblje/termini/pretraga")
      .query({ ime: "An" })
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća 400 kada ime ima manje od 2 karaktera", async () => {
    const res = await request(app)
      .get("/api/osoblje/termini/pretraga")
      .query({ ime: "A" })
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`);

    expect(res.status).toBe(400);
    expect(res.body.poruka).toContain("2 karaktera");
  });

  it("vraća 400 kada ime nije poslano", async () => {
    const res = await request(app)
      .get("/api/osoblje/termini/pretraga")
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`);

    expect(res.status).toBe(400);
  });
});

describe("GET /api/osoblje/termini/hitni", () => {
  it("vraća listu hitnih termina", async () => {
    const res = await request(app)
      .get("/api/osoblje/termini/hitni")
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/osoblje/termini/otkazani", () => {
  it("vraća sve otkazane termine bez filtera", async () => {
    const res = await request(app)
      .get("/api/osoblje/termini/otkazani")
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("filtrira otkazane termine po datumu u DD-MM-YYYY formatu", async () => {
    const res = await request(app)
      .get("/api/osoblje/termini/otkazani")
      .query({ datum: "01-06-2026" })
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća 400 za pogrešan format datuma", async () => {
    const res = await request(app)
      .get("/api/osoblje/termini/otkazani")
      .query({ datum: "2026-06-01" })
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`);

    expect(res.status).toBe(400);
    expect(res.body.poruka).toContain("DD-MM-YYYY");
  });
});

describe("PATCH /api/osoblje/termini/:id/otkazi", () => {
  beforeEach(async () => {
    await obrisiTermin(200);
  });

  it("osoblje uspješno otkazuje termin sa potvrdom", async () => {
    const jwtSecret = process.env.JWT_SECRET ?? "test-secret";
    const pacijentToken = jwt.sign(
      { id: PACIJENT_KORISNIK_ID, uloga: "PACIJENT" },
      jwtSecret,
      { expiresIn: "1h" }
    );

    const termin = await prisma.termin.create({
      data: {
        id: 200,
        idDoktor: DOKTOR_ID,
        datum: new Date(Date.now() + 72 * 60 * 60 * 1000),
        vrijeme: 600,
        status: "SLOBODAN",
      },
    });

    await redis.setex(`termin:lock:${termin.id}`, 120, String(PACIJENT_KORISNIK_ID));
    const kreacija = await request(app)
      .post("/api/rezervacije")
      .set("Authorization", `Bearer ${pacijentToken}`)
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID))
      .send({ terminId: termin.id, doktorId: DOKTOR_ID, tipPregledaId: 1 });

    expect(kreacija.status).toBe(201);
    const rezervacijaId = kreacija.body.id;

    const res = await request(app)
      .patch(`/api/osoblje/termini/${rezervacijaId}/otkazi`)
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`)
      .send({ potvrda: true });

    expect(res.status).toBe(200);
    expect(res.body.poruka).toContain("otkazana");

    const azuriraniTermin = await prisma.termin.findUnique({ where: { id: termin.id } });
    expect(azuriraniTermin?.status).toBe("SLOBODAN");
  });

  it("vraća 400 bez potvrde — sprečavanje slučajnog otkazivanja", async () => {
    const res = await request(app)
      .patch("/api/osoblje/termini/1/otkazi")
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.poruka).toContain("potvrda");
  });

  it("vraća 404 za nepostojeću rezervaciju", async () => {
    const res = await request(app)
      .patch("/api/osoblje/termini/99999/otkazi")
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`)
      .send({ potvrda: true });

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/osoblje/termini/:id/hitnost", () => {
  beforeEach(async () => {
    await obrisiTermin(201);
  });

  it("uspješno mijenja hitnost rezervacije na true", async () => {
    const jwtSecret = process.env.JWT_SECRET ?? "test-secret";
    const pacijentToken = jwt.sign(
      { id: PACIJENT_KORISNIK_ID, uloga: "PACIJENT" },
      jwtSecret,
      { expiresIn: "1h" }
    );

    const termin = await prisma.termin.create({
      data: {
        id: 201,
        idDoktor: DOKTOR_ID,
        datum: new Date(Date.now() + 72 * 60 * 60 * 1000),
        vrijeme: 540,
        status: "SLOBODAN",
      },
    });

    await redis.setex(`termin:lock:${termin.id}`, 120, String(PACIJENT_KORISNIK_ID));
    const kreacija = await request(app)
      .post("/api/rezervacije")
      .set("Authorization", `Bearer ${pacijentToken}`)
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID))
      .send({ terminId: termin.id, doktorId: DOKTOR_ID, tipPregledaId: 1 });

    expect(kreacija.status).toBe(201);
    const rezervacijaId = kreacija.body.id;

    const res = await request(app)
      .patch(`/api/osoblje/termini/${rezervacijaId}/hitnost`)
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`)
      .send({ hitnost: true });

    expect(res.status).toBe(200);
    expect(res.body.hitnost).toBe(true);
  });

  it("vraća 400 kada hitnost nije boolean", async () => {
    const res = await request(app)
      .patch("/api/osoblje/termini/1/hitnost")
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`)
      .send({ hitnost: "true" });

    expect(res.status).toBe(400);
    expect(res.body.poruka).toContain("boolean");
  });

  it("vraća 404 za nepostojeću rezervaciju", async () => {
    const res = await request(app)
      .patch("/api/osoblje/termini/99999/hitnost")
      .set("Authorization", `Bearer ${OSOBLJE_TOKEN}`)
      .send({ hitnost: true });

    expect(res.status).toBe(404);
  });
});
// Dodaj na kraj fajla, ispred zadnjeg });
afterAll(async () => {
  await prisma.historijaPregleda.deleteMany({
    where: { rezervacija: { idTermina: { in: [200, 201] } } },
  });
  await prisma.rezervacije.deleteMany({ where: { idTermina: { in: [200, 201] } } });
  await prisma.termin.deleteMany({ where: { id: { in: [200, 201] } } });
  await prisma.$disconnect();
});