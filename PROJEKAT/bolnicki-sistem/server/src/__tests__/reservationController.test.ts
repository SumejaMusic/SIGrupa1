import { vi, describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import { redisMock } from "../lib/__mocks__/redis.js";
import {
  kreirajRezervaciju,
  getRezervacijeZaPacijenta,
  getRezervacijeZaDoktora,
  otkaziRezervacijuPacijent,
  otkaziRezervacijuOsoblje,
  dodajKomentar,
  getKomentari,
  pomjeriRezervaciju,        
  kreirajRezervacijuDoktor,  
  dodajKomentarDoktor,      
} from "../controllers/reservationController.js";
import { posaljiOtkazivanjeRezerv, posaljiPotvrdurezerv } from "../emailService.js";

vi.mock("../app.js", () => ({
  io: { emit: vi.fn() },
}));

vi.mock("../emailService.js", () => ({
  posaljiPotvrdurezerv: vi.fn().mockResolvedValue(undefined),
  posaljiOtkazivanjeRezerv: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../lib/prisma.js");
vi.mock("../lib/redis.js");

vi.mock("multer", () => {
  const multerMock: any = () => ({
    single: () => (req: any, res: any, next: any) => next(),
    array: () => (req: any, res: any, next: any) => next(),
    fields: () => (req: any, res: any, next: any) => next(),
  });
  multerMock.memoryStorage = vi.fn(() => ({}));
  multerMock.diskStorage = vi.fn(() => ({}));
  
  return {
    default: multerMock,
    // Dodajemo i imenovane eksporte za svaki slučaj
    memoryStorage: multerMock.memoryStorage,
    diskStorage: multerMock.diskStorage
  };
});

// ─── Helper ───────────────────────────────────────────────────────────────
const mockReqRes = (params = {}, query = {}, body = {}, korisnik: { id: number; uloga: string; doktorId?: number } | null = { id: 1, uloga: "PACIJENT" }) => ({
  req: { params, query, body, korisnik } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any,
  next: vi.fn(),
});

const lažniPacijentMock = {
  id: 10,
  idKorisnik: 1,
  korisnik: { id: 1, email: "test@test.ba" },
};

beforeEach(() => {
  vi.resetAllMocks();
});

// ─────────────────────────────────────────────
// kreirajRezervaciju
// ─────────────────────────────────────────────
describe("kreirajRezervaciju", () => {
  const lažnaRezervacija = {
    id: 99,
    idTermina: 5,
    idPacijent: 10,
    termin: { id: 5, datum: new Date("2025-06-01"), vrijeme: 540 },
    pacijent: { korisnik: { ime: "Ana", prezime: "Anić", email: "test@test.com" } },
    doktor: { korisnik: { ime: "Dr.", prezime: "Marić" }, specijalizacija: "Kardiologija" },
    hitnost: false,
    komentar: null,
  };

  const buduciTerminMock = () => ({
    id: 5,
    idDoktor: 2,
    status: "SLOBODAN",
    datum: new Date(Date.now() + 48 * 60 * 60 * 1000),
    vrijeme: 540,
  });

  it("uspješno kreira rezervaciju i vraća je sa statusom 201 — US-06 AC1", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue(lažnaRezervacija as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2, tipPregledaId: 1 }, { id: 1, uloga: "PACIJENT" });
    await kreirajRezervaciju(req, res, next);

    expect(prismaMock.pacijent.findFirst).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(lažnaRezervacija);
    expect(next).not.toHaveBeenCalled();
  });

  it("briše Redis lock nakon uspješne rezervacije — NFR-22", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue(lažnaRezervacija as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 }, { id: 1, uloga: "PACIJENT" });
    await kreirajRezervaciju(req, res, next);

    expect(redisMock.del).toHaveBeenCalledWith("termin:lock:5");
    expect(next).not.toHaveBeenCalled();
  });

  it("kreira rezervaciju sa komentarom — US-22", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue({ ...lažnaRezervacija, komentar: "Imam bolove u srcu" } as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2, tipPregledaId: 1, komentar: "Imam bolove u srcu" }, { id: 1, uloga: "PACIJENT" });
    await kreirajRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ komentar: "Imam bolove u srcu" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("kreira rezervaciju bez komentara — US-22 AC1", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue({ ...lažnaRezervacija, komentar: null } as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2, tipPregledaId: 1 }, { id: 1, uloga: "PACIJENT" });
    await kreirajRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ komentar: null }));
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada profil pacijenta nije pronađen — US-06", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 }, { id: 1, uloga: "PACIJENT" });
    await kreirajRezervaciju(req, res, next);

    expect(prismaMock.pacijent.findFirst).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Profil pacijenta nije pronađen." });
    expect(prismaMock.rezervacije.findFirst).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 409 za duplu rezervaciju — US-13 AC1", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue({ id: 1 } as any);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 }, { id: 1, uloga: "PACIJENT" });
    await kreirajRezervaciju(req, res, next);

    expect(prismaMock.rezervacije.findFirst).toHaveBeenCalledWith({
      where: { idPacijent: 10, idTermina: 5, datumOtkazivanja: null },
    });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija za ovaj termin već postoji." });
    expect(redisMock.get).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada je odabrani termin u prošlosti", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T12:00:00.000Z"));

    try {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue({
        id: 5,
        idDoktor: 2,
        status: "SLOBODAN",
        datum: new Date("2026-05-18T00:00:00.000Z"),
        vrijeme: 600,
      } as any);

      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 }, { id: 1, uloga: "PACIJENT" });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        poruka: "Nevalidna rezervacija: ne možete rezervisati termin u prošlosti.",
      });
      expect(prismaMock.rezervacije.findFirst).not.toHaveBeenCalled();
      expect(redisMock.get).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("poziva next pri Prisma grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.pacijent.findFirst).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 }, { id: 1, uloga: "PACIJENT" });
    await kreirajRezervaciju(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("poziva next pri Redis grešci i ne vraća odgovor", async () => {
    const greška = new Error("Redis greška");
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 }, { id: 1, uloga: "PACIJENT" });
    await kreirajRezervaciju(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("kreira rezervaciju sa hitnost: false kada hitnost nije poslana", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue({ ...lažnaRezervacija, hitnost: false } as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2, tipPregledaId: 1 }, { id: 1, uloga: "PACIJENT" });
    await kreirajRezervaciju(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ hitnost: false }));
  });

  it("ne briše Redis lock kada transakcija ne uspije", async () => {
    const greška = new Error("Transakcija pala");
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 }, { id: 1, uloga: "PACIJENT" });
    await kreirajRezervaciju(req, res, next);

    expect(redisMock.del).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ─────────────────────────────────────────────
