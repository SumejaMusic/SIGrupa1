import { vi, describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";

vi.mock("../lib/prisma.js");

// Mock redis — koristi se u kreirajTerminZaPacijenta
vi.mock("../lib/redis.js", () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
  },
}));

// Mock socket.io — io.emit se poziva nakon rezervacije
vi.mock("../app.js", () => ({
  io: { emit: vi.fn() },
}));

// Mock osobljeService — sve funkcije koje controller poziva
vi.mock("../osobljeService.js", () => ({
  getDnevniTerminiService: vi.fn(),
  pretragaTerminaService: vi.fn(),
  getDetaljiTerminaService: vi.fn(),
  otkaziTerminService: vi.fn(),
  kreirajTerminZaPacijentomService: vi.fn(),
  dodajNalazService: vi.fn(),
  getNalaziPacijentaService: vi.fn(),
  getNalazPDFService: vi.fn(),
  getOtkazaniTerminiService: vi.fn(),
  getHitniTerminiService: vi.fn(),
  getZavrseniPregledService: vi.fn(),
  postaviHitnostService: vi.fn(),
  getAllPacijentiService: vi.fn(),
  getAllDoktoriService: vi.fn(),
  getAllOdjeliService: vi.fn(),
  getAllSobeService: vi.fn(),
  getSlobodniTerminiDoktoraService: vi.fn(),
  getTipoviPregledaService: vi.fn(),
  getSlobodniDatumiDoktoraService: vi.fn(),
  getAllTerminiService: vi.fn(),
}));

import {
  getDnevniTermini,
  pretragaTermina,
  getDetaljiTermina,
  otkaziTermin,
  kreirajTerminZaPacijenta,
  dodajNalaz,
  getNalaziPacijenta,
  getNalazPDF,
  getOtkazaniTermini,
  getHitniTermini,
  getZavrseniPregledi,
  postaviHitnost,
  getAllPacijenti,
  getAllDoktori,
  getAllOdjeli,
  getAllSobe,
  getAllTermini,
  getSlobodniTerminiDoktora,
  getTipoviPregleda,
  getSlobodniDatumiDoktora,
} from "../controllers/osobljeController.ts";

import {
  getDnevniTerminiService,
  pretragaTerminaService,
  getDetaljiTerminaService,
  otkaziTerminService,
  kreirajTerminZaPacijentomService,
  dodajNalazService,
  getNalaziPacijentaService,
  getNalazPDFService,
  getOtkazaniTerminiService,
  getHitniTerminiService,
  getZavrseniPregledService,
  postaviHitnostService,
  getAllPacijentiService,
  getAllDoktoriService,
  getAllOdjeliService,
  getAllSobeService,
  getSlobodniTerminiDoktoraService,
  getTipoviPregledaService,
  getSlobodniDatumiDoktoraService,
  getAllTerminiService,
} from "../osobljeService.ts";

// ─── Helper: kreira mock req/res/next ────────────────────────────────────────
const mockReqRes = (params = {}, query = {}, body = {}, headers = {}) => ({
  req: { params, query, body, headers } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    send: vi.fn(),
  } as any,
  next: vi.fn(),
});

