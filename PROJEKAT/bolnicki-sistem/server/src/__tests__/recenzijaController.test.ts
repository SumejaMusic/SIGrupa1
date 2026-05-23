import { vi, describe, it, expect, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import {
  getJavniPozivZaRecenziju,
  kreirajRecenziju,
  kreirajJavnuRecenziju,
  getRecenzijeZaDoktora,
  sakrijRecenziju,
} from "../controllers/recenzijaController.js";

vi.mock("../lib/prisma.js");

const mockReqRes = (
  params = {},
  body = {},
  korisnik = { id: 1, uloga: "PACIJENT", doktorId: null }
) => ({
  req: { params, body, korisnik } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any,
  next: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = "test-secret";
});

describe("kreirajRecenziju", () => {
  it("kreira anonimnu ocjenu bez spremanja pacijent FK-a", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue({ id: 10 } as any);
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      id: 42,
      idPacijent: 10,
      zavrseno: true,
      datumOtkazivanja: null,
      recenzija: null,
    } as any);
    vi.mocked(prismaMock.recenzija.create).mockResolvedValue({
      id: 7,
      ocjena: 5,
      komentar: "Odličan pristup.",
      kreiranoAt: new Date("2026-05-23T09:00:00.000Z"),
    } as any);

    const { req, res, next } = mockReqRes(
      { id: "42" },
      { rating: 5, comment: "Odličan pristup." },
      { id: 1, uloga: "PACIJENT", doktorId: null }
    );

    await kreirajRecenziju(req, res, next);

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
      },
    });

    const dataArg = vi.mocked(prismaMock.recenzija.create).mock.calls[0][0].data as any;
    expect(dataArg.idPacijent).toBeUndefined();
    expect(dataArg.patientId).toBeUndefined();
    expect(dataArg.idKorisnik).toBeUndefined();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      poruka: "Hvala na anonimnoj ocjeni.",
      review: expect.objectContaining({ rating: 5, comment: "Odličan pristup." }),
    }));
    expect(JSON.stringify(vi.mocked(res.json).mock.calls[0][0])).not.toContain("Pacijent");
    expect(next).not.toHaveBeenCalled();
  });

  it("ne dozvoljava ocjenu izvan raspona 1-5", async () => {
    const { req, res, next } = mockReqRes({ id: "42" }, { rating: 6 });

    await kreirajRecenziju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Ocjena je obavezna i mora biti broj od 1 do 5." });
    expect(prismaMock.recenzija.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("ne dozvoljava da se isti termin ocijeni dva puta", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue({ id: 10 } as any);
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
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
    expect(prismaMock.recenzija.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("ne dozvoljava ocjenjivanje nezavršenog pregleda", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue({ id: 10 } as any);
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      id: 42,
      idPacijent: 10,
      zavrseno: false,
      datumOtkazivanja: null,
      recenzija: null,
    } as any);

    const { req, res, next } = mockReqRes({ id: "42" }, { rating: 4 });

    await kreirajRecenziju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Ocjenu možete ostaviti tek nakon završenog pregleda." });
    expect(prismaMock.recenzija.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

describe("javna anonimna recenzija iz email linka", () => {
  const token = () => jwt.sign(
    { appointmentId: 42, purpose: "appointment-review" },
    process.env.JWT_SECRET!
  );

  it("vraća podatke potrebne za javnu formu bez podataka o pacijentu", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      id: 42,
      zavrseno: true,
      datumOtkazivanja: null,
      recenzija: null,
      termin: {
        datum: new Date("2026-05-23T00:00:00.000Z"),
        vrijeme: 600,
      },
      doktor: {
        korisnik: { ime: "Amina", prezime: "Hadzic" },
      },
    } as any);

    const { req, res, next } = mockReqRes({ token: token() });

    await getJavniPozivZaRecenziju(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      appointment: expect.objectContaining({
        id: 42,
        doctorName: "Dr. Amina Hadzic",
        canReview: true,
        review: null,
      }),
    });
    expect(JSON.stringify(vi.mocked(res.json).mock.calls[0][0])).not.toMatch(/idPacijent|idKorisnik|pacijent|email/i);
    expect(next).not.toHaveBeenCalled();
  });

  it("kreira recenziju preko tokena bez login sesije", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      id: 42,
      idPacijent: 10,
      zavrseno: true,
      datumOtkazivanja: null,
      recenzija: null,
    } as any);
    vi.mocked(prismaMock.recenzija.create).mockResolvedValue({
      id: 8,
      ocjena: 4,
      komentar: "Vrlo korektan pregled.",
      kreiranoAt: new Date("2026-05-23T09:00:00.000Z"),
    } as any);

    const { req, res, next } = mockReqRes(
      { token: token() },
      { rating: 4, comment: "Vrlo korektan pregled." },
      undefined
    );

    await kreirajJavnuRecenziju(req, res, next);

    expect(prismaMock.recenzija.create).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        idRezervacije: 42,
        ocjena: 4,
        komentar: "Vrlo korektan pregled.",
      },
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      poruka: "Hvala na anonimnoj ocjeni.",
      review: expect.objectContaining({ rating: 4, comment: "Vrlo korektan pregled." }),
    }));
    expect(next).not.toHaveBeenCalled();
  });
});

