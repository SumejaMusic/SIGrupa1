import { vi, describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import {
  kreirajReview,
  getReviewsZaDoktora,
  sakrijReview,
} from "../controllers/reviewController.js";

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
});

describe("kreirajReview", () => {
  it("kreira anonimnu ocjenu bez spremanja pacijent FK-a", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue({ id: 10 } as any);
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      id: 42,
      idPacijent: 10,
      zavrseno: true,
      datumOtkazivanja: null,
      review: null,
    } as any);
    vi.mocked(prismaMock.review.create).mockResolvedValue({
      id: 7,
      rating: 5,
      comment: "Odličan pristup.",
      createdAt: new Date("2026-05-23T09:00:00.000Z"),
    } as any);

    const { req, res, next } = mockReqRes(
      { id: "42" },
      { rating: 5, comment: "Odličan pristup." },
      { id: 1, uloga: "PACIJENT", doktorId: null }
    );

    await kreirajReview(req, res, next);

    expect(prismaMock.review.create).toHaveBeenCalledWith({
      data: {
        appointmentId: 42,
        rating: 5,
        comment: "Odličan pristup.",
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });

    const dataArg = vi.mocked(prismaMock.review.create).mock.calls[0][0].data as any;
    expect(dataArg.idPacijent).toBeUndefined();
    expect(dataArg.patientId).toBeUndefined();

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

    await kreirajReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Ocjena je obavezna i mora biti broj od 1 do 5." });
    expect(prismaMock.review.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("ne dozvoljava da se isti termin ocijeni dva puta", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue({ id: 10 } as any);
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      id: 42,
      idPacijent: 10,
      zavrseno: true,
      datumOtkazivanja: null,
      review: { id: 3 },
    } as any);

    const { req, res, next } = mockReqRes({ id: "42" }, { rating: 4 });

    await kreirajReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Ovaj termin je već ocijenjen." });
    expect(prismaMock.review.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("ne dozvoljava ocjenjivanje nezavršenog pregleda", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue({ id: 10 } as any);
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
      id: 42,
      idPacijent: 10,
      zavrseno: false,
      datumOtkazivanja: null,
      review: null,
    } as any);

    const { req, res, next } = mockReqRes({ id: "42" }, { rating: 4 });

    await kreirajReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Ocjenu možete ostaviti tek nakon završenog pregleda." });
    expect(prismaMock.review.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

describe("getReviewsZaDoktora", () => {
  it("vraća prosjek i anonimne komentare bez podataka o pacijentu", async () => {
    vi.mocked(prismaMock.review.findMany).mockResolvedValue([
      { id: 1, rating: 1, comment: "Loša komunikacija.", createdAt: new Date("2026-05-20") },
      { id: 2, rating: 5, comment: "Odlično iskustvo.", createdAt: new Date("2026-05-21") },
      { id: 3, rating: 4, comment: null, createdAt: new Date("2026-05-22") },
    ] as any);

    const { req, res, next } = mockReqRes(
      { id: "2" },
      {},
      { id: 8, uloga: "DOKTOR", doktorId: 2 }
    );

    await getReviewsZaDoktora(req, res, next);

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        hidden: false,
        appointment: { idDoktor: 2 },
      },
    }));
    expect(res.json).toHaveBeenCalledWith({
      doctorId: 2,
      averageRating: 3.33,
      reviewCount: 3,
      comments: [
        expect.objectContaining({ author: "Anonymous Pacijent 1", rating: 1, comment: "Loša komunikacija." }),
        expect.objectContaining({ author: "Anonymous Pacijent 2", rating: 5, comment: "Odlično iskustvo." }),
      ],
    });
    expect(JSON.stringify(vi.mocked(res.json).mock.calls[0][0])).not.toMatch(/idPacijent|idKorisnik|ime|prezime/i);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("sakrijReview", () => {
  it("administrator može sakriti komentar koji krši pravila", async () => {
    vi.mocked(prismaMock.review.findUnique).mockResolvedValue({ id: 9 } as any);
    vi.mocked(prismaMock.review.update).mockResolvedValue({
      id: 9,
      rating: 2,
      comment: "Neprimjeren komentar",
      hidden: true,
      hiddenAt: new Date("2026-05-23T10:00:00.000Z"),
      createdAt: new Date("2026-05-22T10:00:00.000Z"),
    } as any);

    const { req, res, next } = mockReqRes(
      { id: "9" },
      {},
      { id: 1, uloga: "ADMINISTRATOR", doktorId: null }
    );

    await sakrijReview(req, res, next);

    expect(prismaMock.review.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 9 },
      data: expect.objectContaining({ hidden: true }),
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      poruka: "Komentar je sakriven.",
      review: expect.objectContaining({ hidden: true }),
    }));
    expect(next).not.toHaveBeenCalled();
  });
});
