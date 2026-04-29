import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { Redis } from "ioredis";

// Pravi Redis koji gleda na test instancu
const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: 3 });

// ─────────────────────────────────────────────
// Helper: simulira middleware za autentifikaciju
// Tvoj app čita (req as any).korisnik.id iz middlewarea
// Za integracione testove mockamo middleware direktno na app nivou
// ─────────────────────────────────────────────

// NAPOMENA: Ako imaš auth middleware, trebaš ga ili:
// a) Zaobići u test modu (provjeri NODE_ENV=test u middlewareu), ili
// b) Dodati test helper koji ubacuje korisnika u request
// Korisnik ID 2 = pacijent iz seeda (idKorisnik pacijenta)

describe("GET /api/termini", () => {
  it("vraća slobodne termine za doktora", async () => {
    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: 1, datum: "2026-04-13" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const termin = res.body[0];
    expect(termin).toHaveProperty("id");
    expect(termin).toHaveProperty("vrijeme");
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
    // Zaključaj termin 1 od strane nekog drugog korisnika
    await redis.setex("termin:lock:1", 120, "999");

    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: 1, datum: "2026-04-13" });

    expect(res.status).toBe(200);
    const ids = res.body.map((t: any) => t.id);
    expect(ids).not.toContain(1); // termin 1 je zaključan
    expect(ids).toContain(2);     // termin 2 je slobodan

    await redis.del("termin:lock:1");
  });
});

describe("GET /api/termini/:id", () => {
  it("vraća termin po ID-u", async () => {
    const res = await request(app).get("/api/termini/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
    expect(res.body).toHaveProperty("doktor");
  });

  it("vraća 404 za nepostojeći termin", async () => {
    const res = await request(app).get("/api/termini/99999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("poruka");
  });
});

describe("POST /api/termini/:id/zakljucaj", () => {
  it("uspješno zaključava slobodan termin", async () => {
    // Simuliraj korisnika ID=2 kroz auth middleware
    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
      .set("x-test-korisnik-id", "2"); // vidi napomenu ispod

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");
    expect(res.body).toHaveProperty("ttl");

    // Provjeri da je lock stvarno postavljen u Redisu
    const lock = await redis.get("termin:lock:1");
    expect(lock).toBe("2");
  });

  it("vraća 409 ako je termin zaključan od drugog korisnika", async () => {
    // Zaključaj od korisnika 999
    await redis.setex("termin:lock:1", 120, "999");

    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
      .set("x-test-korisnik-id", "2");

    expect(res.status).toBe(409);
    expect(res.body.poruka).toContain("zauzet");
  });

  it("isti korisnik može osvježiti vlastiti lock", async () => {
    await redis.setex("termin:lock:1", 120, "2");

    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
      .set("x-test-korisnik-id", "2");

    expect(res.status).toBe(200);
  });
});

describe("POST /api/termini/:id/oslobodi", () => {
  it("uspješno oslobađa zaključan termin", async () => {
    await redis.setex("termin:lock:1", 120, "2");

    const res = await request(app)
      .post("/api/termini/1/oslobodi")
      .set("x-test-korisnik-id", "2");

    expect(res.status).toBe(200);

    const lock = await redis.get("termin:lock:1");
    expect(lock).toBeNull();
  });
});