// ─── Helper: lažni termin ────────────────────────────────────────────────────
const mockTermin = (overrides = {}) => ({
  id: 1,
  datum: new Date("2026-05-17"),
  pacijent: { ime: "Amina", prezime: "Hodžić" },
  doktor: { korisnik: { ime: "Dr.", prezime: "Ahmetović" } },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. getDnevniTermini
// ═════════════════════════════════════════════════════════════════════════════
describe("getDnevniTermini", () => {
  it("vraća termine za proslijeđeni datum", async () => {
    const termini = [mockTermin()];
    vi.mocked(getDnevniTerminiService).mockResolvedValue(termini as any);

    const { req, res, next } = mockReqRes({}, { datum: "2026-05-17" });
    await getDnevniTermini(req, res, next);

    expect(getDnevniTerminiService).toHaveBeenCalledWith(expect.any(Date));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(termini);
    expect(next).not.toHaveBeenCalled();
  });

  it("koristi današnji datum kada datum nije proslijeđen", async () => {
    vi.mocked(getDnevniTerminiService).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, {});
    await getDnevniTermini(req, res, next);

    expect(getDnevniTerminiService).toHaveBeenCalledWith(expect.any(Date));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("vraća 400 za neispravan format datuma", async () => {
    const { req, res, next } = mockReqRes({}, { datum: "nije-datum" });
    await getDnevniTermini(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("YYYY-MM-DD") })
    );
    expect(getDnevniTerminiService).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("DB greška");
    vi.mocked(getDnevniTerminiService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, { datum: "2026-05-17" });
    await getDnevniTermini(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. pretragaTermina
// ═════════════════════════════════════════════════════════════════════════════
describe("pretragaTermina", () => {
  it("vraća termine za ispravno ime", async () => {
    const termini = [mockTermin()];
    vi.mocked(pretragaTerminaService).mockResolvedValue(termini as any);

    const { req, res, next } = mockReqRes({}, { ime: "Amina" });
    await pretragaTermina(req, res, next);

    expect(pretragaTerminaService).toHaveBeenCalledWith("Amina");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(termini);
  });

  it("vraća 400 kada ime nije proslijeđeno", async () => {
    const { req, res, next } = mockReqRes({}, {});
    await pretragaTermina(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pretragaTerminaService).not.toHaveBeenCalled();
  });

  it("vraća 400 kada je ime kraće od 2 karaktera", async () => {
    const { req, res, next } = mockReqRes({}, { ime: "A" });
    await pretragaTermina(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("2 karaktera") })
    );
    expect(pretragaTerminaService).not.toHaveBeenCalled();
  });

  it("trimuuje razmake iz query parametra", async () => {
    vi.mocked(pretragaTerminaService).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, { ime: "  Amina  " });
    await pretragaTermina(req, res, next);

    expect(pretragaTerminaService).toHaveBeenCalledWith("Amina");
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("Greška");
    vi.mocked(pretragaTerminaService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, { ime: "Amina" });
    await pretragaTermina(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. getDetaljiTermina
// ═════════════════════════════════════════════════════════════════════════════
describe("getDetaljiTermina", () => {
  it("vraća detalje rezervacije po ID-u", async () => {
    const termin = mockTermin();
    vi.mocked(getDetaljiTerminaService).mockResolvedValue(termin as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getDetaljiTermina(req, res, next);

    expect(getDetaljiTerminaService).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(termin);
  });

  it("vraća 404 kada rezervacija ne postoji", async () => {
    vi.mocked(getDetaljiTerminaService).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ id: "999" });
    await getDetaljiTermina(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
  });

  it("vraća 400 za neispravan ID", async () => {
    const { req, res, next } = mockReqRes({ id: "abc" });
    await getDetaljiTermina(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(getDetaljiTerminaService).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("DB greška");
    vi.mocked(getDetaljiTerminaService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getDetaljiTermina(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. otkaziTermin
// ═════════════════════════════════════════════════════════════════════════════
describe("otkaziTermin", () => {
  it("uspješno otkazuje termin kada je potvrda true", async () => {
    const rezultat = { id: 1, status: "OTKAZAN" };
    vi.mocked(otkaziTerminService).mockResolvedValue(rezultat as any);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { potvrda: true });
    await otkaziTermin(req, res, next);

    expect(otkaziTerminService).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rezultat);
  });

  it("vraća 400 kada potvrda nije true", async () => {
    const { req, res, next } = mockReqRes({ id: "1" }, {}, { potvrda: false });
    await otkaziTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("potvrda: true") })
    );
    expect(otkaziTerminService).not.toHaveBeenCalled();
  });

  it("vraća 400 kada potvrda nije proslijeđena", async () => {
    const { req, res, next } = mockReqRes({ id: "1" }, {}, {});
    await otkaziTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(otkaziTerminService).not.toHaveBeenCalled();
  });

  it("vraća 400 za neispravan ID", async () => {
    const { req, res, next } = mockReqRes({ id: "abc" }, {}, { potvrda: true });
    await otkaziTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(otkaziTerminService).not.toHaveBeenCalled();
  });

  it("vraća grešku sa statusom iz service-a (npr. 409 već otkazan)", async () => {
    const serviceGreška = { status: 409, poruka: "Termin je već otkazan." };
    vi.mocked(otkaziTerminService).mockRejectedValue(serviceGreška);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { potvrda: true });
    await otkaziTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin je već otkazan." });
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next za neočekivane greške", async () => {
    const greška = new Error("DB greška");
    vi.mocked(otkaziTerminService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { potvrda: true });
    await otkaziTermin(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. kreirajTerminZaPacijenta
// ═════════════════════════════════════════════════════════════════════════════
describe("kreirajTerminZaPacijenta", () => {
  const validBody = {
    idTermina: 5,
    idDoktor: 2,
    idPacijent: 3,
    idTipPregleda: 1,
    komentar: "Test",
    hitnost: false,
  };

  it("uspješno kreira rezervaciju sa validnim podacima", async () => {
    const rezervacija = { id: 10, idTermina: 5 };
    vi.mocked(kreirajTerminZaPacijentomService).mockResolvedValue(rezervacija as any);

    const { req, res, next } = mockReqRes({}, {}, validBody);
    await kreirajTerminZaPacijenta(req, res, next);

    expect(kreirajTerminZaPacijentomService).toHaveBeenCalledWith(
      expect.objectContaining({
        idTermina: 5,
        idDoktor: 2,
        idPacijent: 3,
        idTipPregleda: 1,
        hitnost: false,
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(rezervacija);
  });

  it("vraća 400 kada nedostaju obavezna polja", async () => {
    const { req, res, next } = mockReqRes({}, {}, { idDoktor: 2 }); // nema idTermina i idPacijent
    await kreirajTerminZaPacijenta(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("idTermina") })
    );
    expect(kreirajTerminZaPacijentomService).not.toHaveBeenCalled();
  });

  it("vraća 409 kada je termin zaključan (Redis lock)", async () => {
    const { redis } = await import("../lib/redis.js");
    vi.mocked(redis.get).mockResolvedValue("osoblje"); // Lock je postavljen

    const { req, res, next } = mockReqRes({}, {}, validBody);
    await kreirajTerminZaPacijenta(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("procesu rezervacije") })
    );
    expect(kreirajTerminZaPacijentomService).not.toHaveBeenCalled();
  });

  it("oslobađa Redis lock i poziva next kada service baci grešku", async () => {
    const { redis } = await import("../lib/redis.js");
    vi.mocked(redis.get).mockResolvedValue(null);
    const greška = new Error("DB greška");
    vi.mocked(kreirajTerminZaPacijentomService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {}, validBody);
    await kreirajTerminZaPacijenta(req, res, next);

    expect(redis.del).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(greška);
  });

  it("vraća grešku sa statusom iz service-a", async () => {
    const { redis } = await import("../lib/redis.js");
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(kreirajTerminZaPacijentomService).mockRejectedValue({
      status: 400,
      poruka: "Termin nije slobodan.",
    });

    const { req, res, next } = mockReqRes({}, {}, validBody);
    await kreirajTerminZaPacijenta(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin nije slobodan." });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. dodajNalaz
// ═════════════════════════════════════════════════════════════════════════════
describe("dodajNalaz", () => {
  const validBody = {
    naziv: "Krvna slika",
    opis: "Normalno",
    fajl: "base64string==",
    mimeType: "application/pdf",
  };

  it("uspješno dodaje nalaz", async () => {
    const nalaz = { id: 1, naziv: "Krvna slika" };
    vi.mocked(dodajNalazService).mockResolvedValue(nalaz as any);

    const { req, res, next } = mockReqRes({ idRezervacije: "5" }, {}, validBody);
    await dodajNalaz(req, res, next);

    expect(dodajNalazService).toHaveBeenCalledWith(5, "Krvna slika", "Normalno", "base64string==", "application/pdf");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(nalaz);
  });

  it("vraća 400 za neispravan ID rezervacije", async () => {
    const { req, res, next } = mockReqRes({ idRezervacije: "abc" }, {}, validBody);
    await dodajNalaz(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(dodajNalazService).not.toHaveBeenCalled();
  });

  it("vraća 400 kada nedostaju obavezna polja (naziv, fajl, mimeType)", async () => {
    const { req, res, next } = mockReqRes({ idRezervacije: "5" }, {}, { naziv: "Test" }); // nema fajl i mimeType
    await dodajNalaz(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("naziv") })
    );
    expect(dodajNalazService).not.toHaveBeenCalled();
  });

  it("vraća grešku sa statusom iz service-a", async () => {
    vi.mocked(dodajNalazService).mockRejectedValue({ status: 400, poruka: "Nije PDF." });

    const { req, res, next } = mockReqRes({ idRezervacije: "5" }, {}, validBody);
    await dodajNalaz(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nije PDF." });
  });

  it("poziva next za neočekivane greške", async () => {
    const greška = new Error("DB greška");
    vi.mocked(dodajNalazService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ idRezervacije: "5" }, {}, validBody);
    await dodajNalaz(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. getNalaziPacijenta
// ═════════════════════════════════════════════════════════════════════════════
describe("getNalaziPacijenta", () => {
  it("vraća nalaze za pacijenta", async () => {
    const nalazi = [{ id: 1, naziv: "Nalaz 1" }];
    vi.mocked(getNalaziPacijentaService).mockResolvedValue(nalazi as any);

    const { req, res, next } = mockReqRes({ idPacijenta: "3" });
    await getNalaziPacijenta(req, res, next);

    expect(getNalaziPacijentaService).toHaveBeenCalledWith(3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(nalazi);
  });

  it("vraća 400 za neispravan ID pacijenta", async () => {
    const { req, res, next } = mockReqRes({ idPacijenta: "abc" });
    await getNalaziPacijenta(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(getNalaziPacijentaService).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("DB greška");
    vi.mocked(getNalaziPacijentaService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ idPacijenta: "3" });
    await getNalaziPacijenta(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. getNalazPDF
// ═════════════════════════════════════════════════════════════════════════════
describe("getNalazPDF", () => {
  it("šalje PDF sa ispravnim headerima", async () => {
    const nalaz = { naziv: "Krvna slika", dokumentPDF: Buffer.from("pdf") };
    vi.mocked(getNalazPDFService).mockResolvedValue(nalaz as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getNalazPDF(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      `inline; filename="Krvna slika.pdf"`
    );
    expect(res.send).toHaveBeenCalledWith(nalaz.dokumentPDF);
  });

  it("vraća 400 za neispravan ID", async () => {
    const { req, res, next } = mockReqRes({ id: "abc" });
    await getNalazPDF(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(getNalazPDFService).not.toHaveBeenCalled();
  });

  it("vraća grešku sa statusom iz service-a", async () => {
    vi.mocked(getNalazPDFService).mockRejectedValue({ status: 404, poruka: "Nalaz nije pronađen." });

    const { req, res, next } = mockReqRes({ id: "1" });
    await getNalazPDF(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nalaz nije pronađen." });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. getOtkazaniTermini
// ═════════════════════════════════════════════════════════════════════════════
describe("getOtkazaniTermini", () => {
  it("vraća otkazane termine bez datuma (svi)", async () => {
    const termini = [mockTermin()];
    vi.mocked(getOtkazaniTerminiService).mockResolvedValue(termini as any);

    const { req, res, next } = mockReqRes({}, {});
    await getOtkazaniTermini(req, res, next);

    expect(getOtkazaniTerminiService).toHaveBeenCalledWith(undefined);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("vraća otkazane termine za proslijeđeni datum u DD-MM-YYYY formatu", async () => {
    vi.mocked(getOtkazaniTerminiService).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, { datum: "17-05-2026" });
    await getOtkazaniTermini(req, res, next);

    expect(getOtkazaniTerminiService).toHaveBeenCalledWith(expect.any(Date));
  });

  it("vraća 400 za neispravan format datuma (YYYY-MM-DD umjesto DD-MM-YYYY)", async () => {
    const { req, res, next } = mockReqRes({}, { datum: "2026-05-17" });
    await getOtkazaniTermini(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("DD-MM-YYYY") })
    );
    expect(getOtkazaniTerminiService).not.toHaveBeenCalled();
  });


  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("DB greška");
    vi.mocked(getOtkazaniTerminiService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {});
    await getOtkazaniTermini(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. getHitniTermini
// ═════════════════════════════════════════════════════════════════════════════
describe("getHitniTermini", () => {
  it("vraća sve hitne termine", async () => {
    const termini = [mockTermin({ hitnost: true })];
    vi.mocked(getHitniTerminiService).mockResolvedValue(termini as any);

    const { req, res, next } = mockReqRes();
    await getHitniTermini(req, res, next);

    expect(getHitniTerminiService).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(termini);
  });

  it("vraća prazan niz kada nema hitnih termina", async () => {
    vi.mocked(getHitniTerminiService).mockResolvedValue([]);

    const { req, res, next } = mockReqRes();
    await getHitniTermini(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("DB greška");
    vi.mocked(getHitniTerminiService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes();
    await getHitniTermini(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. getZavrseniPregledi
// ═════════════════════════════════════════════════════════════════════════════
describe("getZavrseniPregledi", () => {
  it("vraća sve završene preglede bez filtera", async () => {
    const pregledi = [{ id: 1 }];
    vi.mocked(getZavrseniPregledService).mockResolvedValue(pregledi as any);

    const { req, res, next } = mockReqRes({}, {});
    await getZavrseniPregledi(req, res, next);

    expect(getZavrseniPregledService).toHaveBeenCalledWith(undefined);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("filtrira po idPacijenta kada je proslijeđen", async () => {
    vi.mocked(getZavrseniPregledService).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, { idPacijenta: "5" });
    await getZavrseniPregledi(req, res, next);

    expect(getZavrseniPregledService).toHaveBeenCalledWith(5);
  });

  it("vraća 400 za neispravan idPacijenta", async () => {
    const { req, res, next } = mockReqRes({}, { idPacijenta: "abc" });
    await getZavrseniPregledi(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(getZavrseniPregledService).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("DB greška");
    vi.mocked(getZavrseniPregledService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {});
    await getZavrseniPregledi(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12. postaviHitnost
// ═════════════════════════════════════════════════════════════════════════════
describe("postaviHitnost", () => {
  it("uspješno postavlja hitnost na true", async () => {
    const rezervacija = { id: 1, hitnost: true };
    vi.mocked(postaviHitnostService).mockResolvedValue(rezervacija as any);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { hitnost: true });
    await postaviHitnost(req, res, next);

    expect(postaviHitnostService).toHaveBeenCalledWith(1, true);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rezervacija);
  });

  it("uspješno postavlja hitnost na false", async () => {
    vi.mocked(postaviHitnostService).mockResolvedValue({ id: 1, hitnost: false } as any);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { hitnost: false });
    await postaviHitnost(req, res, next);

    expect(postaviHitnostService).toHaveBeenCalledWith(1, false);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("vraća 400 kada hitnost nije boolean", async () => {
    const { req, res, next } = mockReqRes({ id: "1" }, {}, { hitnost: "true" }); // string umjesto boolean
    await postaviHitnost(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("boolean") })
    );
    expect(postaviHitnostService).not.toHaveBeenCalled();
  });

  it("vraća 400 za neispravan ID", async () => {
    const { req, res, next } = mockReqRes({ id: "abc" }, {}, { hitnost: true });
    await postaviHitnost(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(postaviHitnostService).not.toHaveBeenCalled();
  });

  it("vraća grešku sa statusom iz service-a", async () => {
    vi.mocked(postaviHitnostService).mockRejectedValue({ status: 404, poruka: "Rezervacija nije pronađena." });

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { hitnost: true });
    await postaviHitnost(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 13–16. Jednostavni passthrough controlleri
// ═════════════════════════════════════════════════════════════════════════════
describe("getAllPacijenti / getAllDoktori / getAllOdjeli / getAllSobe / getAllTermini", () => {
  it("getAllPacijenti vraća listu pacijenata", async () => {
    vi.mocked(getAllPacijentiService).mockResolvedValue([{ id: 1 }] as any);
    const { req, res, next } = mockReqRes();
    await getAllPacijenti(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it("getAllDoktori vraća listu doktora", async () => {
    vi.mocked(getAllDoktoriService).mockResolvedValue([{ id: 2 }] as any);
    const { req, res, next } = mockReqRes();
    await getAllDoktori(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 2 }]);
  });

  it("getAllOdjeli vraća listu odjela", async () => {
    vi.mocked(getAllOdjeliService).mockResolvedValue([{ id: 1, naziv: "Kardiologija" }] as any);
    const { req, res, next } = mockReqRes();
    await getAllOdjeli(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getAllSobe vraća listu soba", async () => {
    vi.mocked(getAllSobeService).mockResolvedValue([{ id: 1, broj: "101" }] as any);
    const { req, res, next } = mockReqRes();
    await getAllSobe(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getAllTermini vraća sve termine", async () => {
    vi.mocked(getAllTerminiService).mockResolvedValue([mockTermin()] as any);
    const { req, res, next } = mockReqRes();
    await getAllTermini(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getAllPacijenti poziva next pri grešci", async () => {
    const greška = new Error("DB greška");
    vi.mocked(getAllPacijentiService).mockRejectedValue(greška);
    const { req, res, next } = mockReqRes();
    await getAllPacijenti(req, res, next);
    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 17. getSlobodniTerminiDoktora
// ═════════════════════════════════════════════════════════════════════════════
describe("getSlobodniTerminiDoktora", () => {
  it("vraća slobodne termine za doktora i datum", async () => {
    const termini = [{ id: 1, vrijemeMinute: 540 }];
    vi.mocked(getSlobodniTerminiDoktoraService).mockResolvedValue(termini as any);

    const { req, res, next } = mockReqRes({ idDoktor: "2" }, { datum: "2026-05-17" });
    await getSlobodniTerminiDoktora(req, res, next);

    expect(getSlobodniTerminiDoktoraService).toHaveBeenCalledWith(2, "2026-05-17");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(termini);
  });

  it("vraća 400 kada datum nije proslijeđen", async () => {
    const { req, res, next } = mockReqRes({ idDoktor: "2" }, {});
    await getSlobodniTerminiDoktora(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("datum") })
    );
    expect(getSlobodniTerminiDoktoraService).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("DB greška");
    vi.mocked(getSlobodniTerminiDoktoraService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ idDoktor: "2" }, { datum: "2026-05-17" });
    await getSlobodniTerminiDoktora(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 18. getTipoviPregleda
// ═════════════════════════════════════════════════════════════════════════════
describe("getTipoviPregleda", () => {
  it("vraća tipove pregleda", async () => {
    const tipovi = [{ id: 1, naziv: "Opći pregled" }];
    vi.mocked(getTipoviPregledaService).mockResolvedValue(tipovi as any);

    const { req, res, next } = mockReqRes();
    await getTipoviPregleda(req, res);

    expect(getTipoviPregledaService).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(tipovi);
  });

  it("vraća grešku sa statusom iz service-a", async () => {
    vi.mocked(getTipoviPregledaService).mockRejectedValue({ status: 500, poruka: "Greška." });

    const { req, res } = mockReqRes();
    await getTipoviPregleda(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška." });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 19. getSlobodniDatumiDoktora
// ═════════════════════════════════════════════════════════════════════════════
describe("getSlobodniDatumiDoktora", () => {
  it("vraća slobodne datume za doktora", async () => {
    const datumi = ["2026-05-19", "2026-05-20"];
    vi.mocked(getSlobodniDatumiDoktoraService).mockResolvedValue(datumi as any);

    const { req, res, next } = mockReqRes({ idDoktor: "2" });
    await getSlobodniDatumiDoktora(req, res, next);

    expect(getSlobodniDatumiDoktoraService).toHaveBeenCalledWith(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(datumi);
  });

  it("vraća 400 za neispravan ID doktora", async () => {
    const { req, res, next } = mockReqRes({ idDoktor: "abc" });
    await getSlobodniDatumiDoktora(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(getSlobodniDatumiDoktoraService).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("DB greška");
    vi.mocked(getSlobodniDatumiDoktoraService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ idDoktor: "2" });
    await getSlobodniDatumiDoktora(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});