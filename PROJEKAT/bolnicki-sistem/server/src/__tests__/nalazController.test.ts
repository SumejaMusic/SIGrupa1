import { vi, describe, it, expect } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import {
  getNalaziZaPacijenta,
  getNalazPDF,
  getNalaziZaRezervaciju,
} from "../controllers/nalazController.js";

vi.mock("../lib/prisma.js");

const mockReqRes = (params = {}, query = {}, body = {}) => ({
  req: { params, query, body } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    send: vi.fn(),
  } as any,
  next: vi.fn(),
});

// ─────────────────────────────────────────────
// getNalaziZaPacijenta
// ─────────────────────────────────────────────
describe("getNalaziZaPacijenta", () => {

  it("vraća nalaze za pacijenta poredane po datumu — happy path", async () => {
    const lažniNalazi = [
      { id: 1, naziv: "Krvna slika", vrijemeNalaza: new Date("2025-06-01"), opis: "Uredu" },
      { id: 2, naziv: "EKG", vrijemeNalaza: new Date("2025-05-01"), opis: null },
    ];
    vi.mocked(prismaMock.nalaz.findMany).mockResolvedValue(lažniNalazi as any);

    const { req, res, next } = mockReqRes({ pacijentId: "1" });
    await getNalaziZaPacijenta(req, res, next);

    expect(prismaMock.nalaz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          pregledi: { some: { idPacijent: 1 } },
        },
        orderBy: { vrijemeNalaza: "desc" },
      })
    );
    expect(res.json).toHaveBeenCalledWith(lažniNalazi);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća prazan niz kada pacijent nema nalaza", async () => {
    vi.mocked(prismaMock.nalaz.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({ pacijentId: "1" });
    await getNalaziZaPacijenta(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("konvertuje string pacijentId u broj", async () => {
    vi.mocked(prismaMock.nalaz.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({ pacijentId: "42" });
    await getNalaziZaPacijenta(req, res, next);

    expect(prismaMock.nalaz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pregledi: { some: { idPacijent: 42 } } },
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("ne vraća dokumentPDF u odgovoru", async () => {
    vi.mocked(prismaMock.nalaz.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({ pacijentId: "1" });
    await getNalaziZaPacijenta(req, res, next);

    expect(prismaMock.nalaz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({ dokumentPDF: true }),
      })
    );
  });

  it("poziva next pri grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.nalaz.findMany).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ pacijentId: "1" });
    await getNalaziZaPacijenta(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// getNalazPDF
// ─────────────────────────────────────────────
describe("getNalazPDF", () => {

  it("vraća PDF kada nalaz postoji — happy path", async () => {
    const lažniNalaz = {
      id: 1,
      naziv: "Krvna slika",
      dokumentPDF: Buffer.from("PDF sadrzaj"),
    };
    vi.mocked(prismaMock.nalaz.findUnique).mockResolvedValue(lažniNalaz as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getNalazPDF(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      `inline; filename="${lažniNalaz.naziv}"`
    );
    expect(res.send).toHaveBeenCalledWith(lažniNalaz.dokumentPDF);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada nalaz nije pronađen", async () => {
    vi.mocked(prismaMock.nalaz.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ id: "999" });
    await getNalazPDF(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nalaz nije pronađen." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada PDF nije priložen", async () => {
    const lažniNalaz = { id: 1, naziv: "Krvna slika", dokumentPDF: null };
    vi.mocked(prismaMock.nalaz.findUnique).mockResolvedValue(lažniNalaz as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getNalazPDF(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "PDF nije priložen uz ovaj nalaz." });
    expect(next).not.toHaveBeenCalled();
  });

  it("konvertuje string ID u broj", async () => {
    vi.mocked(prismaMock.nalaz.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ id: "42" });
    await getNalazPDF(req, res, next);

    expect(prismaMock.nalaz.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } })
    );
  });

  it("poziva next pri grešci", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.nalaz.findUnique).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getNalazPDF(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// getNalaziZaRezervaciju
// ─────────────────────────────────────────────
describe("getNalaziZaRezervaciju", () => {

  it("vraća nalaz za rezervaciju — happy path", async () => {
    const lažnaHistorija = {
      id: 1,
      idRezervacija: 5,
      nalaz: { id: 1, naziv: "Krvna slika", vrijemeNalaza: new Date(), opis: null },
    };
    vi.mocked(prismaMock.historijaPregleda.findUnique).mockResolvedValue(lažnaHistorija as any);

    const { req, res, next } = mockReqRes({ rezervacijaId: "5" });
    await getNalaziZaRezervaciju(req, res, next);

    expect(prismaMock.historijaPregleda.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idRezervacija: 5 } })
    );
    expect(res.json).toHaveBeenCalledWith([lažnaHistorija.nalaz]);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća prazan niz kada nema historije pregleda", async () => {
    vi.mocked(prismaMock.historijaPregleda.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ rezervacijaId: "5" });
    await getNalaziZaRezervaciju(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća prazan niz kada historija nema nalaza", async () => {
    const lažnaHistorija = { id: 1, idRezervacija: 5, nalaz: null };
    vi.mocked(prismaMock.historijaPregleda.findUnique).mockResolvedValue(lažnaHistorija as any);

    const { req, res, next } = mockReqRes({ rezervacijaId: "5" });
    await getNalaziZaRezervaciju(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("konvertuje string rezervacijaId u broj", async () => {
    vi.mocked(prismaMock.historijaPregleda.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ rezervacijaId: "99" });
    await getNalaziZaRezervaciju(req, res, next);

    expect(prismaMock.historijaPregleda.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idRezervacija: 99 } })
    );
  });

  it("poziva next pri grešci", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.historijaPregleda.findUnique).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ rezervacijaId: "5" });
    await getNalaziZaRezervaciju(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });
});