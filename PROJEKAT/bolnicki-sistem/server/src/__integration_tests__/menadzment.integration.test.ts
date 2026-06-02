import { vi, describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// 1. Rješavanje hoisting problema: dinamički uvoz mockDeep klijenta unutar vi.mock()
vi.mock("../lib/prisma.js", async () => {
  const { prismaMock } = await import("../lib/__mocks__/prisma.js");
  return { prisma: prismaMock };
});

// 2. Nakon mockovanja, uvozimo prismaMock za konfiguraciju unutar testova
import { prismaMock } from "../lib/__mocks__/prisma.js";
import {
  getTerminiDetalji,
  getSaleOccupancy,
  sakrijiRecenziju,
  getRecenzije,
} from "../controllers/vlasnikController.js";

// 3. Inicijalizacija Express aplikacije isključivo za potrebe integracionih testova
const app = express();
app.use(express.json());

// Mapiramo rute prema metodama iz vlasnikController-a
app.get("/api/vlasnik/termini-detalji", getTerminiDetalji);
app.get("/api/vlasnik/sale-occupancy", getSaleOccupancy);
app.patch("/api/vlasnik/recenzije/:id/hide", sakrijiRecenziju);
app.get("/api/vlasnik/recenzije", getRecenzije);

describe("VLASNIK CONTROLLER - INTEGRACIONI TESTOVI (Supertest)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 1. INTEGRACIJA: getTerminiDetalji ─────────────────────────────────────
  describe("GET /api/vlasnik/termini-detalji", () => {
    it("Treba vratiti 200 OK i ispravno mapirati query parametre (stranica, limit)", async () => {
      prismaMock.termin.findMany.mockResolvedValue([]);
      prismaMock.termin.count.mockResolvedValue(0);

      const res = await request(app)
        .get("/api/vlasnik/termini-detalji")
        .query({ stranica: "3", limit: "15", status: "SLOBODAN" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("termini");
      expect(res.body).toHaveProperty("paginacija");
      
      // Provjeravamo da li su stringovi iz query-ja pretvoreni u brojeve za paginaciju
      expect(res.body.paginacija).toEqual({
        ukupno: 0,
        stranica: 3,
        limit: 15,
        ukupnoStranica: 0,
      });

      // Provjeravamo da li je Prisma primila ispravne skip/take proračune
      expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 30, // (3 - 1) * 15
          take: 15,
        })
      );
    });
  });

  // ─── 2. INTEGRACIJA: getSaleOccupancy ──────────────────────────────────────
  describe("GET /api/vlasnik/sale-occupancy", () => {
    it("Treba vratiti kompletan niz soba sa ispravno izračunatim stanjima kroz HTTP odgovor", async () => {
      prismaMock.soba.findMany.mockResolvedValue([
        {
          id: 1,
          naziv: "Soba 101",
          tip: "PREGLED",
          sprat: 1,
          kapacitet: 2,
          statusSobe: "AKTIVNA",
          doktori: [],
          rezervacije: [
            { id: 10, zavrseno: true, datumOtkazivanja: null, termin: { status: "ZAKAZAN" } }, // Završena
            { id: 11, zavrseno: false, datumOtkazivanja: null, termin: { status: "ZAKAZAN" } }, // Aktivna
          ],
        },
      ] as any);

      const res = await request(app).get("/api/vlasnik/sale-occupancy");

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0]).toEqual(
        expect.objectContaining({
          sobaId: 1,
          naziv: "Soba 101",
          ukupnoRezervacija: 2,
          aktivnih: 1,
          zavrsenih: 1,
          otkazanih: 0,
        })
      );
    });
  });

  // ─── 3. INTEGRACIJA: sakrijiRecenziju ──────────────────────────────────────
  describe("PATCH /api/vlasnik/recenzije/:id/hide", () => {
    it("Treba uspješno sakriti recenziju i vratiti poruku o uspjehu", async () => {
      // Simuliramo da recenzija postoji i da nije već sakrivena
      prismaMock.recenzija.findUnique.mockResolvedValue({
        id: 42,
        sakriven: false,
      } as any);

      prismaMock.recenzija.update.mockResolvedValue({
        id: 42,
        sakriven: true,
      } as any);

      const res = await request(app)
        .patch("/api/vlasnik/recenzije/42/hide")
        .send(); // Šaljemo prazan body jer kontroler podrazumijeva sakrivanje

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        poruka: "Recenzija uspješno sakrivena.",
      });

      // Provjeravamo da li se u bazi pokrenuo update za tačan ID
      expect(prismaMock.recenzija.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 42 },
        })
      );
    });

    it("Treba vratiti 400 Bad Request ako se pokuša sakriti već sakrivena recenzija", async () => {
      prismaMock.recenzija.findUnique.mockResolvedValue({
        id: 42,
        sakriven: true, // Već sakrivena!
      } as any);

      const res = await request(app).patch("/api/vlasnik/recenzije/42/hide");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        poruka: "Recenzija je već sakrivena.",
      });
      
      // Update se ne smije uopšte izvršiti
      expect(prismaMock.recenzija.update).not.toHaveBeenCalled();
    });
  });

  // ─── 4. INTEGRACIJA: getRecenzije ──────────────────────────────────────────
  describe("GET /api/vlasnik/recenzije", () => {
    it("Treba ispravno reagovati na query parametar 'samo_sa_komentarom=true'", async () => {
      prismaMock.recenzija.findMany.mockResolvedValue([]);
      prismaMock.recenzija.count.mockResolvedValue(0);

      const res = await request(app)
        .get("/api/vlasnik/recenzije")
        .query({ samo_sa_komentarom: "true" });

      expect(res.status).toBe(200);
      
      // Provjera da li je HTTP query string uspješno prešao u Prisma `where` objekat
      expect(prismaMock.recenzija.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            komentar: { not: null },
          },
        })
      );
    });
  });
});