// getRezervacijeZaPacijenta
// ─────────────────────────────────────────────
describe("getRezervacijeZaPacijenta", () => {
  it("vraća rezervacije za pacijenta poredane po datumu — US-01 AC1", async () => {
    const lažneRezervacije = [
      { id: 2, datumKreiranja: new Date("2025-06-02") },
      { id: 1, datumKreiranja: new Date("2025-06-01") },
    ];
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue(lažneRezervacije as any);

    const { req, res, next } = mockReqRes({}, {}, {}, { id: 1, uloga: "PACIJENT" });
    await getRezervacijeZaPacijenta(req, res, next);

    expect(prismaMock.rezervacije.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ idPacijent: 10 }),
        orderBy: { datumKreiranja: "desc" },
      })
    );
    expect(res.json).toHaveBeenCalledWith(lažneRezervacije);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća prazan niz kada pacijent nema rezervacija", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, {}, {}, { id: 1, uloga: "PACIJENT" });
    await getRezervacijeZaPacijenta(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada profil pacijenta nije pronađen", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({}, {}, {}, { id: 1, uloga: "PACIJENT" });
    await getRezervacijeZaPacijenta(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Profil pacijenta nije pronađen." });
    expect(prismaMock.rezervacije.findMany).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.pacijent.findFirst).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {}, {}, { id: 1, uloga: "PACIJENT" });
    await getRezervacijeZaPacijenta(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// getRezervacijeZaDoktora
// ─────────────────────────────────────────────
describe("getRezervacijeZaDoktora", () => {
  it("vraća rezervacije za doktora poredane po datumu — US-11 AC1", async () => {
    const lažneRezervacije = [
      { id: 2, idDoktor: 3, datumKreiranja: new Date("2025-06-02") },
      { id: 1, idDoktor: 3, datumKreiranja: new Date("2025-06-01") },
    ];
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue(lažneRezervacije as any);

    const { req, res, next } = mockReqRes({ doktorId: "3" });
    await getRezervacijeZaDoktora(req, res, next);

    expect(prismaMock.rezervacije.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idDoktor: 3 }, orderBy: { datumKreiranja: "desc" } })
    );
    expect(res.json).toHaveBeenCalledWith(lažneRezervacije);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća prazan niz kada doktor nema rezervacija", async () => {
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({ doktorId: "999" });
    await getRezervacijeZaDoktora(req, res, next);

    expect(prismaMock.rezervacije.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idDoktor: 999 } })
    );
    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("konvertuje string doktorId u broj prije slanja Prismi", async () => {
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({ doktorId: "42" });
    await getRezervacijeZaDoktora(req, res, next);

    expect(prismaMock.rezervacije.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idDoktor: 42 } })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.rezervacije.findMany).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ doktorId: "3" });
    await getRezervacijeZaDoktora(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// otkaziRezervacijuPacijent
// ─────────────────────────────────────────────
describe("otkaziRezervacijuPacijent", () => {
  const lažnaRezervacija = {
    id: 1,
    idPacijent: 10,
    idTermina: 5,
    idDoktor: 2,
    termin: { id: 5, datum: new Date(Date.now() + 48 * 60 * 60 * 1000) },
    pacijent: { korisnik: { email: "test@test.com" } },
  };

  const lažnaRezervacijaBlizu = {
    id: 2,
    idPacijent: 10,
    idTermina: 6,
    idDoktor: 2,
    termin: { id: 6, datum: new Date(Date.now() + 12 * 60 * 60 * 1000) },
    pacijent: { korisnik: { email: "test@test.com" } },
  };

  it("uspješno otkazuje rezervaciju više od 24h prije termina — US-10 AC1", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(lažnaRezervacija as any);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, {}, { id: 1, uloga: "PACIJENT" });
    await otkaziRezervacijuPacijent(req, res, next);

    expect(prismaMock.rezervacije.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija uspješno otkazana." });
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada rezervacija nije pronađena — US-10", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ id: "999" }, {}, {}, { id: 1, uloga: "PACIJENT" });
    await otkaziRezervacijuPacijent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("zabranjuje otkazivanje tačno 24h ili manje prije termina — US-10 AC2", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    const rezervacija = {
      ...lažnaRezervacijaBlizu,
      termin: { id: 7, datum: new Date(Date.now() + 24 * 60 * 60 * 1000 - 1000) },
    };
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacija as any);

    const { req, res, next } = mockReqRes({ id: "3" }, {}, {}, { id: 1, uloga: "PACIJENT" });
    await otkaziRezervacijuPacijent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("zabranjuje otkazivanje termina koji je već prošao — US-10 AC2", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    const rezervacija = {
      ...lažnaRezervacijaBlizu,
      id: 3,
      termin: { id: 7, datum: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    };
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacija as any);

    const { req, res, next } = mockReqRes({ id: "3" }, {}, {}, { id: 1, uloga: "PACIJENT" });
    await otkaziRezervacijuPacijent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nije moguće otkazati termin manje od 24 sata unaprijed." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijentMock as any);
    vi.mocked(prismaMock.rezervacije.findUnique).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, {}, { id: 1, uloga: "PACIJENT" });
    await otkaziRezervacijuPacijent(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// otkaziRezervacijuOsoblje
// ─────────────────────────────────────────────
describe("otkaziRezervacijuOsoblje", () => {
  const lažnaRezervacija = {
    id: 1,
    idTermina: 5,
    idDoktor: 2,
    termin: { id: 5, datum: new Date("2027-06-01") },
    pacijent: { korisnik: { email: "test@test.com" } },
  };

  it("šalje email pacijentu nakon otkazivanja od strane osoblja — US-09", async () => {
  vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(lažnaRezervacija as any);
  vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);

  const { req, res, next } = mockReqRes({ id: "1" });
  await otkaziRezervacijuOsoblje(req, res, next);

  expect(posaljiOtkazivanjeRezerv).toHaveBeenCalledWith(
    expect.objectContaining({
      pacijentEmail: "test@test.com",
    })
  );
});

  it("uspješno otkazuje rezervaciju i vraća potvrdu — US-09 AC1", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(lažnaRezervacija as any);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await otkaziRezervacijuOsoblje(req, res, next);

    expect(prismaMock.rezervacije.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija otkazana od strane osoblja." });
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada rezervacija nije pronađena — US-09", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ id: "999" });
    await otkaziRezervacijuOsoblje(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.rezervacije.findUnique).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" });
    await otkaziRezervacijuOsoblje(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// dodajKomentar
// ─────────────────────────────────────────────
describe("dodajKomentar", () => {
  const rezervacijaZaPacijenta = {
    id: 1,
    idDoktor: 2,
    pacijent: { idKorisnik: 1 },
    doktor: { idKorisnik: 2 },
  };

  it("uspješno dodaje novi komentar bez brisanja postojećih komentara — US-22 AC1", async () => {
    const datumKreiranja = new Date("2026-05-18T10:00:00.000Z");
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacijaZaPacijenta as any);
    vi.mocked(prismaMock.komentar.create).mockResolvedValue({
      id: 7,
      tekst: "Imam alergiju na penicilin",
      jeDoktor: false,
      datumKreiranja,
      korisnik: { ime: "Ana", prezime: "Anić" },
    } as any);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "Imam alergiju na penicilin" });
    await dodajKomentar(req, res, next);

    expect(prismaMock.rezervacije.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        id: true,
        idDoktor: true,
        pacijent: { select: { idKorisnik: true } },
        doktor: { select: { idKorisnik: true } },
      },
    });
    expect(prismaMock.komentar.create).toHaveBeenCalledWith({
      data: {
        idRezervacije: 1,
        idKorisnik: 1,
        tekst: "Imam alergiju na penicilin",
        jeDoktor: false,
      },
      include: {
        korisnik: { select: { ime: true, prezime: true } },
      },
    });
    expect(prismaMock.rezervacije.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 7,
      tekst: "Imam alergiju na penicilin",
      autor: "Ana Anić",
      datum: "2026-05-18",
      jeDoktor: false,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada je komentar prazan", async () => {
    const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "" });
    await dodajKomentar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Komentar ne može biti prazan." });
    expect(prismaMock.rezervacije.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.komentar.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("konvertuje string ID u broj prije slanja Prismi", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({ ...rezervacijaZaPacijenta, id: 42 } as any);
    vi.mocked(prismaMock.komentar.create).mockResolvedValue({
      id: 1,
      tekst: "Test komentar",
      jeDoktor: false,
      datumKreiranja: new Date("2026-05-18"),
      korisnik: null,
    } as any);

    const { req, res, next } = mockReqRes({ id: "42" }, {}, { komentar: "Test komentar" });
    await dodajKomentar(req, res, next);

    expect(prismaMock.rezervacije.findUnique).toHaveBeenCalledWith({
      where: { id: 42 },
      select: {
        id: true,
        idDoktor: true,
        pacijent: { select: { idKorisnik: true } },
        doktor: { select: { idKorisnik: true } },
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("označava komentar doktora sa jeDoktor=true", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacijaZaPacijenta as any);
    vi.mocked(prismaMock.komentar.create).mockResolvedValue({
      id: 3,
      tekst: "Doktorska napomena",
      jeDoktor: true,
      datumKreiranja: new Date("2026-05-18"),
      korisnik: { ime: "Dr.", prezime: "Marić" },
    } as any);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "Doktorska napomena" }, { id: 2, uloga: "DOKTOR" });
    await dodajKomentar(req, res, next);

    expect(prismaMock.komentar.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ jeDoktor: true, idKorisnik: 2 }),
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ jeDoktor: true, autor: "Dr. Marić" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada rezervacija nije pronađena", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ id: "999" }, {}, { komentar: "Test" });
    await dodajKomentar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
    expect(prismaMock.komentar.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacijaZaPacijenta as any);
    vi.mocked(prismaMock.komentar.create).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "Test" });
    await dodajKomentar(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// getKomentari
// ─────────────────────────────────────────────
describe("getKomentari", () => {
  it("vraća sve komentare rezervacije sa ispravnim autorima", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      id: 1,
      komentar: "Legacy",
      datumKreiranja: new Date("2026-05-18T08:00:00.000Z"),
      pacijent: { idKorisnik: 1, korisnik: { ime: "Ana", prezime: "Anić" } },
      doktor: { idKorisnik: 2 },
      komentari: [
        {
          id: 11,
          tekst: "Pacijent komentar",
          jeDoktor: false,
          datumKreiranja: new Date("2026-05-18T09:00:00.000Z"),
          korisnik: { ime: "Ana", prezime: "Anić" },
        },
        {
          id: 12,
          tekst: "Doktor komentar",
          jeDoktor: true,
          datumKreiranja: new Date("2026-05-18T10:00:00.000Z"),
          korisnik: { ime: "Dr.", prezime: "Marić" },
        },
      ],
    } as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getKomentari(req, res, next);

    expect(res.json).toHaveBeenCalledWith([
      { id: 11, tekst: "Pacijent komentar", autor: "Ana Anić", datum: "2026-05-18", jeDoktor: false },
      { id: 12, tekst: "Doktor komentar", autor: "Dr. Marić", datum: "2026-05-18", jeDoktor: true },
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it("koristi stari komentar kao fallback za rezervacije prije migracije", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      id: 1,
      komentar: "Stari komentar",
      datumKreiranja: new Date("2026-05-18T08:00:00.000Z"),
      pacijent: { idKorisnik: 1, korisnik: { ime: "Ana", prezime: "Anić" } },
      doktor: { idKorisnik: 2 },
      komentari: [],
    } as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getKomentari(req, res, next);

    expect(res.json).toHaveBeenCalledWith([{
      id: 1000,
      tekst: "Stari komentar",
      autor: "Ana Anić",
      datum: "2026-05-18",
      jeDoktor: false,
    }]);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// pomjeriRezervaciju (doktor)
// ─────────────────────────────────────────────
describe("pomjeriRezervaciju", () => {
  // Importovati na vrhu fajla:
  // import { pomjeriRezervaciju } from "../controllers/reservationController.js";

  const staraRezervacija = {
    id: 1,
    idTermina: 5,
    idDoktor: 2,
    idPacijent: 10,
    termin: { id: 5, datum: new Date("2027-06-01"), vrijeme: 540 },
    pacijent: { korisnik: { email: "test@test.com", ime: "Ana", prezime: "Anić" } },
    doktor: { korisnik: { ime: "Dr.", prezime: "Marić" }, specijalizacija: "Kardiologija" },
  };

  const noviTermin = {
    id: 7,
    idDoktor: 2,
    status: "SLOBODAN",
    datum: new Date("2027-07-01"),
    vrijeme: 600,
  };

  it("uspješno pomjera rezervaciju i briše Redis lock — US-11", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(staraRezervacija as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(noviTermin as any);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idStareRezervacije: 1, idNovogTermina: 7 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await pomjeriRezervaciju(req, res, next);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(redisMock.del).toHaveBeenCalledWith("termin:lock:7");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin uspješno pomjeren." });
    expect(next).not.toHaveBeenCalled();
  });

  it("šalje email pacijentu nakon uspješnog pomjeranja — US-11", async () => {
  vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(staraRezervacija as any);
  vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(noviTermin as any);
  vi.mocked(redisMock.get).mockResolvedValue("1");
  vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);
  vi.mocked(redisMock.del).mockResolvedValue(1);

  const { req, res, next } = mockReqRes(
    {},
    {},
    { idStareRezervacije: 1, idNovogTermina: 7 },
    { id: 1, uloga: "DOKTOR", doktorId: 2 }
  );
  await pomjeriRezervaciju(req, res, next);

  expect(posaljiPotvrdurezerv).toHaveBeenCalledWith(
    expect.objectContaining({
      pacijentEmail: "test@test.com",
    })
  );
});

  it("vraća 401 kada korisnik nije prijavljen", async () => {
    const { req, res, next } = mockReqRes(
      {},
      {},
      { idStareRezervacije: 1, idNovogTermina: 7 },
      null as any
    );
    // Simuliramo da korisnik nije prijavljen
    (req as any).korisnik = undefined;
    await pomjeriRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Niste prijavljeni." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 403 kada korisnik nema doktorId", async () => {
    const { req, res, next } = mockReqRes(
      {},
      {},
      { idStareRezervacije: 1, idNovogTermina: 7 },
      { id: 1, uloga: "DOKTOR" } // nema doktorId
    );
    await pomjeriRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nemate dozvolu." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada stara rezervacija nije pronađena", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idStareRezervacije: 999, idNovogTermina: 7 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await pomjeriRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
    expect(prismaMock.termin.findUnique).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 403 kada doktor pokušava pomjeriti tuđu rezervaciju", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      ...staraRezervacija,
      idDoktor: 99, // drugi doktor
    } as any);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idStareRezervacije: 1, idNovogTermina: 7 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await pomjeriRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nemate dozvolu za ovu rezervaciju." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada novi termin nije pronađen", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(staraRezervacija as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idStareRezervacije: 1, idNovogTermina: 999 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await pomjeriRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Novi termin nije pronađen." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 409 kada novi termin nije slobodan", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(staraRezervacija as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue({
      ...noviTermin,
      status: "ZAKAZAN",
    } as any);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idStareRezervacije: 1, idNovogTermina: 7 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await pomjeriRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Novi termin više nije slobodan." });
    expect(redisMock.get).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 409 kada termin nije zaključan u Redisu", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(staraRezervacija as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(noviTermin as any);
    vi.mocked(redisMock.get).mockResolvedValue(null);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idStareRezervacije: 1, idNovogTermina: 7 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await pomjeriRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin nije zaključan." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 409 kada je termin zaključan od drugog korisnika", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(staraRezervacija as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(noviTermin as any);
    vi.mocked(redisMock.get).mockResolvedValue("999"); // drugi korisnik

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idStareRezervacije: 1, idNovogTermina: 7 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await pomjeriRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin nije zaključan." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("ne briše Redis lock kada transakcija ne uspije", async () => {
    const greška = new Error("Transakcija pala");
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(staraRezervacija as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(noviTermin as any);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idStareRezervacije: 1, idNovogTermina: 7 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await pomjeriRezervaciju(req, res, next);

    expect(redisMock.del).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(greška);
  });

  it("poziva next pri DB grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.rezervacije.findUnique).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idStareRezervacije: 1, idNovogTermina: 7 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await pomjeriRezervaciju(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// kreirajRezervacijuDoktor
// ─────────────────────────────────────────────
describe("kreirajRezervacijuDoktor", () => {
  // Importovati na vrhu fajla:
  // import { kreirajRezervacijuDoktor } from "../controllers/reservationController.js";

  const lažniPacijentDoktor = {
    id: 10,
    idKorisnik: 5,
    korisnik: { id: 5, email: "pacijent@test.ba", ime: "Pera", prezime: "Perić" },
  };

  const buduciTerminMock = () => ({
    id: 5,
    idDoktor: 2,
    status: "SLOBODAN",
    datum: new Date(Date.now() + 48 * 60 * 60 * 1000),
    vrijeme: 540,
  });

  const lažnaRezervacija = {
    id: 55,
    idTermina: 5,
    idPacijent: 10,
    idDoktor: 2,
    termin: { id: 5, datum: new Date("2027-06-01"), vrijeme: 540 },
    pacijent: { korisnik: { ime: "Pera", prezime: "Perić", email: "pacijent@test.ba" } },
    doktor: { korisnik: { ime: "Dr.", prezime: "Marić" }, specijalizacija: "Kardiologija" },
    hitnost: false,
    komentar: null,
  };

  it("uspješno kreira rezervaciju i vraća je sa statusom 201", async () => {
    vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue(lažniPacijentDoktor as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue(lažnaRezervacija as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idTermina: 5, idPacijent: 10 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await kreirajRezervacijuDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(lažnaRezervacija);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 401 kada korisnik nije prijavljen", async () => {
    const { req, res, next } = mockReqRes({}, {}, { idTermina: 5, idPacijent: 10 }, null as any);
    (req as any).korisnik = undefined;
    await kreirajRezervacijuDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Niste prijavljeni." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 403 kada korisnik nema doktorId (nije doktor)", async () => {
    const { req, res, next } = mockReqRes(
      {},
      {},
      { idTermina: 5, idPacijent: 10 },
      { id: 1, uloga: "DOKTOR" } // nema doktorId
    );
    await kreirajRezervacijuDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nemate dozvolu za ovu akciju." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada idTermina nedostaje ili je nevalidan", async () => {
    const { req, res, next } = mockReqRes(
      {},
      {},
      { idPacijent: 10 }, // nema idTermina
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await kreirajRezervacijuDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nedostaje ispravan idTermina." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada idPacijent nedostaje ili je nevalidan", async () => {
    const { req, res, next } = mockReqRes(
      {},
      {},
      { idTermina: 5 }, // nema idPacijent
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await kreirajRezervacijuDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nedostaje ispravan idPacijent." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada pacijent nije pronađen", async () => {
    vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idTermina: 5, idPacijent: 999 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await kreirajRezervacijuDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Pacijent nije pronađen." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada termin nije pronađen", async () => {
    vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue(lažniPacijentDoktor as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idTermina: 999, idPacijent: 10 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await kreirajRezervacijuDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin nije pronađen." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 409 kada termin nije slobodan", async () => {
    vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue(lažniPacijentDoktor as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue({
      ...buduciTerminMock(),
      status: "ZAKAZAN",
    } as any);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idTermina: 5, idPacijent: 10 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await kreirajRezervacijuDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin više nije slobodan." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada je termin u prošlosti", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T12:00:00.000Z"));

    try {
      vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue(lažniPacijentDoktor as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue({
        id: 5,
        idDoktor: 2,
        status: "SLOBODAN",
        datum: new Date("2026-05-18T00:00:00.000Z"),
        vrijeme: 600,
      } as any);

      const { req, res, next } = mockReqRes(
        {},
        {},
        { idTermina: 5, idPacijent: 10 },
        { id: 1, uloga: "DOKTOR", doktorId: 2 }
      );
      await kreirajRezervacijuDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        poruka: "Nevalidna rezervacija: ne možete rezervisati termin u prošlosti.",
      });
      expect(next).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("vraća 409 za duplu rezervaciju", async () => {
    vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue(lažniPacijentDoktor as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue({ id: 1 } as any);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idTermina: 5, idPacijent: 10 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await kreirajRezervacijuDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija za ovaj termin već postoji." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 409 kada termin nije zaključan u Redisu", async () => {
    vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue(lažniPacijentDoktor as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue(null);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idTermina: 5, idPacijent: 10 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await kreirajRezervacijuDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin nije zaključan. Pokrenite proces ponovo." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("briše Redis lock nakon uspješne rezervacije", async () => {
    vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue(lažniPacijentDoktor as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTerminMock() as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue(lažnaRezervacija as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idTermina: 5, idPacijent: 10 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await kreirajRezervacijuDoktor(req, res, next);

    expect(redisMock.del).toHaveBeenCalledWith("termin:lock:5");
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri DB grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.pacijent.findUnique).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { idTermina: 5, idPacijent: 10 },
      { id: 1, uloga: "DOKTOR", doktorId: 2 }
    );
    await kreirajRezervacijuDoktor(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// dodajKomentarDoktor (iz reservationController)
// ─────────────────────────────────────────────
describe("dodajKomentarDoktor (reservationController)", () => {
  // Importovati na vrhu fajla:
  // import { dodajKomentarDoktor } from "../controllers/reservationController.js";

  const rezervacijaZaDoktora = {
    id: 1,
    idDoktor: 2,
    datumOtkazivanja: null,
    zavrseno: false,
    doktor: { idKorisnik: 2 },
    pacijent: { idKorisnik: 5 },
  };

  it("uspješno dodaje komentar doktora sa statusom 201", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacijaZaDoktora as any);
    vi.mocked(prismaMock.komentar.create).mockResolvedValue({
      id: 10,
      tekst: "Preporučujem odmor",
      jeDoktor: true,
      datumKreiranja: new Date("2026-05-18"),
      korisnik: { ime: "Dr.", prezime: "Marić" },
    } as any);

    const { req, res, next } = mockReqRes(
      { id: "1" },
      {},
      { komentar: "Preporučujem odmor" },
      { id: 2, uloga: "DOKTOR" }
    );
    await dodajKomentarDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      tekst: "Preporučujem odmor",
      jeDoktor: true,
      autor: "Dr. Marić",
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 403 kada uloga nije DOKTOR", async () => {
    const { req, res, next } = mockReqRes(
      { id: "1" },
      {},
      { komentar: "Test" },
      { id: 1, uloga: "PACIJENT" }
    );
    await dodajKomentarDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Samo doktori mogu koristiti ovu rutu." });
    expect(prismaMock.rezervacije.findUnique).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada je komentar prazan", async () => {
    const { req, res, next } = mockReqRes(
      { id: "1" },
      {},
      { komentar: "" },
      { id: 2, uloga: "DOKTOR" }
    );
    await dodajKomentarDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Komentar ne može biti prazan." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada rezervacija nije pronađena", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes(
      { id: "999" },
      {},
      { komentar: "Test" },
      { id: 2, uloga: "DOKTOR" }
    );
    await dodajKomentarDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
    expect(prismaMock.komentar.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada je rezervacija otkazana", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      ...rezervacijaZaDoktora,
      datumOtkazivanja: new Date("2026-05-01"),
    } as any);

    const { req, res, next } = mockReqRes(
      { id: "1" },
      {},
      { komentar: "Test" },
      { id: 2, uloga: "DOKTOR" }
    );
    await dodajKomentarDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nije moguće komentarisati otkazanu rezervaciju." });
    expect(prismaMock.komentar.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada je rezervacija završena", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      ...rezervacijaZaDoktora,
      zavrseno: true,
    } as any);

    const { req, res, next } = mockReqRes(
      { id: "1" },
      {},
      { komentar: "Test" },
      { id: 2, uloga: "DOKTOR" }
    );
    await dodajKomentarDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nije moguće komentarisati završenu rezervaciju." });
    expect(prismaMock.komentar.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 403 kada doktor pokušava komentarisati tuđu rezervaciju", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      ...rezervacijaZaDoktora,
      doktor: { idKorisnik: 99 }, // drugi doktor
    } as any);

    const { req, res, next } = mockReqRes(
      { id: "1" },
      {},
      { komentar: "Test" },
      { id: 2, uloga: "DOKTOR" }
    );
    await dodajKomentarDoktor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nemate dozvolu za komentarisanje ove rezervacije." });
    expect(prismaMock.komentar.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri DB grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(rezervacijaZaDoktora as any);
    vi.mocked(prismaMock.komentar.create).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes(
      { id: "1" },
      {},
      { komentar: "Test" },
      { id: 2, uloga: "DOKTOR" }
    );
    await dodajKomentarDoktor(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// otkaziRezervacijuOsoblje — dodatni testovi
// ─────────────────────────────────────────────
describe("otkaziRezervacijuOsoblje - dodatni", () => {
  it("vraća 400 kada je termin već prošao", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      id: 1,
      idTermina: 5,
      idDoktor: 2,
      termin: { id: 5, datum: new Date(Date.now() - 48 * 60 * 60 * 1000), vrijeme: 540 },
      pacijent: { korisnik: { email: "test@test.com" } },
      doktor: { korisnik: { ime: "Dr.", prezime: "Marić" }, specijalizacija: "Kardiologija" },
    } as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await otkaziRezervacijuOsoblje(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nije moguće otkazati termin koji je već prošao." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});