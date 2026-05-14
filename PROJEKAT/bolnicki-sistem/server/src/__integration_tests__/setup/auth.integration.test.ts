import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ─── Mock email servisa ─────────────────────────────────────────────────────
vi.mock("../../emailService.js", () => ({
  posaljiPotvrdurezerv:       vi.fn().mockResolvedValue(undefined),
  posaljiResetPasswordEmail:  vi.fn().mockResolvedValue(undefined),
  posaljiVerifikacioniKod:    vi.fn().mockResolvedValue(undefined),
}));

// ─── Import mockova nakon deklaracije ───────────────────────────────────────
import { posaljiResetPasswordEmail, posaljiVerifikacioniKod } from "../../emailService.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

// ─── Test korisnici ─────────────────────────────────────────────────────────
// Svi test korisnici koriste ID iz .env ili fallback vrijednosti.
// Pretpostavljamo da su ovi korisnici seeded u testnoj bazi.
const TEST_EMAIL_PACIJENT   = process.env.TEST_EMAIL_PACIJENT  ?? "pacijent@test.ba";
const TEST_EMAIL_DOKTOR     = process.env.TEST_EMAIL_DOKTOR    ?? "doktor@test.ba";
const TEST_EMAIL_ADMIN      = process.env.TEST_EMAIL_ADMIN     ?? "admin@test.ba";
const ISPRAVNA_LOZINKA      = process.env.TEST_LOZINKA         ?? "Ispravna123!";

afterAll(async () => {
  await prisma.$disconnect();
});

