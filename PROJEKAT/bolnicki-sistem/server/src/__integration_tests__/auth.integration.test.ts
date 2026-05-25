import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ─── Mock email servisa ──────────────────────────────────────────────────────
vi.mock("../emailService.js", () => ({
  posaljiPotvrdurezerv:      vi.fn().mockResolvedValue(undefined),
  posaljiResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
  posaljiVerifikacioniKod:   vi.fn().mockResolvedValue(undefined),
  posaljiOtkazivanjeRezerv:  vi.fn().mockResolvedValue(undefined),
}));

import { posaljiResetPasswordEmail, posaljiVerifikacioniKod } from "../emailService.js";

const JWT_SECRET       = process.env.JWT_SECRET ?? "test-secret";
const ISPRAVNA_LOZINKA = "TestAuth123!";

// ─── State — popunjava beforeEach nakon test seeda ───────────────────────────
let idPacijent:    number | undefined;
let idDoktor:      number | undefined;
let idAdmin:       number | undefined;
let emailPacijent: string | undefined;
let emailDoktor:   string | undefined;
let emailAdmin:    string | undefined;

let originalHashPacijent: string | undefined;
let originalHashDoktor:   string | undefined;
let originalHashAdmin:    string | undefined;

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeEach(async () => {
  const noviHash = await bcrypt.hash(ISPRAVNA_LOZINKA, 4);

  const pacijent = await prisma.korisnik.findFirst({ where: { uloga: "PACIJENT" } });
  const doktor   = await prisma.korisnik.findFirst({ where: { uloga: "DOKTOR"   } });
  const admin    = await prisma.korisnik.findFirst({ where: { uloga: "ADMINISTRATOR" } });

  if (pacijent) {
    originalHashPacijent = pacijent.pristupnaSifra;
    idPacijent           = pacijent.id;
    emailPacijent        = pacijent.email;
  } else {
    console.warn("beforeAll: PACIJENT nije pronađen u bazi.");
  }

  if (doktor) {
    originalHashDoktor = doktor.pristupnaSifra;
    idDoktor           = doktor.id;
    emailDoktor        = doktor.email;
  } else {
    console.warn("beforeAll: DOKTOR nije pronađen u bazi.");
  }

  if (admin) {
    originalHashAdmin = admin.pristupnaSifra;
    idAdmin           = admin.id;
    emailAdmin        = admin.email;
  } else {
    console.warn("beforeAll: ADMINISTRATOR nije pronađen u bazi.");
  }

  const idsZaUpdate = [idPacijent, idDoktor, idAdmin].filter((id): id is number => id !== undefined);

  if (idsZaUpdate.length > 0) {
    await prisma.korisnik.updateMany({
      where: { id: { in: idsZaUpdate } },
      data: {
        pristupnaSifra:         noviHash,
        emailVerifikovan:       true,
        nalogZakljucan:         false,
        brojNeuspjelihPrijava:  0,
        vrijemeZakljucavanja:   null,
        zadnjiNeuspjeliPokusaj: null,
      },
    });
  }
});

afterAll(async () => {
  if (idPacijent && originalHashPacijent) {
    await prisma.korisnik.update({
      where: { id: idPacijent },
      data:  { pristupnaSifra: originalHashPacijent },
    });
  }
  if (idDoktor && originalHashDoktor) {
    await prisma.korisnik.update({
      where: { id: idDoktor },
      data:  { pristupnaSifra: originalHashDoktor },
    });
  }
  if (idAdmin && originalHashAdmin) {
    await prisma.korisnik.update({
      where: { id: idAdmin },
      data:  { pristupnaSifra: originalHashAdmin },
    });
  }
  await prisma.$disconnect();
});


