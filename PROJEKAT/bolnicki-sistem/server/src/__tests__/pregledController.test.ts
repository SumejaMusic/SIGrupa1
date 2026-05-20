import { vi, describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";

vi.mock("../lib/prisma.js");

// Mock encryption — dekriptuj se koristi u getPregled
vi.mock("../lib/encryption.js", () => ({
  dekriptuj: vi.fn((v: string) => `decrypted:${v}`),
}));

import { zavrsiPregled, getPregled } from "../controllers/pregledController.js";

// ─── Helper ──────────────────────────────────────────────────────────────────
const mockReqRes = (params = {}, body = {}) => ({
  req: { params, body } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any,
  next: vi.fn(),
});

const mockRezervacija = (overrides = {}) => ({
  id: 1,
  idPacijent: 3,
  idDoktor: 2,
  zavrseno: false,
  historija: null,
  termin: { datum: new Date("2026-05-17") },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
// zavrsiPregled
// ═════════════════════════════════════════════════════════════════════════════
describe("zavrsiPregled", () => {
  const validBody = {
    dijagnoza: "Grip",
    terapija: "Odmor i tekućine",
    biljeske: "Pratiti temperaturu",
  };

  it("uspješno završava pregled bez recepta", async () => {
    const rezervacija = mockRezervacija();
    const historija = { id: 10, dijagnoza: "Grip", terapija: "Odmor i tekućine" };

    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacija as any);
    vi.mocked(prismaMock.$transaction).mockImplementation(async (fn: any) =>
      fn({
        historijaPregleda: {
          create: vi.fn().mockResolvedValue(historija),
          update: vi.fn().mockResolvedValue(historija),
        },
        recept: { create: vi.fn() },
        rezervacije: { update: vi.fn().mockResolvedValue({}) },
      })
    );

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" }, validBody);
    await zavrsiPregled(req, res, next);

    expect(prismaMock.rezervacije.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: "Pregled uspješno završen." })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("uspješno završava pregled i kreira recept", async () => {
    const rezervacija = mockRezervacija();
    const historija = { id: 10, dijagnoza: "Grip" };
    const noviRecept = { id: 5, nazivLijeka: "Paracetamol" };
    const receptCreate = vi.fn().mockResolvedValue(noviRecept);

    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacija as any);
    vi.mocked(prismaMock.$transaction).mockImplementation(async (fn: any) =>
      fn({
        historijaPregleda: { create: vi.fn().mockResolvedValue(historija) },
        recept: { create: receptCreate },
        rezervacije: { update: vi.fn().mockResolvedValue({}) },
      })
    );

    const bodySaReceptom = {
      ...validBody,
      recept: { nazivLijeka: "Paracetamol", doza: "500mg", trajanje: 5, napomena: null },
    };

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" }, bodySaReceptom);
    await zavrsiPregled(req, res, next);

    expect(receptCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nazivLijeka: "Paracetamol",
          doza: "500mg",
          trajanje: 5,
        }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ recept: noviRecept })
    );
  });

  it("updateuje historiju ako već postoji (umjesto create)", async () => {
    const rezervacija = mockRezervacija({
      historija: { id: 10, idRezervacija: 1 }, // postoji historija
    });
    const historija = { id: 10, dijagnoza: "Grip" };
    const historijaUpdate = vi.fn().mockResolvedValue(historija);
    const historijaCreate = vi.fn();

    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacija as any);
    vi.mocked(prismaMock.$transaction).mockImplementation(async (fn: any) =>
      fn({
        historijaPregleda: { update: historijaUpdate, create: historijaCreate },
        recept: { create: vi.fn() },
        rezervacije: { update: vi.fn().mockResolvedValue({}) },
      })
    );

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" }, validBody);
    await zavrsiPregled(req, res, next);

    expect(historijaUpdate).toHaveBeenCalled();
    expect(historijaCreate).not.toHaveBeenCalled();
  });

  it("vraća 400 kada dijagnoza ili terapija nisu proslijeđeni", async () => {
    const { req, res, next } = mockReqRes({ rezervacijaId: "1" }, { dijagnoza: "Grip" }); // nema terapija
    await zavrsiPregled(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Dijagnoza i terapija su obavezni." });
    expect(prismaMock.rezervacije.findUnique).not.toHaveBeenCalled();
  });

  it("vraća 404 kada rezervacija ne postoji", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ rezervacijaId: "999" }, validBody);
    await zavrsiPregled(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
  });

  it("ne kreira recept kada recept podaci nisu kompletni (nedostaje trajanje)", async () => {
    const rezervacija = mockRezervacija();
    const historija = { id: 10 };
    const receptCreate = vi.fn();

    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacija as any);
    vi.mocked(prismaMock.$transaction).mockImplementation(async (fn: any) =>
      fn({
        historijaPregleda: { create: vi.fn().mockResolvedValue(historija) },
        recept: { create: receptCreate },
        rezervacije: { update: vi.fn().mockResolvedValue({}) },
      })
    );

    const bodyBezTrajanja = {
      ...validBody,
      recept: { nazivLijeka: "Paracetamol", doza: "500mg" }, // nema trajanje
    };

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" }, bodyBezTrajanja);
    await zavrsiPregled(req, res, next);

    expect(receptCreate).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci transakcije", async () => {
    const rezervacija = mockRezervacija();
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacija as any);
    vi.mocked(prismaMock.$transaction).mockRejectedValue(new Error("DB greška"));

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" }, validBody);
    await zavrsiPregled(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("poziva next pri DB grešci na findUnique", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.rezervacije.findUnique).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" }, validBody);
    await zavrsiPregled(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getPregled
// ═════════════════════════════════════════════════════════════════════════════
describe("getPregled", () => {
  it("vraća historiju pregleda sa dekriptovanim receptima", async () => {
    const historija = {
      id: 10,
      dijagnoza: "Grip",
      recepti: [
        { id: 1, nazivLijeka: "enc:Paracetamol", doza: "enc:500mg", napomena: "enc:Uz jelo" },
      ],
      nalaz: [{ id: 1, naziv: "Krvna slika", vrijemeNalaza: new Date(), opis: "Normalno" }],
    };

    vi.mocked(prismaMock.historijaPregleda.findUnique).mockResolvedValue(historija as any);

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" });
    await getPregled(req, res, next);

    expect(prismaMock.historijaPregleda.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idRezervacija: 1 } })
    );

    // Recepti trebaju biti dekriptovani
    const pozvaniPodaci = vi.mocked(res.json).mock.calls[0][0];
    expect(pozvaniPodaci.recepti[0].nazivLijeka).toBe("decrypted:enc:Paracetamol");
    expect(pozvaniPodaci.recepti[0].doza).toBe("decrypted:enc:500mg");
  });

  it("vraća null kada historija ne postoji (200 sa null)", async () => {
    vi.mocked(prismaMock.historijaPregleda.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" });
    await getPregled(req, res, next);

    expect(res.json).toHaveBeenCalledWith(null);
    // Ne vraća 404 — dizajn je da se vrati null
    expect(res.status).not.toHaveBeenCalled();
  });

  it("vraća nalaze zajedno sa historijom", async () => {
    const historija = {
      id: 10,
      recepti: [],
      nalaz: [{ id: 5, naziv: "RTG", vrijemeNalaza: new Date(), opis: "Uredno" }],
    };

    vi.mocked(prismaMock.historijaPregleda.findUnique).mockResolvedValue(historija as any);

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" });
    await getPregled(req, res, next);

    const pozvaniPodaci = vi.mocked(res.json).mock.calls[0][0];
    expect(pozvaniPodaci.nalaz).toHaveLength(1);
    expect(pozvaniPodaci.nalaz[0].naziv).toBe("RTG");
  });

  it("uključuje recepte i nalaze u Prisma upitu", async () => {
    vi.mocked(prismaMock.historijaPregleda.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" });
    await getPregled(req, res, next);

    expect(prismaMock.historijaPregleda.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          recepti: true,
          nalaz: expect.objectContaining({ select: expect.any(Object) }),
        }),
      })
    );
  });

  it("pravilno obrađuje recept bez napomene (napomena je null)", async () => {
    const historija = {
      id: 10,
      recepti: [{ id: 1, nazivLijeka: "enc:Aspirin", doza: "enc:100mg", napomena: null }],
      nalaz: [],
    };

    vi.mocked(prismaMock.historijaPregleda.findUnique).mockResolvedValue(historija as any);

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" });
    await getPregled(req, res, next);

    const pozvaniPodaci = vi.mocked(res.json).mock.calls[0][0];
    // napomena null ne smije biti dekriptovana
    expect(pozvaniPodaci.recepti[0].napomena).toBeNull();
  });

  it("poziva next pri DB grešci", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.historijaPregleda.findUnique).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ rezervacijaId: "1" });
    await getPregled(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });
});