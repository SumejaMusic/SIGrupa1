import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";

const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: 3 });
const prisma = new PrismaClient();

// ID-evi iz seeda
const DOKTOR_ID = 1;
const PACIJENT_KORISNIK_ID = 2; // idKorisnik pacijenta — fiksirani u setupFiles
const TERMIN_ID = 1;
const TIP_PREGLEDA_ID = 1;

describe("POST /api/rezervacije", () => {
  it("uspješno kreira rezervaciju kada postoji Redis lock", async () => {
    // Korak 1: Postavi lock (simulira da je pacijent zaključao termin)
    await redis.setex(`termin:lock:${TERMIN_ID}`, 120, String(PACIJENT_KORISNIK_ID));

    const res = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID))
      .send({
        terminId: TERMIN_ID,
        doktorId: DOKTOR_ID,
        tipPregledaId: TIP_PREGLEDA_ID,
        hitnost: false,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("termin");
    expect(res.body).toHaveProperty("doktor");

    // Lock treba biti obrisan nakon uspješne rezervacije
    const lock = await redis.get(`termin:lock:${TERMIN_ID}`);
    expect(lock).toBeNull();

    // Termin treba biti POTVRDJEN u bazi
    const termin = await prisma.termin.findUnique({ where: { id: TERMIN_ID } });
    expect(termin?.status).toBe("POTVRDJEN");
  });

  it("vraća 409 bez Redis locka", async () => {
    // Nema locka — termin nije zaključan
    const res = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID))
      .send({
        terminId: TERMIN_ID,
        doktorId: DOKTOR_ID,
        tipPregledaId: TIP_PREGLEDA_ID,
      });

    expect(res.status).toBe(409);
    expect(res.body.poruka).toContain("zaključan");
  });

  it("vraća 409 za duplikat rezervacije", async () => {
    // Kreira prvu rezervaciju
    await redis.setex(`termin:lock:${TERMIN_ID}`, 120, String(PACIJENT_KORISNIK_ID));
    await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID))
      .send({ terminId: TERMIN_ID, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    // Pokušaj iste rezervacije ponovo
    await redis.setex(`termin:lock:${TERMIN_ID}`, 120, String(PACIJENT_KORISNIK_ID));
    const res = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID))
      .send({ terminId: TERMIN_ID, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    expect(res.status).toBe(409);
    expect(res.body.poruka).toContain("već postoji");
  });
});

describe("GET /api/rezervacije/pacijent/:pacijentId", () => {
  it("vraća rezervacije za pacijenta", async () => {
    // Kreira rezervaciju
    await redis.setex(`termin:lock:${TERMIN_ID}`, 120, String(PACIJENT_KORISNIK_ID));
    await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID))
      .send({ terminId: TERMIN_ID, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    // Pacijent ID (iz pacijent tabele) je 1, ne korisnik ID
    const res = await request(app)
      .get("/api/rezervacije/pacijent/1")
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("termin");
    expect(res.body[0]).toHaveProperty("doktor");
  });

  it("vraća praznu listu za pacijenta bez rezervacija", async () => {
    const res = await request(app)
      .get("/api/rezervacije/pacijent/1")
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("PATCH /api/rezervacije/:id/otkazi/pacijent", () => {
  it("uspješno otkazuje rezervaciju > 24h unaprijed", async () => {
    // Kreira rezervaciju sa terminom daleko u budućnosti
    const buduciTermin = await prisma.termin.create({
      data: {
         id: 100, // ← dodaj ovo
        idDoktor: DOKTOR_ID,
        datum: new Date("2027-01-15"), // daleko u budućnosti
        vrijeme: 600,
        status: "SLOBODAN",
      },
    });

    await redis.setex(`termin:lock:${buduciTermin.id}`, 120, String(PACIJENT_KORISNIK_ID));
    const kreirajRes = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID))
      .send({ terminId: buduciTermin.id, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    expect(kreirajRes.status).toBe(201);
    const rezervacijaId = kreirajRes.body.id;

    const res = await request(app)
      .patch(`/api/rezervacije/${rezervacijaId}/otkazi/pacijent`)
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID));

    expect(res.status).toBe(200);
    expect(res.body.poruka).toContain("uspješno otkazana");
  });

  it("vraća 400 za otkazivanje < 24h prije termina", async () => {
    // Kreira termin koji je za nekoliko sati
    const skorasnji = await prisma.termin.create({
      data: {
        id: 101, // ← dodaj ovo
        idDoktor: DOKTOR_ID,
        datum: new Date(Date.now() + 2 * 60 * 60 * 1000), // za 2 sata
        vrijeme: 600,
        status: "SLOBODAN",
      },
    });

    await redis.setex(`termin:lock:${skorasnji.id}`, 120, String(PACIJENT_KORISNIK_ID));
    const kreirajRes = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID))
      .send({ terminId: skorasnji.id, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    const rezervacijaId = kreirajRes.body.id;

    const res = await request(app)
      .patch(`/api/rezervacije/${rezervacijaId}/otkazi/pacijent`)
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID));

    expect(res.status).toBe(400);
    expect(res.body.poruka).toContain("24 sata");
  });

  it("vraća 404 za nepostojeću rezervaciju", async () => {
    const res = await request(app)
      .patch("/api/rezervacije/99999/otkazi/pacijent")
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID));

    expect(res.status).toBe(404);
  });
});

describe("GET /api/rezervacije/doktor/:doktorId", () => {
  it("vraća sve rezervacije za doktora", async () => {
    await redis.setex(`termin:lock:${TERMIN_ID}`, 120, String(PACIJENT_KORISNIK_ID));
    await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(PACIJENT_KORISNIK_ID))
      .send({ terminId: TERMIN_ID, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    const res = await request(app).get(`/api/rezervacije/doktor/${DOKTOR_ID}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("pacijent");
    expect(res.body[0]).toHaveProperty("termin");
  });
});