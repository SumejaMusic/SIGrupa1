import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";

const PACIJENT_KORISNIK_ID = "2";
const PACIJENT_TOKEN = jwt.sign(
  { id: Number(PACIJENT_KORISNIK_ID), uloga: "PACIJENT" },
  process.env.JWT_SECRET ?? "test-secret",
  { expiresIn: "1h" }
);

describe("GET /api/termini", () => {
  it("vraća slobodne termine za doktora i datum", async () => {
    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: 1, datum: "2030-04-13" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const termin = res.body[0];
    expect(termin).toHaveProperty("id");
    expect(termin).toHaveProperty("vrijeme");
    expect(termin).toHaveProperty("doktor");
    expect(termin.status).toBe("SLOBODAN");
  });

  it("vraća praznu listu za doktora koji nema termine", async () => {
    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: 999, datum: "2030-04-13" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Kontroler više ne filtrira termine po locku — vraća ih sve s flagom zakljucan=true.
  // Test provjerava novo ponašanje: termin s lockom ima zakljucan=true, ostali zakljucan=false.
  it("označava zaključan termin kao zakljucan=true (Redis lock)", async () => {
    await redis.setex("termin:lock:1", 120, "999");

    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: 1, datum: "2030-04-13" });

    expect(res.status).toBe(200);
    const termin1 = res.body.find((t: any) => t.id === 1);
    const termin2 = res.body.find((t: any) => t.id === 2);

    expect(termin1).toBeDefined();
    expect(termin1.zakljucan).toBe(true);
    expect(termin1.zakljucaoKorisnikId).toBe(999);
    expect(termin1.preostaloSekundi).toBeGreaterThan(0);

    expect(termin2).toBeDefined();
    expect(termin2.zakljucan).toBe(false);

    await redis.del("termin:lock:1");
  });

  it("vraća termine bez filtera datuma", async () => {
    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: 1 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/termini/:id", () => {
  it("vraća termin po ID-u", async () => {
    const res = await request(app).get("/api/termini/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
    expect(res.body).toHaveProperty("doktor");
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("datum");
  });

  it("vraća 404 za nepostojeći termin", async () => {
    const res = await request(app).get("/api/termini/99999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("poruka");
  });
});

describe("POST /api/termini/:id/zakljucaj", () => {
  it("uspješno zaključava slobodan termin", async () => {
    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
      .set("Authorization", `Bearer ${PACIJENT_TOKEN}`)
      .set("x-test-korisnik-id", PACIJENT_KORISNIK_ID);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");
    expect(res.body).toHaveProperty("ttl", 120);

    const lock = await redis.get("termin:lock:1");
    // Lock vrijednost mora biti korisnik ID koji je poslao zahtjev
    expect(lock).toBe(PACIJENT_KORISNIK_ID);

    await redis.del("termin:lock:1");
  });

  it("vraća 409 ako je termin zaključan od drugog korisnika", async () => {
    await redis.setex("termin:lock:1", 120, "999");

    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
      .set("Authorization", `Bearer ${PACIJENT_TOKEN}`)
      .set("x-test-korisnik-id", PACIJENT_KORISNIK_ID);

    expect(res.status).toBe(409);
    expect(res.body.poruka).toContain("zauzet");

    await redis.del("termin:lock:1");
  });

  it("isti korisnik može osvježiti vlastiti lock (idempotentno)", async () => {
    // Lock postavljen na isti ID koji će biti u headeru
    await redis.setex("termin:lock:1", 60, PACIJENT_KORISNIK_ID);

    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
      .set("Authorization", `Bearer ${PACIJENT_TOKEN}`)
      .set("x-test-korisnik-id", PACIJENT_KORISNIK_ID);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ttl", 120);

    await redis.del("termin:lock:1");
  });
});

describe("POST /api/termini/:id/oslobodi", () => {
  it("uspješno oslobađa zaključan termin", async () => {
    await redis.setex("termin:lock:1", 120, PACIJENT_KORISNIK_ID);

    const res = await request(app)
      .post("/api/termini/1/oslobodi")
      .set("Authorization", `Bearer ${PACIJENT_TOKEN}`)
      .set("x-test-korisnik-id", PACIJENT_KORISNIK_ID);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");

    const lock = await redis.get("termin:lock:1");
    expect(lock).toBeNull();
  });

  it("oslobađanje već slobodnog termina vraća 200 (idempotentno)", async () => {
    const res = await request(app)
      .post("/api/termini/1/oslobodi")
      .set("Authorization", `Bearer ${PACIJENT_TOKEN}`)
      .set("x-test-korisnik-id", PACIJENT_KORISNIK_ID);

    expect(res.status).toBe(200);
  });
});
