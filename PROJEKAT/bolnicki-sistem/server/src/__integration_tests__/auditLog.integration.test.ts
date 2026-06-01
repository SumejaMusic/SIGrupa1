/**
 * Integracioni testovi — GET /admin/audit-logs
 * Alati: Supertest + Vitest + prava test baza (Docker kontejner)
 *
 * Ne importujemo setupFiles.js — taj fajl registruje beforeEach koji briše
 * termine i resetuje sekvence, što bi ometalo ostale testove pri paralelnom
 * pokretanju. Audit log testovi su potpuno izolovani: jedine tablice koje
 * diraju su AuditLog i Korisnik (samo upsert admina).
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import express from "express";
import { PrismaClient } from "@prisma/client";

import { getAuditLogs } from "../controllers/adminController.js";
import { autentifikuj } from "../middleware/authMiddleware.js";
import { autorizacija } from "../middleware/autorizacija.js";

// ─── Prisma klijent za direktno pisanje test podataka ────────────────────────

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// ─── Token helpers ────────────────────────────────────────────────────────────

function genToken(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET ?? "test-secret", {
    expiresIn: "1h",
  });
}

const ADMIN_TOKEN = genToken({ id: 99, uloga: "ADMINISTRATOR" });
const PACIJENT_TOKEN = genToken({ id: 2, uloga: "PACIJENT" });

// ─── Test helpers ─────────────────────────────────────────────────────────────

/** Kreira jedan audit log direktno u bazi */
async function kreirajTestLog(override: Partial<{
  idKorisnika: number;
  tipAkcije: string;
  izmenjenaTabela: string;
  stariPodaci: object;
  noviPodaci: object;
  ipAdresa: string;
  vrijemeAkcije: Date;
}> = {}) {
  return prisma.auditLog.create({
    data: {
      idKorisnika:     override.idKorisnika    ?? 99,
      tipAkcije:       override.tipAkcije      ?? "UPDATE",
      izmenjenaTabela: override.izmenjenaTabela ?? "Korisnik",
      stariPodaci:     JSON.stringify(override.stariPodaci ?? {}),
      noviPodaci:      JSON.stringify(override.noviPodaci  ?? {}),
      ipAdresa:        override.ipAdresa       ?? "127.0.0.1",
      vrijemeAkcije:   override.vrijemeAkcije  ?? new Date(),
    },
  });
}

/**
 * Seedujemo dva administratora u kontroli ovog fajla.
 * id=99 — glavni admin (vlasnik ADMIN tokena)
 * id=98 — drugi admin za filter testove ("drugi korisnik")
 * Ne koristimo id=1 (doktor) jer taj seed možda nije pokrenut.
 */
async function seedAdmin() {
  await prisma.korisnik.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      id: 99,
      jmbg: "9999999999999",
      jmbgHash: "jmbg-hash-admin-test",
      ime: "Admin",
      prezime: "Testović",
      datumRodjenja: new Date("1975-01-01"),
      email: "admin@test.com",
      pristupnaSifra: "hash_placeholder",
      emailVerifikovan: true,
      uloga: "ADMINISTRATOR",
    },
  });

  await prisma.korisnik.upsert({
    where: { email: "admin2@test.com" },
    update: {},
    create: {
      id: 98,
      jmbg: "8888888888888",
      jmbgHash: "jmbg-hash-admin2-test",
      ime: "Drugi",
      prezime: "Admin",
      datumRodjenja: new Date("1980-05-10"),
      email: "admin2@test.com",
      pristupnaSifra: "hash_placeholder",
      emailVerifikovan: true,
      uloga: "ADMINISTRATOR",
    },
  });
}

// ─── Express app sa istim middleware stackom kao produkcija ───────────────────

