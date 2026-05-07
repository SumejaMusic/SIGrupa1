import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { redis } from "../lib/redis.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DOKTOR_ID = 1;
const TERMIN_ID = 1;
const TIP_PREGLEDA_ID = 1;

let STVARNI_KORISNIK_ID: number;
let STVARNI_PACIJENT_ID: number;

beforeAll(async () => {
  STVARNI_KORISNIK_ID = 2;
  STVARNI_PACIJENT_ID = 1;
});

afterAll(async () => {
  await prisma.$disconnect();
});



async function kreirajRezervacijuHelper(terminId = TERMIN_ID) {
  await resetujTermin(terminId);
  await redis.setex(`termin:lock:${terminId}`, 120, String(STVARNI_KORISNIK_ID));
  const res = await request(app)
    .post("/api/rezervacije")
    .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
    .send({
      terminId,
      doktorId: DOKTOR_ID,
      tipPregledaId: TIP_PREGLEDA_ID,
      hitnost: false,
    });
  return res;
}

async function obrisiCustomTermin(id: number) {
  await prisma.historijaPregleda.deleteMany({
    where: { rezervacija: { idTermina: id } },
  });
  await prisma.rezervacije.deleteMany({ where: { idTermina: id } });
  await prisma.termin.deleteMany({ where: { id } });
  await redis.del(`termin:lock:${id}`);
}

