import { vi, describe, it, expect, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

// 1. Relativna putanja sa dva koraka unazad (iz __tests__ u src, pa u __mocks__)
import { prismaMock } from "../lib/__mocks__/prisma.js";
import { redisMock } from "../lib/__mocks__/redis.js";

import {
  getJavniPozivZaRecenziju,
  kreirajRecenziju,
  kreirajJavnuRecenziju,
  getRecenzijeZaDoktora,
  sakrijRecenziju,
} from "../controllers/recenzijaController.js";

// 2. Kada prosjeđuješ putanju u vi.mock(), ona mora biti relativna u odnosu na KONTROLER koji je uvozi,
// ili apsolutna u odnosu na src. Najsigurnije je mapirati tačan modul koji kontroler uvozi:
vi.mock("../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

// Ostatak testova ostaje potpuno isti...
const mockReqRes = (
  params = {},
  body = {},
  korisnik: any = { id: 1, uloga: "PACIJENT", doktorId: null }
) => ({
  req: { params, body, korisnik } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any,
  next: vi.fn(),
});

beforeEach(() => {
  // Napomena: mockReset(prismaMock) se automatski izvršava u tvom __mocks__/prisma.ts fajlu
  process.env.JWT_SECRET = "test-secret";
});

describe("kreirajRecenziju", () => {
  it("kreira anonimnu ocjenu bez spremanja pacijent FK-a i sa selektovanim poljem sakriven", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 10 } as any);
    prismaMock.rezervacije.findUnique.mockResolvedValue({
      id: 42,
      idPacijent: 10,
      zavrseno: true,
      datumOtkazivanja: null,
      recenzija: null,
    } as any);
    
    // Kontroler sad očekuje i polje 'sakriven' nazad iz baze
    prismaMock.recenzija.create.mockResolvedValue({
      id: 7,
      ocjena: 5,
      komentar: "Odličan pristup.",
      kreiranoAt: new Date("2026-05-23T09:00:00.000Z"),
      sakriven: false,
    } as any);

    const { req, res, next } = mockReqRes(
      { id: "42" },
      { rating: 5, comment: "Odličan pristup." }
    );

    await kreirajRecenziju(req, res, next);

    // Provjera da li create šalje tačan select blok bazi
    expect(prismaMock.recenzija.create).toHaveBeenCalledWith({
      data: {
        idRezervacije: 42,
        ocjena: 5,
        komentar: "Odličan pristup.",
      },
      select: {
        id: true,
        ocjena: true,
        komentar: true,
        kreiranoAt: true,
        sakriven: true, // 👈 Provjera za novo polje
      },
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        poruka: "Hvala na anonimnoj ocjeni.",
        review: expect.objectContaining({ rating: 5, comment: "Odličan pristup." }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("ne dozvoljava ocjenu izvan raspona 1-5", async () => {
    const { req, res, next } = mockReqRes({ id: "42" }, { rating: 6 });

    await kreirajRecenziju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Ocjena je obavezna i mora biti broj od 1 do 5." });
    expect(prismaMock.recenzija.create).not.toHaveBeenCalled();
  });

  it("ne dozvoljava da se isti termin ocijeni dva puta", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 10 } as any);
    prismaMock.rezervacije.findUnique.mockResolvedValue({
      id: 42,
      idPacijent: 10,
      zavrseno: true,
      datumOtkazivanja: null,
      recenzija: { id: 3 },
    } as any);

    const { req, res, next } = mockReqRes({ id: "42" }, { rating: 4 });

    await kreirajRecenziju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Ovaj termin je već ocijenjen." });
  });
});

describe("javna anonimna recenzija iz email linka", () => {
  const generisiToken = () => jwt.sign(
    { appointmentId: 42, purpose: "appointment-review" },
    process.env.JWT_SECRET!
  );

  it("vraća podatke potrebne za javnu formu (uključujući i sakriven parametar u selectu)", async () => {
    prismaMock.rezervacije.findUnique.mockResolvedValue({
      id: 42,
      zavrseno: true,
      datumOtkazivanja: null,
      recenzija: null,
      termin: { datum: new Date("2026-05-23T00:00:00.000Z"), vrijeme: 600 },
      doktor: { korisnik: { ime: "Amina", prezime: "Hadzic" } },
    } as any);

    const { req, res, next } = mockReqRes({ token: generisiToken() });

    await getJavniPozivZaRecenziju(req, res, next);

    // Provjera da li findUnique povlači i sakriven u recenziji
    expect(prismaMock.rezervacije.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          recenzija: {
            select: { id: true, ocjena: true, komentar: true, kreiranoAt: true, sakriven: true }
          }
        })
      })
    );

    expect(res.json).toHaveBeenCalledWith({
      appointment: expect.objectContaining({
        id: 42,
        doctorName: "Dr. Amina Hadzic",
        canReview: true,
        review: null,
      }),
    });
  });

  it("kreira recenziju preko tokena bez login sesije", async () => {
    prismaMock.rezervacije.findUnique.mockResolvedValue({
      id: 42,
      idPacijent: 10,
      zavrseno: true,
      datumOtkazivanja: null,
      recenzija: null,
    } as any);
    prismaMock.recenzija.create.mockResolvedValue({
      id: 8,
      ocjena: 4,
      komentar: "Vrlo korektan pregled.",
      kreiranoAt: new Date("2026-05-23T09:00:00.000Z"),
      sakriven: false,
    } as any);

    const { req, res, next } = mockReqRes(
      { token: generisiToken() },
      { rating: 4, comment: "Vrlo korektan pregled." },
      null // Nema ulogovanog korisnika
    );

    await kreirajJavnuRecenziju(req, res, next);

    expect(prismaMock.recenzija.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { idRezervacije: 42, ocjena: 4, komentar: "Vrlo korektan pregled." },
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("getRecenzijeZaDoktora", () => {
  it("računa prosjek sa svim recenzijama, ali sakriva tekst komentara ako je sakriven: true", async () => {
    // Simuliramo 3 recenzije: jedna je sakrivena, ali njena ocjena (1) i dalje ulazi u prosjek
    prismaMock.recenzija.findMany.mockResolvedValue([
      { id: 1, ocjena: 1, komentar: "Loša komunikacija.", sakriven: true, kreiranoAt: new Date("2026-05-20") },
      { id: 2, ocjena: 5, komentar: "Odlično iskustvo.", sakriven: false, kreiranoAt: new Date("2026-05-21") },
      { id: 3, ocjena: 4, komentar: null, sakriven: false, kreiranoAt: new Date("2026-05-22") },
    ] as any);

    const { req, res, next } = mockReqRes({ id: "2" }, {}, { id: 8, uloga: "DOKTOR", doktorId: 2 });

    await getRecenzijeZaDoktora(req, res, next);

    // Provjera da u 'where' klauzuli više NEMA sakriven: false, jer sad povlačimo sve!
    expect(prismaMock.recenzija.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { rezervacija: { idDoktor: 2 } },
      })
    );

    // Unija ocjena: (1 + 5 + 4) / 3 = 3.33
    // Komentari: Prvi pacijent ima sakriven komentar pa njegov tekst mora biti null!
    expect(res.json).toHaveBeenCalledWith({
      doctorId: 2,
      averageRating: 3.33,
      reviewCount: 3,
      comments: [
        expect.objectContaining({ author: "Anonymous Patient 1", rating: 1, comment: null }), // 👈 Tekst zamijenjen sa null!
        expect.objectContaining({ author: "Anonymous Patient 2", rating: 5, comment: "Odlično iskustvo." }),
      ],
    });
  });
});

describe("sakrijRecenziju", () => {
  it("administrator može sakriti ili ponovo otkriti recenziju", async () => {
    prismaMock.recenzija.findUnique.mockResolvedValue({ id: 9 } as any);
    prismaMock.recenzija.update.mockResolvedValue({
      id: 9,
      ocjena: 2,
      komentar: "Neprimjeren komentar",
      sakriven: true,
      sakrivenAt: new Date(),
      kreiranoAt: new Date(),
    } as any);

    const { req, res, next } = mockReqRes(
      { id: "9" },
      { hidden: true },
      { id: 1, uloga: "ADMINISTRATOR", doktorId: null }
    );

    await sakrijRecenziju(req, res, next);

    expect(prismaMock.recenzija.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 9 },
        data: { sakriven: true, sakrivenAt: expect.any(Date) },
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        poruka: "Komentar je sakriven.",
        review: expect.objectContaining({ hidden: true }),
      })
    );
  });
});