import { vi, describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import { redisMock } from "../lib/__mocks__/redis.js";
import {
  getDnevniTermini,
  pretragaTermina,
  getDetaljiTermina,
  otkaziTermin,
  kreirajTerminZaPacijenta,
  getOtkazaniTermini,
  getHitniTermini,
  getZavrseniPregledi,
  postaviHitnost,
  pomjeriTermin,
  potvrdiDolazakPacijenta,
} from "../controllers/OsobljeController.js";

vi.mock("../app.js", () => ({
  io: { emit: vi.fn() },
}));

vi.mock("../lib/prisma.js");
vi.mock("../lib/redis.js");

vi.mock("../osobljeService.js", () => ({
  getDnevniTerminiService: vi.fn(),
  pretragaTerminaService: vi.fn(),
  getDetaljiTerminaService: vi.fn(),
  otkaziTerminService: vi.fn(),
  kreirajTerminZaPacijentomService: vi.fn(),
  getOtkazaniTerminiService: vi.fn(),
  getHitniTerminiService: vi.fn(),
  getZavrseniPregledService: vi.fn(),
  postaviHitnostService: vi.fn(),
  pomjeriTerminService: vi.fn(),
  getAllPacijentiService: vi.fn(),
  getAllDoktoriService: vi.fn(),
  getAllOdjeliService: vi.fn(),
  getAllSobeService: vi.fn(),
  getAllTerminiService: vi.fn(),
  getSlobodniTerminiDoktoraService: vi.fn(),
  getTipoviPregledaService: vi.fn(),
  getSlobodniDatumiDoktoraService: vi.fn(),
  potvrdiDolazakPacijentaService: vi.fn(),
}));

import {
  getDnevniTerminiService,
  pretragaTerminaService,
  getDetaljiTerminaService,
  otkaziTerminService,
  kreirajTerminZaPacijentomService,
  getOtkazaniTerminiService,
  getHitniTerminiService,
  getZavrseniPregledService,
  postaviHitnostService,
  pomjeriTerminService,
  potvrdiDolazakPacijentaService,
} from "../osobljeService.js";

const mockReqRes = (params = {}, query = {}, body = {}) => ({
  req: { params, query, body } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any,
  next: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────
// getDnevniTermini
// ─────────────────────────────────────────────
describe("getDnevniTermini", () => {
  it("vraća termine za zadani datum", async () => {
    const lažniTermini = [{ id: 1 }, { id: 2 }];
    vi.mocked(getDnevniTerminiService).mockResolvedValue(lažniTermini as any);

    const { req, res, next } = mockReqRes({}, { datum: "2026-05-18" });
    await getDnevniTermini(req, res, next);

    expect(getDnevniTerminiService).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(lažniTermini);
    expect(next).not.toHaveBeenCalled();
  });

  it("koristi danas kao datum ako datum nije poslan", async () => {
    vi.mocked(getDnevniTerminiService).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, {});
    await getDnevniTermini(req, res, next);

    expect(getDnevniTerminiService).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 za neispravan format datuma", async () => {
    const { req, res, next } = mockReqRes({}, { datum: "nije-datum" });
    await getDnevniTermini(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Neispravan format datuma. Koristite YYYY-MM-DD.",
    });
    expect(getDnevniTerminiService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("Service greška");
    vi.mocked(getDnevniTerminiService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, { datum: "2026-05-18" });
    await getDnevniTermini(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// pretragaTermina
// ─────────────────────────────────────────────
describe("pretragaTermina", () => {
  it("vraća rezultate pretrage za validno ime", async () => {
    const rezultati = [{ id: 1 }];
    vi.mocked(pretragaTerminaService).mockResolvedValue(rezultati as any);

    const { req, res, next } = mockReqRes({}, { ime: "Amina" });
    await pretragaTermina(req, res, next);

    expect(pretragaTerminaService).toHaveBeenCalledWith("Amina");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rezultati);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada ime nije poslano", async () => {
    const { req, res, next } = mockReqRes({}, {});
    await pretragaTermina(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      poruka: expect.stringContaining("najmanje 2 karaktera"),
    }));
    expect(pretragaTerminaService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada je ime kraće od 2 karaktera", async () => {
    const { req, res, next } = mockReqRes({}, { ime: "A" });
    await pretragaTermina(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pretragaTerminaService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("Service greška");
    vi.mocked(pretragaTerminaService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, { ime: "Amina" });
    await pretragaTermina(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ─────────────────────────────────────────────
// getDetaljiTermina
// ─────────────────────────────────────────────
describe("getDetaljiTermina", () => {
  it("vraća detalje rezervacije po ID-u", async () => {
    const rezervacija = { id: 1, termin: { datum: "2026-06-01" } };
    vi.mocked(getDetaljiTerminaService).mockResolvedValue(rezervacija as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getDetaljiTermina(req, res, next);

    expect(getDetaljiTerminaService).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rezervacija);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 404 kada rezervacija nije pronađena", async () => {
    vi.mocked(getDetaljiTerminaService).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ id: "999" });
    await getDetaljiTermina(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 za neispravan ID", async () => {
    const { req, res, next } = mockReqRes({ id: "abc" });
    await getDetaljiTermina(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Neispravan ID rezervacije." });
    expect(getDetaljiTerminaService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("Service greška");
    vi.mocked(getDetaljiTerminaService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getDetaljiTermina(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ─────────────────────────────────────────────
// otkaziTermin
// ─────────────────────────────────────────────
describe("otkaziTermin", () => {
  it("uspješno otkazuje termin sa potvrdom", async () => {
    vi.mocked(otkaziTerminService).mockResolvedValue({ poruka: "Rezervacija otkazana od strane osoblja." } as any);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { potvrda: true });
    await otkaziTermin(req, res, next);

    expect(otkaziTerminService).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija otkazana od strane osoblja." });
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada potvrda nije poslana — AC sprečavanje slučajnog otkazivanja", async () => {
    const { req, res, next } = mockReqRes({ id: "1" }, {}, {});
    await otkaziTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      poruka: expect.stringContaining("potvrda"),
    }));
    expect(otkaziTerminService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 za neispravan ID", async () => {
    const { req, res, next } = mockReqRes({ id: "abc" }, {}, { potvrda: true });
    await otkaziTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Neispravan ID rezervacije." });
    expect(otkaziTerminService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("prosljeđuje status grešku iz servisa (404)", async () => {
    vi.mocked(otkaziTerminService).mockRejectedValue({ status: 404, poruka: "Rezervacija nije pronađena." });

    const { req, res, next } = mockReqRes({ id: "999" }, {}, { potvrda: true });
    await otkaziTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
    expect(next).not.toHaveBeenCalled();
  });

  it("prosljeđuje status grešku iz servisa (400 — već otkazana)", async () => {
    vi.mocked(otkaziTerminService).mockRejectedValue({ status: 400, poruka: "Rezervacija je već otkazana." });

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { potvrda: true });
    await otkaziTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija je već otkazana." });
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri neočekivanoj grešci", async () => {
    const greška = new Error("DB greška");
    vi.mocked(otkaziTerminService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { potvrda: true });
    await otkaziTermin(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// kreirajTerminZaPacijenta
// ─────────────────────────────────────────────
describe("kreirajTerminZaPacijenta", () => {
  const validanBody = { idTermina: 5, idDoktor: 2, idPacijent: 10 };

  it("uspješno kreira termin i postavlja/briše Redis lock", async () => {
    const rezervacija = { id: 1 };
    vi.mocked(redisMock.get).mockResolvedValue(null);
    vi.mocked(redisMock.setex).mockResolvedValue("OK");
    vi.mocked(kreirajTerminZaPacijentomService).mockResolvedValue(rezervacija as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({}, {}, validanBody);
    await kreirajTerminZaPacijenta(req, res, next);

    expect(redisMock.setex).toHaveBeenCalledWith("termin:lock:5", 30, "osoblje");
    expect(kreirajTerminZaPacijentomService).toHaveBeenCalled();
    expect(redisMock.del).toHaveBeenCalledWith("termin:lock:5");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(rezervacija);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada nedostaju obavezna polja", async () => {
    const { req, res, next } = mockReqRes({}, {}, { idDoktor: 2 }); // nema idTermina i idPacijent
    await kreirajTerminZaPacijenta(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Obavezna polja: idTermina, idDoktor, idPacijent.",
    });
    expect(kreirajTerminZaPacijentomService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 409 kada je termin već zaključan od drugog korisnika", async () => {
    vi.mocked(redisMock.get).mockResolvedValue("osoblje");

    const { req, res, next } = mockReqRes({}, {}, validanBody);
    await kreirajTerminZaPacijenta(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin je trenutno u procesu rezervacije." });
    expect(kreirajTerminZaPacijentomService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("briše Redis lock i poziva next kada service baci grešku", async () => {
    const greška = new Error("Service greška");
    vi.mocked(redisMock.get).mockResolvedValue(null);
    vi.mocked(redisMock.setex).mockResolvedValue("OK");
    vi.mocked(kreirajTerminZaPacijentomService).mockRejectedValue(greška);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({}, {}, validanBody);
    await kreirajTerminZaPacijenta(req, res, next);

    expect(redisMock.del).toHaveBeenCalledWith("termin:lock:5");
    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });

  it("prosljeđuje status grešku iz servisa (404 pacijent nije pronađen)", async () => {
    vi.mocked(redisMock.get).mockResolvedValue(null);
    vi.mocked(redisMock.setex).mockResolvedValue("OK");
    vi.mocked(kreirajTerminZaPacijentomService).mockRejectedValue({
      status: 404, poruka: "Pacijent nije pronađen.",
    });
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({}, {}, validanBody);
    await kreirajTerminZaPacijenta(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Pacijent nije pronađen." });
    expect(next).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// getOtkazaniTermini
// ─────────────────────────────────────────────
describe("getOtkazaniTermini", () => {
  it("vraća otkazane termine bez filtera datuma", async () => {
    const termini = [{ id: 1 }, { id: 2 }];
    vi.mocked(getOtkazaniTerminiService).mockResolvedValue(termini as any);

    const { req, res, next } = mockReqRes({}, {});
    await getOtkazaniTermini(req, res, next);

    expect(getOtkazaniTerminiService).toHaveBeenCalledWith(undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(termini);
    expect(next).not.toHaveBeenCalled();
  });

  it("prihvata datum u formatu DD-MM-YYYY", async () => {
    vi.mocked(getOtkazaniTerminiService).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, { datum: "17-05-2026" });
    await getOtkazaniTermini(req, res, next);

    expect(getOtkazaniTerminiService).toHaveBeenCalledWith(expect.any(Date));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 za neispravan format datuma (YYYY-MM-DD umjesto DD-MM-YYYY)", async () => {
    const { req, res, next } = mockReqRes({}, { datum: "2026-05-17" });
    await getOtkazaniTermini(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Neispravan format datuma. Koristite DD-MM-YYYY." });
    expect(getOtkazaniTerminiService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("Service greška");
    vi.mocked(getOtkazaniTerminiService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {});
    await getOtkazaniTermini(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ─────────────────────────────────────────────
// getHitniTermini
// ─────────────────────────────────────────────
describe("getHitniTermini", () => {
  it("vraća listu hitnih termina", async () => {
    const hitni = [{ id: 1, hitnost: true }];
    vi.mocked(getHitniTerminiService).mockResolvedValue(hitni as any);

    const { req, res, next } = mockReqRes();
    await getHitniTermini(req, res, next);

    expect(getHitniTerminiService).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(hitni);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća prazan niz kada nema hitnih termina", async () => {
    vi.mocked(getHitniTerminiService).mockResolvedValue([]);

    const { req, res, next } = mockReqRes();
    await getHitniTermini(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("Service greška");
    vi.mocked(getHitniTerminiService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes();
    await getHitniTermini(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ─────────────────────────────────────────────
// getZavrseniPregledi
// ─────────────────────────────────────────────
describe("getZavrseniPregledi", () => {
  it("vraća sve završene preglede bez filtera", async () => {
    const pregledi = [{ id: 1, zavrseno: true }];
    vi.mocked(getZavrseniPregledService).mockResolvedValue(pregledi as any);

    const { req, res, next } = mockReqRes({}, {});
    await getZavrseniPregledi(req, res, next);

    expect(getZavrseniPregledService).toHaveBeenCalledWith(undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(pregledi);
    expect(next).not.toHaveBeenCalled();
  });

  it("filtrira završene preglede po idPacijenta", async () => {
    vi.mocked(getZavrseniPregledService).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, { idPacijenta: "5" });
    await getZavrseniPregledi(req, res, next);

    expect(getZavrseniPregledService).toHaveBeenCalledWith(5);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 za neispravan idPacijenta", async () => {
    const { req, res, next } = mockReqRes({}, { idPacijenta: "abc" });
    await getZavrseniPregledi(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Neispravan ID pacijenta." });
    expect(getZavrseniPregledService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri grešci servisa", async () => {
    const greška = new Error("Service greška");
    vi.mocked(getZavrseniPregledService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {});
    await getZavrseniPregledi(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

// ─────────────────────────────────────────────
// postaviHitnost
// ─────────────────────────────────────────────
describe("postaviHitnost", () => {
  it("uspješno mijenja hitnost rezervacije", async () => {
    const rezervacija = { id: 1, hitnost: true };
    vi.mocked(postaviHitnostService).mockResolvedValue(rezervacija as any);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { hitnost: true });
    await postaviHitnost(req, res, next);

    expect(postaviHitnostService).toHaveBeenCalledWith(1, true);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rezervacija);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 kada hitnost nije boolean", async () => {
    const { req, res, next } = mockReqRes({ id: "1" }, {}, { hitnost: "true" }); // string umjesto boolean
    await postaviHitnost(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      poruka: expect.stringContaining("boolean"),
    }));
    expect(postaviHitnostService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 za neispravan ID", async () => {
    const { req, res, next } = mockReqRes({ id: "abc" }, {}, { hitnost: true });
    await postaviHitnost(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Neispravan ID rezervacije." });
    expect(postaviHitnostService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("prosljeđuje status grešku iz servisa (404)", async () => {
    vi.mocked(postaviHitnostService).mockRejectedValue({ status: 404, poruka: "Rezervacija nije pronađena." });

    const { req, res, next } = mockReqRes({ id: "999" }, {}, { hitnost: true });
    await postaviHitnost(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
    expect(next).not.toHaveBeenCalled();
  });

  it("prosljeđuje status grešku iz servisa (400 — već hitna)", async () => {
    vi.mocked(postaviHitnostService).mockRejectedValue({
      status: 400, poruka: "Rezervacija je već označena kao hitna.",
    });

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { hitnost: true });
    await postaviHitnost(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri neočekivanoj grešci", async () => {
    const greška = new Error("DB greška");
    vi.mocked(postaviHitnostService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { hitnost: true });
    await postaviHitnost(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// potvrdiDolazakPacijenta
// ─────────────────────────────────────────────
describe("potvrdiDolazakPacijenta", () => {
  it("uspješno potvrđuje dolazak pacijenta", async () => {
    const rezervacija = { id: 1, idDoktor: 2, idTermina: 5, termin: { status: "POTVRDJEN" } };
    vi.mocked(potvrdiDolazakPacijentaService).mockResolvedValue(rezervacija as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await potvrdiDolazakPacijenta(req, res, next);

    expect(potvrdiDolazakPacijentaService).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rezervacija);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 za neispravan ID", async () => {
    const { req, res, next } = mockReqRes({ id: "abc" });
    await potvrdiDolazakPacijenta(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Neispravan ID rezervacije." });
    expect(potvrdiDolazakPacijentaService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("prosljeđuje status grešku iz servisa", async () => {
    vi.mocked(potvrdiDolazakPacijentaService).mockRejectedValue({
      status: 400,
      poruka: "Dolazak pacijenta je već potvrđen.",
    });

    const { req, res, next } = mockReqRes({ id: "1" });
    await potvrdiDolazakPacijenta(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Dolazak pacijenta je već potvrđen." });
    expect(next).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// pomjeriTermin (osoblje)
// ─────────────────────────────────────────────
describe("pomjeriTermin (osoblje)", () => {
  it("uspješno pomjera termin", async () => {
    const rezultat = { id: 2, termin: { datum: "2027-06-01" } };
    vi.mocked(pomjeriTerminService).mockResolvedValue(rezultat as any);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { noviTerminId: 7 });
    await pomjeriTermin(req, res, next);

    expect(pomjeriTerminService).toHaveBeenCalledWith(1, 7);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rezultat);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 za neispravan ID rezervacije", async () => {
    const { req, res, next } = mockReqRes({ id: "abc" }, {}, { noviTerminId: 7 });
    await pomjeriTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Neispravan ID rezervacije." });
    expect(pomjeriTerminService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 400 za neispravan ID novog termina", async () => {
    const { req, res, next } = mockReqRes({ id: "1" }, {}, { noviTerminId: "abc" });
    await pomjeriTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Neispravan ID novog termina." });
    expect(pomjeriTerminService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("prosljeđuje status grešku iz servisa (404)", async () => {
    vi.mocked(pomjeriTerminService).mockRejectedValue({ status: 404, poruka: "Rezervacija nije pronađena." });

    const { req, res, next } = mockReqRes({ id: "999" }, {}, { noviTerminId: 7 });
    await pomjeriTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
    expect(next).not.toHaveBeenCalled();
  });

  it("prosljeđuje status grešku iz servisa (409 — novi termin nije slobodan)", async () => {
    vi.mocked(pomjeriTerminService).mockRejectedValue({ status: 409, poruka: "Novi termin više nije slobodan." });

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { noviTerminId: 7 });
    await pomjeriTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Novi termin više nije slobodan." });
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next pri neočekivanoj grešci", async () => {
    const greška = new Error("DB greška");
    vi.mocked(pomjeriTerminService).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { noviTerminId: 7 });
    await pomjeriTermin(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });
});
