import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { redis } from "../lib/redis.js";

const PACIJENT_KORISNIK_ID = "2";

describe("GET /api/termini", () => {
  it("vraća slobodne termine za doktora i datum", async () => {
    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: 1, datum: "2026-04-13" });

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
      .query({ doktorId: 999, datum: "2026-04-13" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("ne vraća zaključane termine (Redis lock)", async () => {
    await redis.setex("termin:lock:1", 120, "999");

    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: 1, datum: "2026-04-13" });

    expect(res.status).toBe(200);
    const ids = res.body.map((t: any) => t.id);
    expect(ids).not.toContain(1);
    expect(ids).toContain(2);

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
      .set("x-test-korisnik-id", PACIJENT_KORISNIK_ID);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");
    expect(res.body).toHaveProperty("ttl", 120);

    const lock = await redis.get("termin:lock:1");
    expect(lock).toBe(PACIJENT_KORISNIK_ID);

    await redis.del("termin:lock:1");
  });

  it("vraća 409 ako je termin zaključan od drugog korisnika", async () => {
    await redis.setex("termin:lock:1", 120, "999");

    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
      .set("x-test-korisnik-id", PACIJENT_KORISNIK_ID);

    expect(res.status).toBe(409);
    expect(res.body.poruka).toContain("zauzet");

    await redis.del("termin:lock:1");
  });

  it("isti korisnik može osvježiti vlastiti lock (idempotentno)", async () => {
    await redis.setex("termin:lock:1", 120, PACIJENT_KORISNIK_ID);

    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
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
      .set("x-test-korisnik-id", PACIJENT_KORISNIK_ID);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");

    const lock = await redis.get("termin:lock:1");
    expect(lock).toBeNull();
  });

  it("oslobađanje već slobodnog termina vraća 200 (idempotentno)", async () => {
    const res = await request(app)
      .post("/api/termini/1/oslobodi")
      .set("x-test-korisnik-id", PACIJENT_KORISNIK_ID);

    expect(res.status).toBe(200);
  });
});