describe("getRecenzijeZaDoktora", () => {
  it("vraća prosjek i anonimne komentare bez podataka o pacijentu", async () => {
    vi.mocked(prismaMock.recenzija.findMany).mockResolvedValue([
      { id: 1, ocjena: 1, komentar: "Loša komunikacija.", kreiranoAt: new Date("2026-05-20") },
      { id: 2, ocjena: 5, komentar: "Odlično iskustvo.", kreiranoAt: new Date("2026-05-21") },
      { id: 3, ocjena: 4, komentar: null, kreiranoAt: new Date("2026-05-22") },
    ] as any);

    const { req, res, next } = mockReqRes(
      { id: "2" },
      {},
      { id: 8, uloga: "DOKTOR", doktorId: 2 }
    );

    await getRecenzijeZaDoktora(req, res, next);

    expect(prismaMock.recenzija.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        sakriven: false,
        rezervacija: { idDoktor: 2 },
      },
    }));
    expect(res.json).toHaveBeenCalledWith({
      doctorId: 2,
      averageRating: 3.33,
      reviewCount: 3,
      comments: [
        expect.objectContaining({ author: "Anonymous Patient 1", rating: 1, comment: "Loša komunikacija." }),
        expect.objectContaining({ author: "Anonymous Patient 2", rating: 5, comment: "Odlično iskustvo." }),
      ],
    });
    expect(JSON.stringify(vi.mocked(res.json).mock.calls[0][0])).not.toMatch(/idPacijent|idKorisnik|ime|prezime/i);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("sakrijRecenziju", () => {
  it("administrator može sakriti komentar koji krši pravila", async () => {
    vi.mocked(prismaMock.recenzija.findUnique).mockResolvedValue({ id: 9 } as any);
    vi.mocked(prismaMock.recenzija.update).mockResolvedValue({
      id: 9,
      ocjena: 2,
      komentar: "Neprimjeren komentar",
      sakriven: true,
      sakrivenAt: new Date("2026-05-23T10:00:00.000Z"),
      kreiranoAt: new Date("2026-05-22T10:00:00.000Z"),
    } as any);

    const { req, res, next } = mockReqRes(
      { id: "9" },
      {},
      { id: 1, uloga: "ADMINISTRATOR", doktorId: null }
    );

    await sakrijRecenziju(req, res, next);

    expect(prismaMock.recenzija.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 9 },
      data: expect.objectContaining({ sakriven: true }),
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      poruka: "Komentar je sakriven.",
      review: expect.objectContaining({ hidden: true }),
    }));
    expect(next).not.toHaveBeenCalled();
  });
});
