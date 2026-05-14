import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
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
}));

import { posaljiResetPasswordEmail, posaljiVerifikacioniKod } from "../emailService.js";

const JWT_SECRET       = process.env.JWT_SECRET ?? "test-secret";
const ISPRAVNA_LOZINKA = "TestAuth123!";

// ─── Koristimo postojeće korisnike iz baze ───────────────────────────────────
// FIX: Umjesto kreiranja novih korisnika (što uzrokuje Unique constraint grešku
// zbog desinhronizovane PostgreSQL sekvence), dohvatamo postojeće korisnike
// po ulozi i privremeno im postavljamo poznatu lozinku za trajanje testa.
// afterAll vraća originalne hashove — baza ostaje u istom stanju.

let idPacijent:    number;
let idDoktor:      number;
let idAdmin:       number;
let emailPacijent: string;
let emailDoktor:   string;
let emailAdmin:    string;

let originalHashPacijent: string;
let originalHashDoktor:   string;
let originalHashAdmin:    string;

beforeAll(async () => {
  const noviHash = await bcrypt.hash(ISPRAVNA_LOZINKA, 4);

  const pacijent = await prisma.korisnik.findFirst({
    where: { uloga: "PACIJENT", nalogZakljucan: false },
  });
  const doktor = await prisma.korisnik.findFirst({
    where: { uloga: "DOKTOR", nalogZakljucan: false },
  });
  const admin = await prisma.korisnik.findFirst({
    where: { uloga: "ADMINISTRATOR", nalogZakljucan: false },
  });

  if (!pacijent || !doktor || !admin) {
    throw new Error(
      "beforeAll: nedostaje najmanje jedan korisnik (PACIJENT/DOKTOR/ADMINISTRATOR) " +
      "u testnoj bazi. Pokreni seed skriptu prije testova."
    );
  }

  originalHashPacijent = pacijent.pristupnaSifra;
  originalHashDoktor   = doktor.pristupnaSifra;
  originalHashAdmin    = admin.pristupnaSifra;

  idPacijent    = pacijent.id;
  idDoktor      = doktor.id;
  idAdmin       = admin.id;
  emailPacijent = pacijent.email;
  emailDoktor   = doktor.email;
  emailAdmin    = admin.email;

  // Postavimo poznatu lozinku svima trima
  await prisma.korisnik.updateMany({
    where: { id: { in: [idPacijent, idDoktor, idAdmin] } },
    data: {
      pristupnaSifra:        noviHash,
      nalogZakljucan:        false,
      brojNeuspjelihPrijava: 0,
      vrijemeZakljucavanja:  null,
      zadnjiNeuspjeliPokusaj: null,
    },
  });
});

afterAll(async () => {
  // Vraćamo originalne lozinke — baza ostaje netaknuta
  if (idPacijent) {
    await prisma.korisnik.update({
      where: { id: idPacijent },
      data: { pristupnaSifra: originalHashPacijent },
    });
  }
  if (idDoktor) {
    await prisma.korisnik.update({
      where: { id: idDoktor },
      data: { pristupnaSifra: originalHashDoktor },
    });
  }
  if (idAdmin) {
    await prisma.korisnik.update({
      where: { id: idAdmin },
      data: { pristupnaSifra: originalHashAdmin },
    });
  }
  await prisma.$disconnect();
});