describe("POST /api/rezervacije", () => {
  beforeEach(async () => {
    await resetujTermin(TERMIN_ID);
  });

  it("uspješno kreira rezervaciju kada postoji Redis lock", async () => {
    await redis.setex(`termin:lock:${TERMIN_ID}`, 120, String(STVARNI_KORISNIK_ID));

    const res = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
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

    const lock = await redis.get(`termin:lock:${TERMIN_ID}`);
    expect(lock).toBeNull();

    const termin = await prisma.termin.findUnique({ where: { id: TERMIN_ID } });
    expect(termin?.status).toBe("ZAKAZAN");
  });

  it("vraća 409 bez Redis locka", async () => {
    const res = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
      .send({
        terminId: TERMIN_ID,
        doktorId: DOKTOR_ID,
        tipPregledaId: TIP_PREGLEDA_ID,
      });

    expect(res.status).toBe(409);
    expect(res.body.poruka).toContain("zaključan");
  });

  it("vraća 409 za duplikat rezervacije", async () => {
    const prvaRes = await kreirajRezervacijuHelper();
    expect(prvaRes.status).toBe(201);

    await prisma.termin.update({
      where: { id: TERMIN_ID },
      data: { status: "SLOBODAN" },
    });

    await redis.setex(`termin:lock:${TERMIN_ID}`, 120, String(STVARNI_KORISNIK_ID));
    const res = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
      .send({ terminId: TERMIN_ID, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    expect(res.status).toBe(409);
    expect(res.body.poruka).toContain("već postoji");
  });

  it("vraća 409 ako je termin zauzet (status != SLOBODAN)", async () => {
    await prisma.termin.update({
      where: { id: TERMIN_ID },
      data: { status: "ZAKAZAN" },
    });

    await redis.setex(`termin:lock:${TERMIN_ID}`, 120, String(STVARNI_KORISNIK_ID));
    const res = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
      .send({ terminId: TERMIN_ID, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    expect(res.status).toBe(409);
    expect(res.body.poruka).toContain("slobodan");
  });

  it("vraća 400 za nedostajuće podatke", async () => {
    const res = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
      .send({ doktorId: DOKTOR_ID });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it("vraća 400 ako termin ne pripada doktoru", async () => {
    await redis.setex(`termin:lock:${TERMIN_ID}`, 120, String(STVARNI_KORISNIK_ID));

    const res = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
      .send({
        terminId: TERMIN_ID,
        doktorId: 999,
        tipPregledaId: TIP_PREGLEDA_ID,
      });

    expect(res.status).toBe(400);
    expect(res.body.poruka).toContain("ne pripada");
  });
  it("vraća 400 ako pacijent pokuša rezervisati termin koji je već prošao — US-32", async () => {
    // Kreiramo termin koji je bio juče
    const juce = new Date();
    juce.setDate(juce.getDate() - 1);
    
    const PROSLI_TERMIN_ID = 200;
    await obrisiCustomTermin(PROSLI_TERMIN_ID); // Čišćenje ako postoji od ranije

    await prisma.termin.create({
      data: {
        id: PROSLI_TERMIN_ID,
        idDoktor: DOKTOR_ID,
        datum: juce,
        vrijeme: 600,
        status: "SLOBODAN",
      },
    });

    await redis.setex(`termin:lock:${PROSLI_TERMIN_ID}`, 120, String(STVARNI_KORISNIK_ID));

    const res = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
      .send({
        terminId: PROSLI_TERMIN_ID,
        doktorId: DOKTOR_ID,
        tipPregledaId: TIP_PREGLEDA_ID,
      });

    expect(res.status).toBe(400);
    expect(res.body.poruka).toContain("prošlosti");

    // Čišćenje nakon testa
    await obrisiCustomTermin(PROSLI_TERMIN_ID);
  });
});

describe("GET /api/rezervacije/moje", () => {
  beforeEach(async () => {
    await resetujTermin(TERMIN_ID);
  });

  it("vraća rezervacije ulogovanog pacijenta", async () => {
    const kreacija = await kreirajRezervacijuHelper();
    expect(kreacija.status).toBe(201);

    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("termin");
    expect(res.body[0]).toHaveProperty("doktor");
  });

  it("vraća praznu listu za pacijenta bez aktivnih rezervacija", async () => {
    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /api/rezervacije/doktor/:doktorId", () => {
  beforeEach(async () => {
    await resetujTermin(TERMIN_ID);
  });

  it("vraća sve rezervacije za doktora", async () => {
    const kreacija = await kreirajRezervacijuHelper();
    expect(kreacija.status).toBe(201);

    const res = await request(app).get(`/api/rezervacije/doktor/${DOKTOR_ID}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("pacijent");
    expect(res.body[0]).toHaveProperty("termin");
  });

  it("vraća praznu listu za doktora bez rezervacija", async () => {
    const res = await request(app).get("/api/rezervacije/doktor/99999");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("PATCH /api/rezervacije/:id/otkazi/pacijent", () => {
  beforeEach(async () => {
    await obrisiCustomTermin(100);
    await obrisiCustomTermin(101);
    await obrisiCustomTermin(102);
  });

  it("uspješno otkazuje rezervaciju > 24h unaprijed", async () => {
    const buduciTermin = await prisma.termin.create({
      data: {
        id: 100,
        idDoktor: DOKTOR_ID,
        datum: new Date("2027-01-15"),
        vrijeme: 600,
        status: "SLOBODAN",
      },
    });

    await redis.setex(`termin:lock:${buduciTermin.id}`, 120, String(STVARNI_KORISNIK_ID));
    const kreirajRes = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
      .send({ terminId: buduciTermin.id, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    expect(kreirajRes.status).toBe(201);
    const rezervacijaId = kreirajRes.body.id;

    const res = await request(app)
      .patch(`/api/rezervacije/${rezervacijaId}/otkazi/pacijent`)
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID));

    expect(res.status).toBe(200);
    expect(res.body.poruka).toContain("uspješno otkazana");

    const termin = await prisma.termin.findUnique({ where: { id: buduciTermin.id } });
    expect(termin?.status).toBe("SLOBODAN");
  });

  it("vraća 400 za otkazivanje < 24h prije termina", async () => {
    const skorasnji = await prisma.termin.create({
      data: {
        id: 101,
        idDoktor: DOKTOR_ID,
        datum: new Date(Date.now() + 2 * 60 * 60 * 1000),
        vrijeme: 600,
        status: "SLOBODAN",
      },
    });

    await redis.setex(`termin:lock:${skorasnji.id}`, 120, String(STVARNI_KORISNIK_ID));
    const kreirajRes = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
      .send({ terminId: skorasnji.id, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    expect(kreirajRes.status).toBe(201);
    const rezervacijaId = kreirajRes.body.id;

    const res = await request(app)
      .patch(`/api/rezervacije/${rezervacijaId}/otkazi/pacijent`)
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID));

    expect(res.status).toBe(400);
    expect(res.body.poruka).toContain("24 sata");
  });

  it("vraća 403 ako pacijent pokušava otkazati tuđu rezervaciju", async () => {
    const buduciTermin = await prisma.termin.create({
      data: {
        id: 102,
        idDoktor: DOKTOR_ID,
        datum: new Date("2027-06-01"),
        vrijeme: 600,
        status: "SLOBODAN",
      },
    });

    await redis.setex(`termin:lock:${buduciTermin.id}`, 120, String(STVARNI_KORISNIK_ID));
    const kreirajRes = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
      .send({ terminId: buduciTermin.id, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    expect(kreirajRes.status).toBe(201);
    const rezervacijaId = kreirajRes.body.id;

    const drugiPacijent = await prisma.pacijent.findFirst({
      where: { id: { not: STVARNI_PACIJENT_ID } },
    });

    if (drugiPacijent) {
      await prisma.rezervacije.update({
        where: { id: rezervacijaId },
        data: { idPacijent: drugiPacijent.id },
      });

      const res = await request(app)
        .patch(`/api/rezervacije/${rezervacijaId}/otkazi/pacijent`)
        .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID));

      expect(res.status).toBe(403);
      expect(res.body.poruka).toContain("dozvolu");
    } else {
      console.warn("Preskačem 403 test: nema drugog pacijenta u bazi.");
    }
  });

  it("vraća 404 za nepostojeću rezervaciju", async () => {
    const res = await request(app)
      .patch("/api/rezervacije/99999/otkazi/pacijent")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID));

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/rezervacije/:id/otkazi/osoblje", () => {
  beforeEach(async () => {
    await obrisiCustomTermin(103);
  });

  it("osoblje može otkazati bilo koju rezervaciju bez vremenskog ograničenja", async () => {
    const skorasnji = await prisma.termin.create({
      data: {
        id: 103,
        idDoktor: DOKTOR_ID,
        datum: new Date(Date.now() + 2 * 60 * 60 * 1000),
        vrijeme: 600,
        status: "SLOBODAN",
      },
    });

    await redis.setex(`termin:lock:${skorasnji.id}`, 120, String(STVARNI_KORISNIK_ID));
    const kreirajRes = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
      .send({ terminId: skorasnji.id, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    expect(kreirajRes.status).toBe(201);
    const rezervacijaId = kreirajRes.body.id;

    const res = await request(app)
      .patch(`/api/rezervacije/${rezervacijaId}/otkazi/osoblje`);

    expect(res.status).toBe(200);
    expect(res.body.poruka).toContain("osoblja");

    const termin = await prisma.termin.findUnique({ where: { id: skorasnji.id } });
    expect(termin?.status).toBe("SLOBODAN");
  });

  it("vraća 404 za nepostojeću rezervaciju", async () => {
    const res = await request(app)
      .patch("/api/rezervacije/99999/otkazi/osoblje");

    expect(res.status).toBe(404);
  });
  it("uspješno otkazuje rezervaciju i postavlja flag doktorOtkazao — US-28", async () => {
    const terminId = 104;
    await obrisiCustomTermin(terminId);
    const sutra = new Date();
    sutra.setDate(sutra.getDate() + 1);

    const skorasnji = await prisma.termin.create({
      data: {
        id: terminId,
        idDoktor: DOKTOR_ID,
        datum: sutra,
        vrijeme: 700,
        status: "SLOBODAN",
      },
    });

    await redis.setex(`termin:lock:${terminId}`, 120, String(STVARNI_KORISNIK_ID));
    const kreirajRes = await request(app)
      .post("/api/rezervacije")
      .set("x-test-korisnik-id", String(STVARNI_KORISNIK_ID))
      .send({ terminId: terminId, doktorId: DOKTOR_ID, tipPregledaId: TIP_PREGLEDA_ID });

    const rezervacijaId = kreirajRes.body.id;

    const res = await request(app)
      .patch(`/api/rezervacije/${rezervacijaId}/otkazi/osoblje`);

    expect(res.status).toBe(200);

    // INTEGRACIJSKI DIO: Provjera baze podataka
    const provjeraUBazi = await prisma.rezervacije.findUnique({
      where: { id: rezervacijaId }
    });

    expect(provjeraUBazi?.doktorOtkazao).toBe(true);
    expect(provjeraUBazi?.datumOtkazivanja).not.toBeNull();
    
    const termin = await prisma.termin.findUnique({ where: { id: terminId } });
    expect(termin?.status).toBe("SLOBODAN");

    await obrisiCustomTermin(terminId);
  });
});

async function resetujTermin(terminId = TERMIN_ID) {
  // 1. Brišemo historiju i rezervacije za taj termin (čišćenje baze)
  await prisma.historijaPregleda.deleteMany({
    where: { rezervacija: { idTermina: terminId } },
  });
  await prisma.rezervacije.deleteMany({ where: { idTermina: terminId } });

  // 2. Postavljamo datum na SUTRA (da prođe US-32 validaciju)
  const sutra = new Date();
  sutra.setDate(sutra.getDate() + 1);

  // 3. Resetujemo status termina u bazi
  await prisma.termin.update({
    where: { id: terminId },
    data: { 
      status: "SLOBODAN",
      datum: sutra 
    },
  });

  // 4. Brišemo lock iz Redisa za taj termin
  await redis.del(`termin:lock:${terminId}`);
}