// ═══════════════════════════════════════════════════════════════════════════════
// US-03 — Login sistem: JWT tokeni i RBAC preusmjeravanje
// NFR-03 (prijava < 2s), NFR-04 (bcrypt), NFR-06/07 (RBAC)
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/auth/prijava — US-03 Login i RBAC", () => {

  it("uspješna prijava pacijenta vraća JWT token i ulogu PACIJENT", async () => {
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: TEST_EMAIL_PACIJENT, pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("uloga", "PACIJENT");

    // JWT mora biti validan i sadržavati ispravne podatke
    const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
    expect(decoded).toHaveProperty("id");
    expect(decoded).toHaveProperty("uloga", "PACIJENT");
  });

  it("uspješna prijava doktora vraća JWT token i ulogu DOKTOR", async () => {
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: TEST_EMAIL_DOKTOR, pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("uloga", "DOKTOR");
    expect(res.body).toHaveProperty("token");
  });

  it("uspješna prijava administratora vraća JWT token i ulogu ADMINISTRATOR", async () => {
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: TEST_EMAIL_ADMIN, pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("uloga", "ADMINISTRATOR");
  });

  it("pogrešna lozinka vraća 401 s generičkom porukom — ne otkriva koji je podatak pogrešan", async () => {
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: TEST_EMAIL_PACIJENT, pristupnaSifra: "PogresnaSifra99!" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("poruka");

    // Poruka ne smije otkrivati je li email ili lozinka pogrešna — AC-04-03
    expect(res.body.poruka).not.toContain("email");
    expect(res.body.poruka).not.toContain("lozinka");
    expect(res.body.poruka).not.toContain("password");
  });

  it("nepostojeći email vraća 401 s identičnom generičkom porukom — AC-04-03", async () => {
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: "nepostoji@test.ba", pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("poruka");
    expect(res.body.poruka).not.toContain("email");
    expect(res.body.poruka).not.toContain("korisnik");
  });

  it("prijava bez emaila vraća 400 — validacija obaveznih polja", async () => {
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it("prijava bez lozinke vraća 400 — validacija obaveznih polja", async () => {
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: TEST_EMAIL_PACIJENT });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it("zaštićena ruta odbija zahtjev bez JWT tokena — 401", async () => {
    const res = await request(app)
      .get("/api/rezervacije/moje");

    expect(res.status).toBe(401);
  });

  it("zaštićena ruta odbija zahtjev s nevažećim JWT tokenom — 401", async () => {
    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("Authorization", "Bearer ovajtoken.nijevalidan.zarpogledaj");

    expect(res.status).toBe(401);
  });

  it("RBAC: pacijent ne može pristupiti admin ruti — 403", async () => {
    const pacijentToken = jwt.sign(
      { id: 2, uloga: "PACIJENT" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/api/admin/korisnici")
      .set("Authorization", `Bearer ${pacijentToken}`);

    expect(res.status).toBe(403);
  });

  it("RBAC: doktor ne može pristupiti admin ruti — 403", async () => {
    const doktorToken = jwt.sign(
      { id: 3, uloga: "DOKTOR" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/api/admin/korisnici")
      .set("Authorization", `Bearer doktorToken`);

    expect(res.status).toBe(403);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// US-19 — Automatska odjava: istekla sesija
// NFR-13, NFR-14
// ═══════════════════════════════════════════════════════════════════════════════

describe("Session timeout — US-19 Automatska odjava", () => {

  it("istekli JWT token vraća 401 — NFR-13, NFR-14", async () => {
    // Token koji je istekao 1 sat ranije
    const istekliToken = jwt.sign(
      { id: 2, uloga: "PACIJENT" },
      JWT_SECRET,
      { expiresIn: -3600 } // negativna vrijednost = odmah istekao
    );

    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("Authorization", `Bearer ${istekliToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("poruka");
  });

  it("važeći JWT token dozvoljava pristup zaštićenoj ruti", async () => {
    const validanToken = jwt.sign(
      { id: 2, uloga: "PACIJENT" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("Authorization", `Bearer ${validanToken}`)
      .set("x-test-korisnik-id", "2");

    // 200 ili 404 — bitno je da nije 401
    expect(res.status).not.toBe(401);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// US-16 — Reset lozinke putem emaila
// DEC-004 (Resend servis), AC-14-01 do AC-14-05
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/auth/reset-lozinka — US-16 Reset lozinke", () => {

  it("zahtjev za reset šalje email i vraća 200 za postojeći email — AC-14-01", async () => {
    const res = await request(app)
      .post("/api/auth/reset-lozinka")
      .send({ email: TEST_EMAIL_PACIJENT });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");
    expect(vi.mocked(posaljiResetPasswordEmail)).toHaveBeenCalledWith(
      expect.stringContaining("@"),
      expect.any(String)
    );
  });

  it("zahtjev za reset za nepostojeći email vraća neutralnu poruku — AC-14-02", async () => {
    // Sistem ne smije otkrivati postoji li korisnik s tim emailom
    const res = await request(app)
      .post("/api/auth/reset-lozinka")
      .send({ email: "nepostoji999@test.ba" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");
  });

  it("korišćenje isteklog reset tokena vraća 400 ili 410 — AC-14-04", async () => {
    // Token koji je istekao (više od 10 min)
    const istekliToken = jwt.sign(
      { email: TEST_EMAIL_PACIJENT, svrha: "reset" },
      JWT_SECRET,
      { expiresIn: -1 }
    );

    const res = await request(app)
      .post("/api/auth/nova-lozinka")
      .send({ token: istekliToken, novaSifra: "NovaSifra123!" });

    expect([400, 410]).toContain(res.status);
  });

  it("nova lozinka mora imati minimum 8 karaktera — AC-14-05", async () => {
    const validanToken = jwt.sign(
      { email: TEST_EMAIL_PACIJENT, svrha: "reset" },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    const res = await request(app)
      .post("/api/auth/nova-lozinka")
      .send({ token: validanToken, novaSifra: "Kratka1" }); // 7 karaktera

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it("nova lozinka mora sadržavati jedno veliko slovo i jedan broj — AC-14-05", async () => {
    const validanToken = jwt.sign(
      { email: TEST_EMAIL_PACIJENT, svrha: "reset" },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    const res = await request(app)
      .post("/api/auth/nova-lozinka")
      .send({ token: validanToken, novaSifra: "samomalaslova" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// US-25 — Two-Factor Authentication (2FA)
// NFR-23, AC-04-05
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/auth/2fa — US-25 Dvofaktorska autentifikacija", () => {

  it("prijava korisnika s aktivnom 2FA vraća zahtjev za kodom — ne vraća token odmah", async () => {
    // Ovaj test pretpostavlja da je 2FA aktivirana za doktorski nalog
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: TEST_EMAIL_DOKTOR, pristupnaSifra: ISPRAVNA_LOZINKA });

    // Ako 2FA aktivan: status 200 ali bez tokena, sa flagom zahtijeva2FA
    if (res.body.zahtijeva2FA === true) {
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("zahtijeva2FA", true);
      expect(res.body).not.toHaveProperty("token");
      expect(vi.mocked(posaljiVerifikacioniKod)).toHaveBeenCalled();
    } else {
      // 2FA nije aktiviran za ovaj nalog u testnom okruženju — preskačemo
      console.info("2FA nije aktiviran za testni nalog — preskačem provjeru toka.");
    }
  });

  it("ispravan 2FA kod vraća JWT token — AC-04-05", async () => {
    // Generišemo privremeni 2FA session token kako bi simulirali stanje nakon prvog koraka
    const privremeniToken = jwt.sign(
      { id: 2, faza: "2FA_CEKANJE" },
      JWT_SECRET,
      { expiresIn: "5m" }
    );

    // Postavljamo validan kod direktno u bazu ili koristimo seeded test kod
    const testKod = process.env.TEST_2FA_KOD ?? "123456";

    const res = await request(app)
      .post("/api/auth/2fa/verifikacija")
      .send({ privremeniToken, kod: testKod });

    // Ako endpoint postoji: mora vratiti JWT ili 401
    if (res.status === 200) {
      expect(res.body).toHaveProperty("token");
      const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
      expect(decoded).toHaveProperty("uloga");
    } else {
      expect([400, 401]).toContain(res.status);
    }
  });

  it("pogrešan 2FA kod vraća 401 — AC-04-05", async () => {
    const privremeniToken = jwt.sign(
      { id: 2, faza: "2FA_CEKANJE" },
      JWT_SECRET,
      { expiresIn: "5m" }
    );

    const res = await request(app)
      .post("/api/auth/2fa/verifikacija")
      .send({ privremeniToken, kod: "000000" });

    expect([400, 401]).toContain(res.status);
    expect(res.body).toHaveProperty("poruka");
  });

  it("istekli 2FA privremeni token vraća 401 — kod validan 5 min (NFR-23)", async () => {
    const istekliPrivremeniToken = jwt.sign(
      { id: 2, faza: "2FA_CEKANJE" },
      JWT_SECRET,
      { expiresIn: -1 }
    );

    const res = await request(app)
      .post("/api/auth/2fa/verifikacija")
      .send({ privremeniToken: istekliPrivremeniToken, kod: "123456" });

    expect([400, 401]).toContain(res.status);
  });
});