const app = express();
app.use(express.json());
app.get(
  "/admin/audit-logs",
  autentifikuj,
  autorizacija(["ADMINISTRATOR"]),
  getAuditLogs
);

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /admin/audit-logs — integracioni testovi", () => {

  beforeAll(async () => {
    await seedAdmin();
  });

  // Čistimo audit logove prije svakog testa jer setupFiles to ne radi
  // (ne smijemo brisati Korisnik / Doktor / Termin jer ih drugi testovi trebaju)
  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
  });

  // ── Autorizacija ────────────────────────────────────────────────────────────

  describe("autorizacija", () => {
    it("vraća 401 bez Authorization headera", async () => {
      const res = await request(app).get("/admin/audit-logs");
      expect(res.status).toBe(401);
    });

    it("vraća 401 s neispravnim tokenom", async () => {
      const res = await request(app)
        .get("/admin/audit-logs")
        .set("Authorization", "Bearer ovo_nije_validan_token");
      expect(res.status).toBe(401);
    });

    it("vraća 403 kad PACIJENT pokušava pristup", async () => {
      const res = await request(app)
        .get("/admin/audit-logs")
        .set("Authorization", `Bearer ${PACIJENT_TOKEN}`);
      expect(res.status).toBe(403);
    });

    it("vraća 200 za ADMIN token", async () => {
      const res = await request(app)
        .get("/admin/audit-logs")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);
      expect(res.status).toBe(200);
    });
  });

  // ── Osnovna funkcionalnost ──────────────────────────────────────────────────

  describe("osnovna funkcionalnost", () => {
    it("vraća praznu listu i ukupno=0 kad nema logova", async () => {
      const res = await request(app)
        .get("/admin/audit-logs")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(0);
      expect(res.body.paginacija.ukupno).toBe(0);
    });

    it("vraća kreiran log sa ispravnim poljima", async () => {
      await kreirajTestLog({
        tipAkcije: "UPDATE",
        izmenjenaTabela: "Korisnik",
        stariPodaci: { ime: "Staro" },
        noviPodaci: { ime: "Novo" },
      });

      const res = await request(app)
        .get("/admin/audit-logs")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      const log = res.body.logs[0];
      expect(log.tipAkcije).toBe("UPDATE");
      expect(log.izmenjenaTabela).toBe("Korisnik");
      expect(log.idKorisnika).toBe(99);
    });

    it("log u odgovoru sadrži ugniježđen korisnik objekat", async () => {
      await kreirajTestLog({ idKorisnika: 99 });

      const res = await request(app)
        .get("/admin/audit-logs")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs[0].korisnik).toMatchObject({
        ime: "Admin",
        prezime: "Testović",
        email: "admin@test.com",
        uloga: "ADMINISTRATOR",
      });
    });

    it("logovi su sortirani po vrijemeAkcije desc — najnoviji prvi", async () => {
      await kreirajTestLog({ vrijemeAkcije: new Date("2025-01-01T08:00:00Z") });
      await kreirajTestLog({ vrijemeAkcije: new Date("2025-06-01T08:00:00Z") });

      const res = await request(app)
        .get("/admin/audit-logs")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      const [prvi, drugi] = res.body.logs;
      expect(new Date(prvi.vrijemeAkcije).getTime()).toBeGreaterThan(
        new Date(drugi.vrijemeAkcije).getTime()
      );
    });
  });

  // ── Paginacija ──────────────────────────────────────────────────────────────

  describe("paginacija", () => {
    it("poštuje limit — vraća tačan broj zapisa po stranici", async () => {
      for (let i = 0; i < 5; i++) await kreirajTestLog();

      const res = await request(app)
        .get("/admin/audit-logs?stranica=1&limit=3")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(3);
    });

    it("ispravno računa ukupnoStranica", async () => {
      for (let i = 0; i < 5; i++) await kreirajTestLog();

      const res = await request(app)
        .get("/admin/audit-logs?limit=3")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.body.paginacija).toMatchObject({
        ukupno: 5,
        ukupnoStranica: 2,
        limit: 3,
      });
    });

    it("vraća drugu stranicu s preostalim zapisima", async () => {
      for (let i = 0; i < 5; i++) await kreirajTestLog();

      const res = await request(app)
        .get("/admin/audit-logs?stranica=2&limit=3")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(2);
      expect(res.body.paginacija.stranica).toBe(2);
    });

    it("odgovor uvijek sadrži strukturu paginacije", async () => {
      const res = await request(app)
        .get("/admin/audit-logs")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.body).toHaveProperty("logs");
      expect(res.body).toHaveProperty("paginacija");
      expect(res.body.paginacija).toHaveProperty("ukupno");
      expect(res.body.paginacija).toHaveProperty("stranica");
      expect(res.body.paginacija).toHaveProperty("limit");
      expect(res.body.paginacija).toHaveProperty("ukupnoStranica");
    });
  });

  // ── Filtriranje po tipAkcije ────────────────────────────────────────────────

  describe("filter: tipAkcije", () => {
    it("vraća samo logove s traženim tipAkcije", async () => {
      await kreirajTestLog({ tipAkcije: "UPDATE" });
      await kreirajTestLog({ tipAkcije: "DELETE" });
      await kreirajTestLog({ tipAkcije: "DELETE" });

      const res = await request(app)
        .get("/admin/audit-logs?tipAkcije=DELETE")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(2);
      expect(res.body.logs.every((l: any) => l.tipAkcije === "DELETE")).toBe(true);
    });

    it("vraća praznu listu za nepostojeći tipAkcije", async () => {
      await kreirajTestLog({ tipAkcije: "UPDATE" });

      const res = await request(app)
        .get("/admin/audit-logs?tipAkcije=NEPOSTOJECI")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.body.logs).toHaveLength(0);
    });
  });

  // ── Filtriranje po izmenjenaTabela ──────────────────────────────────────────

  describe("filter: izmenjenaTabela", () => {
    it("vraća samo logove za traženu tabelu", async () => {
      await kreirajTestLog({ izmenjenaTabela: "Korisnik" });
      await kreirajTestLog({ izmenjenaTabela: "RasporedDoktora" });

      const res = await request(app)
        .get("/admin/audit-logs?izmenjenaTabela=RasporedDoktora")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(1);
      expect(res.body.logs[0].izmenjenaTabela).toBe("RasporedDoktora");
    });
  });

  // ── Filtriranje po idKorisnika ──────────────────────────────────────────────

  describe("filter: idKorisnika", () => {
    it("vraća samo logove za traženog korisnika", async () => {
      await kreirajTestLog({ idKorisnika: 99 });
      await kreirajTestLog({ idKorisnika: 98 }); // drugi admin iz lokalnog seeda

      const res = await request(app)
        .get("/admin/audit-logs?idKorisnika=99")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(1);
      expect(res.body.logs[0].idKorisnika).toBe(99);
    });
  });

  // ── Filtriranje po datumu ───────────────────────────────────────────────────

  describe("filter: datum (datumOd / datumDo)", () => {
    it("vraća samo logove unutar opsega datumOd–datumDo", async () => {
      await kreirajTestLog({ vrijemeAkcije: new Date("2025-01-15T10:00:00Z") });
      await kreirajTestLog({ vrijemeAkcije: new Date("2025-03-10T10:00:00Z") });

      const res = await request(app)
        .get("/admin/audit-logs?datumOd=2025-03-01T00:00:00.000Z&datumDo=2025-03-31T23:59:59.999Z")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(1);
      expect(new Date(res.body.logs[0].vrijemeAkcije).getMonth()).toBe(2); // mart = index 2
    });

    it("datumOd — ne vraća logove koji su stariji od datuma", async () => {
      await kreirajTestLog({ vrijemeAkcije: new Date("2024-12-01T00:00:00Z") });
      await kreirajTestLog({ vrijemeAkcije: new Date("2025-06-01T00:00:00Z") });

      const res = await request(app)
        .get("/admin/audit-logs?datumOd=2025-01-01T00:00:00.000Z")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(1);
    });

    it("datumDo — ne vraća logove koji su noviji od datuma", async () => {
      await kreirajTestLog({ vrijemeAkcije: new Date("2024-06-01T00:00:00Z") });
      await kreirajTestLog({ vrijemeAkcije: new Date("2025-06-01T00:00:00Z") });

      const res = await request(app)
        .get("/admin/audit-logs?datumDo=2024-12-31T23:59:59.999Z")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(1);
    });
  });

  // ── Kombinovani filteri ─────────────────────────────────────────────────────

  describe("kombinovani filteri", () => {
    it("tipAkcije + idKorisnika — vraća presječni skup", async () => {
      await kreirajTestLog({ tipAkcije: "DELETE", idKorisnika: 99 });
      await kreirajTestLog({ tipAkcije: "UPDATE", idKorisnika: 99 });
      await kreirajTestLog({ tipAkcije: "DELETE", idKorisnika: 98 }); // drugi admin

      const res = await request(app)
        .get("/admin/audit-logs?tipAkcije=DELETE&idKorisnika=99")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(1);
      expect(res.body.logs[0].tipAkcije).toBe("DELETE");
      expect(res.body.logs[0].idKorisnika).toBe(99);
    });

    it("tipAkcije + datum opseg — vraća tačno filtrirani rezultat", async () => {
      await kreirajTestLog({
        tipAkcije: "DELETE",
        vrijemeAkcije: new Date("2025-03-10T00:00:00Z"),
      });
      await kreirajTestLog({
        tipAkcije: "UPDATE",
        vrijemeAkcije: new Date("2025-03-10T00:00:00Z"),
      });
      await kreirajTestLog({
        tipAkcije: "DELETE",
        vrijemeAkcije: new Date("2025-01-01T00:00:00Z"),
      });

      const res = await request(app)
        .get("/admin/audit-logs?tipAkcije=DELETE&datumOd=2025-03-01T00:00:00.000Z")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(1);
      expect(res.body.logs[0].tipAkcije).toBe("DELETE");
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});