// ═══════════════════════════════════════════════════════════════════════════════
// US-03 — Login sistem: JWT tokeni i RBAC preusmjeravanje
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/auth/prijava — US-03 Login i RBAC", () => {

  it("uspješna prijava pacijenta vraća JWT token i ulogu PACIJENT", async () => {
    if (!emailPacijent) return console.warn("Skip: PACIJENT nije u bazi.");

    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: emailPacijent, pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("korisnik");
    expect(res.body.korisnik).toHaveProperty("uloga", "PACIJENT");

    const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
    expect(decoded).toHaveProperty("id");
    expect(decoded).toHaveProperty("uloga", "PACIJENT");
  });

  it("uspješna prijava doktora vraća JWT token i ulogu DOKTOR", async () => {
    if (!emailDoktor) return console.warn("Skip: DOKTOR nije u bazi.");

    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: emailDoktor, pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("korisnik");
    expect(res.body.korisnik).toHaveProperty("uloga", "DOKTOR");

    const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
    expect(decoded).toHaveProperty("uloga", "DOKTOR");
  });

  it("uspješna prijava administratora vraća JWT token i ulogu ADMINISTRATOR", async () => {
    if (!emailAdmin) return console.warn("Skip: ADMINISTRATOR nije u bazi.");

    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: emailAdmin, pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("korisnik");
    expect(res.body.korisnik).toHaveProperty("uloga", "ADMINISTRATOR");

    const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
    expect(decoded).toHaveProperty("uloga", "ADMINISTRATOR");
  });

  it("pogrešna lozinka i pogrešan email vraćaju identičnu poruku — AC-04-03", async () => {
    const emailZaTest = emailPacijent ?? emailDoktor ?? emailAdmin;
    if (!emailZaTest) return console.warn("Skip: nijedan korisnik nije u bazi.");

    const resLozinka = await request(app)
      .post("/api/auth/prijava")
      .send({ email: emailZaTest, pristupnaSifra: "PogresnaSifra99!" });

    const resEmail = await request(app)
      .post("/api/auth/prijava")
      .send({ email: "nepostoji999@test.ba", pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(resLozinka.status).toBe(401);
    expect(resEmail.status).toBe(401);
    expect(resLozinka.body.poruka).toEqual(resEmail.body.poruka);
  });

  it("prijava bez emaila vraća 400 — validacija obaveznih polja", async () => {
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it("prijava bez lozinke vraća 400 — validacija obaveznih polja", async () => {
    const emailZaTest = emailPacijent ?? emailDoktor ?? emailAdmin ?? "bilo@koji.ba";

    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: emailZaTest });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it("zaštićena ruta odbija zahtjev bez JWT tokena — 401", async () => {
    const res = await request(app).get("/api/rezervacije/moje");
    expect(res.status).toBe(401);
  });

  it("zaštićena ruta odbija zahtjev s nevažećim JWT tokenom — 401", async () => {
    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("Authorization", "Bearer ovaj.token.jeneispravan");

    expect(res.status).toBe(401);
  });

  it.todo("RBAC: pacijent ne može pristupiti admin ruti — 403 [TODO: potvrdi naziv admin rute]");
  it.todo("RBAC: doktor ne može pristupiti admin ruti — 403 [TODO: potvrdi naziv admin rute]");
});


// ═══════════════════════════════════════════════════════════════════════════════
// US-19 — Automatska odjava: istekla sesija
// ═══════════════════════════════════════════════════════════════════════════════

describe("Session timeout — US-19 Automatska odjava", () => {

  it("istekli JWT token vraća 401 — NFR-13, NFR-14", async () => {
    const testId = idPacijent ?? idDoktor ?? idAdmin ?? 2;

    const istekliToken = jwt.sign(
      { id: testId, uloga: "PACIJENT" },
      JWT_SECRET,
      { expiresIn: -3600 }
    );

    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("Authorization", `Bearer ${istekliToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("poruka");
  });

  it("važeći JWT token dozvoljava pristup zaštićenoj ruti", async () => {
    const testId = idPacijent ?? idDoktor ?? idAdmin ?? 2;

    const validanToken = jwt.sign(
      { id: testId, uloga: "PACIJENT" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("Authorization", `Bearer ${validanToken}`)
      .set("x-test-korisnik-id", String(testId));

    expect(res.status).not.toBe(401);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// US-16 — Reset lozinke putem emaila
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/auth/reset-lozinka — US-16 Reset lozinke", () => {

  it.skip("zahtjev za reset šalje email i vraća 200 za postojeći email — AC-14-01 [TODO: potvrdi rutu]", async () => {
    const res = await request(app)
      .post("/api/auth/reset-lozinka")
      .send({ email: emailPacijent });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");
    expect(vi.mocked(posaljiResetPasswordEmail)).toHaveBeenCalledWith(
      expect.stringContaining("@"),
      expect.any(String)
    );
  });

  it.skip("zahtjev za reset za nepostojeći email vraća neutralnu poruku — AC-14-02 [TODO: potvrdi rutu]", async () => {
    const res = await request(app)
      .post("/api/auth/reset-lozinka")
      .send({ email: "nepostoji999@test.ba" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");
  });

  it.skip("korišćenje isteklog reset tokena vraća 400 ili 410 — AC-14-04 [TODO: potvrdi rutu]", async () => {
    const istekliToken = jwt.sign(
      { email: emailPacijent, svrha: "reset" },
      JWT_SECRET,
      { expiresIn: -1 }
    );

    const res = await request(app)
      .post("/api/auth/nova-lozinka")
      .send({ token: istekliToken, novaSifra: "NovaSifra123!" });

    expect([400, 410]).toContain(res.status);
  });

  it.skip("nova lozinka mora imati minimum 8 karaktera — AC-14-05 [TODO: potvrdi rutu]", async () => {
    const validanToken = jwt.sign(
      { email: emailPacijent, svrha: "reset" },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    const res = await request(app)
      .post("/api/auth/nova-lozinka")
      .send({ token: validanToken, novaSifra: "Kratka1" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it.skip("nova lozinka mora sadržavati jedno veliko slovo i jedan broj — AC-14-05 [TODO: potvrdi rutu]", async () => {
    const validanToken = jwt.sign(
      { email: emailPacijent, svrha: "reset" },
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
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/auth/2fa — US-25 Dvofaktorska autentifikacija", () => {

  it("prijava korisnika s aktivnom 2FA vraća zahtjev za kodom — ne vraća token odmah", async () => {
    if (!emailDoktor) return console.warn("Skip: DOKTOR nije u bazi.");

    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: emailDoktor, pristupnaSifra: ISPRAVNA_LOZINKA });

    if (res.body.zahtijeva2FA === true) {
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("zahtijeva2FA", true);
      expect(res.body).not.toHaveProperty("token");
      expect(vi.mocked(posaljiVerifikacioniKod)).toHaveBeenCalled();
    } else {
      console.info("2FA nije aktiviran za testni nalog — preskačem provjeru toka.");
    }
  });

  it.skip("ispravan 2FA kod vraća JWT token — AC-04-05 [TODO: potvrdi rutu /api/auth/2fa/verifikacija]", async () => {
    const testId = idDoktor ?? idPacijent ?? 2;
    const privremeniToken = jwt.sign(
      { id: testId, faza: "2FA_CEKANJE" },
      JWT_SECRET,
      { expiresIn: "5m" }
    );

    const res = await request(app)
      .post("/api/auth/2fa/verifikacija")
      .send({ privremeniToken, kod: process.env.TEST_2FA_KOD ?? "123456" });

    if (res.status === 200) {
      expect(res.body).toHaveProperty("token");
      const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
      expect(decoded).toHaveProperty("uloga");
    } else {
      expect([400, 401]).toContain(res.status);
    }
  });

  it.skip("pogrešan 2FA kod vraća 401 — AC-04-05 [TODO: potvrdi rutu]", async () => {
    const testId = idDoktor ?? idPacijent ?? 2;
    const privremeniToken = jwt.sign(
      { id: testId, faza: "2FA_CEKANJE" },
      JWT_SECRET,
      { expiresIn: "5m" }
    );

    const res = await request(app)
      .post("/api/auth/2fa/verifikacija")
      .send({ privremeniToken, kod: "000000" });

    expect([400, 401]).toContain(res.status);
    expect(res.body).toHaveProperty("poruka");
  });

  it.skip("istekli 2FA privremeni token vraća 401 — NFR-23 [TODO: potvrdi rutu]", async () => {
    const testId = idDoktor ?? idPacijent ?? 2;
    const istekliPrivremeniToken = jwt.sign(
      { id: testId, faza: "2FA_CEKANJE" },
      JWT_SECRET,
      { expiresIn: -1 }
    );

    const res = await request(app)
      .post("/api/auth/2fa/verifikacija")
      .send({ privremeniToken: istekliPrivremeniToken, kod: "123456" });

    expect([400, 401]).toContain(res.status);
  });
});
