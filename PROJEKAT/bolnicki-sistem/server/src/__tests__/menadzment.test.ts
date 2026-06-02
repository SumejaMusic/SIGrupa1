import {  describe, it, expect, beforeEach, vi } from "vitest";
import { getTerminiDetalji, sakrijiRecenziju, getSaleOccupancy, getRecenzije } from "../controllers/vlasnikController.js"; // Prilagodi putanju do tvog kontrolera
import { prismaMock } from "../lib/__mocks__/prisma.js";
import { redisMock } from "../lib/__mocks__/redis.js";


import jwt from "jsonwebtoken";

// 1. Ovdje presrećemo modul, ali uvoz mocka radimo DINAMIČKI unutar funkcije
vi.mock("../lib/prisma.js", async () => {
  const { prismaMock } = await import("../lib/__mocks__/prisma.js");
  return { prisma: prismaMock };
});



// Pomoćna funkcija za generisanje Express objekata
const mockReqRes = (query = {}, params = {}, body = {}) => ({
  req: { query, params, body } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any,
});

describe("VLASNIK CONTROLLER - UNIT TESTOVI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 1. TESTOVI ZA getTerminiDetalji ───────────────────────────────────────
  describe("getTerminiDetalji", () => {
    it("Uspješno kalkuliše lokalno vrijeme (+2h) i formatira datum u DD.MM.YYYY.", async () => {
      // 600 minuta od ponoći = 10:00 UTC. Kada kontroler doda 120 minuta, to mora biti 12:00.
      prismaMock.termin.findMany.mockResolvedValue([
        {
          id: 1,
          datum: new Date("2026-06-01T00:00:00.000Z"),
          vrijeme: 600, 
          status: "SLOBODAN",
          doktor: {
            korisnik: { ime: "Mujo", prezime: "Mujići" },
            odjel: { naziv: "Kardiologija" },
            soba: { naziv: "Ordinacija 1" },
          },
          rezervacije: [],
        },
      ] as any);
      prismaMock.termin.count.mockResolvedValue(1);

      const { req, res } = mockReqRes({ stranica: "1", limit: "20" });
      await getTerminiDetalji(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          termini: expect.arrayContaining([
            expect.objectContaining({
              terminId: 1,
              datum: "01.06.2026.",
              vrijemePrikaz: "12:00",
              status: "SLOBODAN",
            }),
          ]),
          paginacija: { ukupno: 1, stranica: 1, limit: 20, ukupnoStranica: 1 },
        })
      );
    });

    it("Prepoznaje status OTKAZAN ukoliko termin ima rezervaciju sa datumom otkazivanja", async () => {
      prismaMock.termin.findMany.mockResolvedValue([
        {
          id: 2,
          datum: new Date("2026-06-01T00:00:00.000Z"),
          vrijeme: 720, // 12:00 UTC + 2h = 14:00
          status: "ZAKAZAN",
          doktor: {
            korisnik: { ime: "Jasmina", prezime: "Sarić" },
            odjel: { naziv: "Dermatologija" },
            soba: { naziv: "Soba 102" },
          },
          rezervacije: [
            {
              id: 99,
              datumKreiranja: new Date("2026-05-30T10:00:00.000Z"),
              datumOtkazivanja: new Date("2026-05-31T15:30:00.000Z"),
              zavrseno: false,
              pacijent: {
                korisnik: { ime: "Adis", prezime: "Smajić", email: "adis@test.com" },
              },
            },
          ],
        },
      ] as any);
      prismaMock.termin.count.mockResolvedValue(1);

      const { req, res } = mockReqRes({ status: "OTKAZAN" });
      await getTerminiDetalji(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          termini: expect.arrayContaining([
            expect.objectContaining({
              status: "OTKAZAN", // Provjera da li je prepisao stvarniStatus u 'OTKAZAN'
              rezervacijaId: 99,
              zakazaoIme: "Adis",
              otkazaoIme: "Adis",
            }),
          ]),
        })
      );
    });
  });

  // ─── 2. TESTOVI ZA getSaleOccupancy ────────────────────────────────────────
  describe("getSaleOccupancy", () => {
    it("Uspješno uklanja duplikate rezervacija i tačno računa aktivne, završene i otkazane", async () => {
      // Simuliramo situaciju gdje se ista rezervacija (ID: 50) pojavljuje i direktno u sobi i kroz doktora
      prismaMock.soba.findMany.mockResolvedValue([
        {
          id: 10,
          naziv: "Operaciona Sala 1",
          tip: "OPERACIJA",
          sprat: 3,
          kapacitet: 5,
          statusSobe: "AKTIVNA",
          doktori: [
            {
              id: 1,
              korisnik: { ime: "Dr. Kenan", prezime: "Ilić" },
              odjel: { naziv: "Hirurgija" },
              termini: [
                {
                  id: 200,
                  status: "POTVRDJEN",
                  rezervacije: [
                    { id: 50, zavrseno: false, datumOtkazivanja: null }, // Duplikat iste rezervacije
                  ],
                },
              ],
            },
          ],
          rezervacije: [
            { id: 50, zavrseno: false, datumOtkazivanja: null, termin: { status: "POTVRDJEN" } },
          ],
        },
      ] as any);

      const { req, res } = mockReqRes();
      await getSaleOccupancy(req, res);

      // Map skida duple elemente, tako da ukupnoRezervacija i aktivnih mora biti tačno 1 (a ne 2)
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            sobaId: 10,
            naziv: "Operaciona Sala 1",
            ukupnoRezervacija: 1,
            aktivnih: 1,
            zavrsenih: 0,
            otkazanih: 0,
          }),
        ])
      );
    });
  });

  // ─── 3. TESTOVI ZA sakrijiRecenziju ────────────────────────────────────────
  describe("sakrijiRecenziju", () => {
    it("Vraća status 404 ukoliko recenzija ne postoji u bazi podataka", async () => {
      prismaMock.recenzija.findUnique.mockResolvedValue(null);

      const { req, res } = mockReqRes({}, { id: "99" });
      await sakrijiRecenziju(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Recenzija nije pronađena." });
    });

    it("Vraća status 400 ukoliko je recenzija već prethodno sakrivena", async () => {
      prismaMock.recenzija.findUnique.mockResolvedValue({
        id: 5,
        sakriven: true,
      } as any);

      const { req, res } = mockReqRes({}, { id: "5" });
      await sakrijiRecenziju(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Recenzija je već sakrivena." });
    });

    it("Uspješno postavlja sakriven na true i briše tekst komentara (komentar: null)", async () => {
      prismaMock.recenzija.findUnique.mockResolvedValue({
        id: 12,
        sakriven: false,
      } as any);
      
      const { req, res } = mockReqRes({}, { id: "12" });
      await sakrijiRecenziju(req, res);

      // Provjera da li update upit u bazu šalje 'komentar: null'
      expect(prismaMock.recenzija.update).toHaveBeenCalledWith({
        where: { id: 12 },
        data: {
          sakriven: true,
          sakrivenAt: expect.any(Date),
          komentar: null,
        },
      });

      expect(res.json).toHaveBeenCalledWith({ poruka: "Recenzija uspješno sakrivena." });
    });
  });

  // ─── 4. TESTOVI ZA getRecenzije ────────────────────────────────────────────
  describe("getRecenzije", () => {
    it("Uspješno vraća paginiranu listu svih recenzija iz baze", async () => {
      const lazneRecenzije = [
        {
          id: 1,
          ocjena: 5,
          komentar: "Sve pohvale!",
          sakriven: false,
          rezervacija: {
            pacijent: { korisnik: { ime: "Sara", prezime: "Marić" } },
            doktor: { korisnik: { ime: "Emina", prezime: "Hanić" }, odjel: { naziv: "Pedijatrija" } },
          },
        },
      ];
      prismaMock.recenzija.findMany.mockResolvedValue(lazneRecenzije as any);
      prismaMock.recenzija.count.mockResolvedValue(1);

      const { req, res } = mockReqRes({ stranica: "2", limit: "10" });
      await getRecenzije(req, res);

      expect(prismaMock.recenzija.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        recenzije: lazneRecenzije,
        paginacija: { ukupno: 1, stranica: 2, limit: 10, ukupnoStranica: 1 },
      });
    });

    it("Dodaje ispravan filter u 'where' objekat kada je proslijeđen parametar samo_sa_komentarom", async () => {
      prismaMock.recenzija.findMany.mockResolvedValue([]);
      prismaMock.recenzija.count.mockResolvedValue(0);

      const { req, res } = mockReqRes({ samo_sa_komentarom: "true" });
      await getRecenzije(req, res);

      // Provjera da li je where klauzula uspješno presretnuta i dodata u Prisma query
      expect(prismaMock.recenzija.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { komentar: { not: null } },
        })
      );
    });
  });
});