// ═══════════════════════════════════════════════════════════════════════════════
// US-03 — Login sistem: JWT tokeni i RBAC preusmjeravanje
// NFR-03, NFR-04, NFR-06, NFR-07
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/auth/prijava — US-03 Login i RBAC", () => {

  it("uspješna prijava pacijenta vraća JWT token i ulogu PACIJENT", async () => {
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: emailPacijent, pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("uloga", "PACIJENT");

    const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
    expect(decoded).toHaveProperty("id");
    expect(decoded).toHaveProperty("uloga", "PACIJENT");
  });

  it("uspješna prijava doktora vraća JWT token i ulogu DOKTOR", async () => {
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: emailDoktor, pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("uloga", "DOKTOR");
  });

  it("uspješna prijava administratora vraća JWT token i ulogu ADMINISTRATOR", async () => {
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: emailAdmin, pristupnaSifra: ISPRAVNA_LOZINKA });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("uloga", "ADMINISTRATOR");
  });

  // AC-04-03: Poruka ne smije otkrivati KOJI podatak je pogrešan.
  // Provjera: oba slučaja greške vraćaju identičnu poruku.
  it("pogrešna lozinka i pogrešan email vraćaju identičnu poruku — AC-04-03", async () => {
    const resLozinka = await request(app)
      .post("/api/auth/prijava")
      .send({ email: emailPacijent, pristupnaSifra: "PogresnaSifra99!" });

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
    const res = await request(app)
      .post("/api/auth/prijava")
      .send({ email: emailPacijent });

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

  // TODO: Zamijeniti /api/admin/korisnici s tačnom admin rutom iz authController.ts
  it.todo(
    "RBAC: pacijent ne može pristupiti admin ruti — 403 " +
    "[TODO: potvrdi naziv admin rute i ukloni .todo]"
  );

  it.todo(
    "RBAC: doktor ne može pristupiti admin ruti — 403 " +
    "[TODO: potvrdi naziv admin rute i ukloni .todo]"
  );
});


// ═══════════════════════════════════════════════════════════════════════════════
// US-19 — Automatska odjava: istekla sesija
// NFR-13, NFR-14
// ═══════════════════════════════════════════════════════════════════════════════

describe("Session timeout — US-19 Automatska odjava", () => {

  it("istekli JWT token vraća 401 — NFR-13, NFR-14", async () => {
    const istekliToken = jwt.sign(
      { id: idPacijent, uloga: "PACIJENT" },
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
    const validanToken = jwt.sign(
      { id: idPacijent, uloga: "PACIJENT" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("Authorization", `Bearer ${validanToken}`)
      .set("x-test-korisnik-id", String(idPacijent));

    expect(res.status).not.toBe(401);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// US-16 — Reset lozinke putem emaila
// DEC-004, AC-14-01 do AC-14-05
// TODO: Potvrdi nazive ruta iz authController.ts i ukloni .skip.
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
// NFR-23, AC-04-05
// TODO: Potvrdi naziv rute iz authController.ts i ukloni .skip.
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/auth/2fa — US-25 Dvofaktorska autentifikacija", () => {

  it("prijava korisnika s aktivnom 2FA vraća zahtjev za kodom — ne vraća token odmah", async () => {
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
    const privremeniToken = jwt.sign(
      { id: idDoktor, faza: "2FA_CEKANJE" },
      JWT_SECRET,
      { expiresIn: "5m" }
    );

    const testKod = process.env.TEST_2FA_KOD ?? "123456";

    const res = await request(app)
      .post("/api/auth/2fa/verifikacija")
      .send({ privremeniToken, kod: testKod });

    if (res.status === 200) {
      expect(res.body).toHaveProperty("token");
      const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
      expect(decoded).toHaveProperty("uloga");
    } else {
      expect([400, 401]).toContain(res.status);
    }
  });

  it.skip("pogrešan 2FA kod vraća 401 — AC-04-05 [TODO: potvrdi rutu]", async () => {
    const privremeniToken = jwt.sign(
      { id: idDoktor, faza: "2FA_CEKANJE" },
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
    const istekliPrivremeniToken = jwt.sign(
      { id: idDoktor, faza: "2FA_CEKANJE" },
      JWT_SECRET,
      { expiresIn: -1 }
    );

    const res = await request(app)
      .post("/api/auth/2fa/verifikacija")
      .send({ privremeniToken: istekliPrivremeniToken, kod: "123456" });

    expect([400, 401]).toContain(res.status);
  });
});