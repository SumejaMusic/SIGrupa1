import { vi, describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import {
  getSviKorisnici,
  getKorisnikById,
  updateKorisnik,
  deleteKorisnik,
  promijeniUlogu,
  blokirajNalog,
  odblokirajNalog,
  getRasporedi,
  createRaspored,
  updateRaspored,
  deleteRaspored,
  getSviTermini,
} from "../controllers/adminController.js";

vi.mock("../lib/prisma.js");

vi.mock("../lib/auditLog.js", () => ({
  kreirajAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// ─── Helper ───────────────────────────────────────────────────────────────
const mockReqRes = (
  params: any = {},
  query: any = {},
  body: any = {},
  korisnik: any = { id: 1, uloga: "ADMINISTRATOR" }
) => ({
  req: { params, query, body, korisnik, ip: "127.0.0.1" } as any,
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
// getSviKorisnici
// ─────────────────────────────────────────────
describe("getSviKorisnici", () => {
  const lažniKorisnici = [
    { id: 2, ime: "Ana", prezime: "Anić", email: "ana@test.ba", uloga: "PACIJENT" },
    { id: 3, ime: "Marko", prezime: "Marić", email: "marko@test.ba", uloga: "DOKTOR" },
  ];

  it("vraća paginiranu listu svih korisnika s default parametrima", async () => {
    vi.mocked(prismaMock.korisnik.findMany).mockResolvedValue(lažniKorisnici as any);
    vi.mocked(prismaMock.korisnik.count).mockResolvedValue(2);

    const { req, res } = mockReqRes({}, {});
    await getSviKorisnici(req, res);

    expect(prismaMock.korisnik.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 15, orderBy: { datumRegistracije: "desc" } })
    );
    expect(res.json).toHaveBeenCalledWith({
      korisnici: lažniKorisnici,
      paginacija: { ukupno: 2, stranica: 1, limit: 15, ukupnoStranica: 1 },
    });
  });

  it("filtrira korisnike po pretrazi (ime/prezime/email)", async () => {
    vi.mocked(prismaMock.korisnik.findMany).mockResolvedValue([lažniKorisnici[0]] as any);
    vi.mocked(prismaMock.korisnik.count).mockResolvedValue(1);

    const { req, res } = mockReqRes({}, { pretraga: "Ana" });
    await getSviKorisnici(req, res);

    expect(prismaMock.korisnik.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ ime: expect.objectContaining({ contains: "Ana" }) }),
          ]),
        }),
      })
    );
  });

  it("filtrira korisnike po ulozi", async () => {
    vi.mocked(prismaMock.korisnik.findMany).mockResolvedValue([lažniKorisnici[1]] as any);
    vi.mocked(prismaMock.korisnik.count).mockResolvedValue(1);

    const { req, res } = mockReqRes({}, { uloga: "DOKTOR" });
    await getSviKorisnici(req, res);

    expect(prismaMock.korisnik.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ uloga: "DOKTOR" }) })
    );
  });

  it("filtrira blokirane naloge kada zakljucan=true", async () => {
    vi.mocked(prismaMock.korisnik.findMany).mockResolvedValue([] as any);
    vi.mocked(prismaMock.korisnik.count).mockResolvedValue(0);

    const { req, res } = mockReqRes({}, { zakljucan: "true" });
    await getSviKorisnici(req, res);

    expect(prismaMock.korisnik.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ nalogZakljucan: true }) })
    );
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.korisnik.findMany).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes();
    await getSviKorisnici(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri dohvatanju korisnika." });
  });
});

// ─────────────────────────────────────────────
// getKorisnikById
// ─────────────────────────────────────────────
describe("getKorisnikById", () => {
  const lažniKorisnik = {
    id: 5,
    ime: "Ana",
    prezime: "Anić",
    email: "ana@test.ba",
    uloga: "PACIJENT",
    pacijentProfile: null,
    doktorProfile: null,
    osobljeProfile: null,
  };

  it("vraća korisnika po ID-u", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(lažniKorisnik as any);

    const { req, res } = mockReqRes({ id: "5" });
    await getKorisnikById(req, res);

    expect(prismaMock.korisnik.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } })
    );
    expect(res.json).toHaveBeenCalledWith(lažniKorisnik);
  });

  it("vraća 404 kada korisnik nije pronađen", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(null);

    const { req, res } = mockReqRes({ id: "999" });
    await getKorisnikById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Korisnik nije pronađen." });
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes({ id: "5" });
    await getKorisnikById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri dohvatanju korisnika." });
  });
});

// ─────────────────────────────────────────────
// updateKorisnik
// ─────────────────────────────────────────────
describe("updateKorisnik", () => {
  const postojeciKorisnik = {
    id: 5,
    ime: "Ana",
    prezime: "Anić",
    email: "ana@test.ba",
    brojTelefona: "061111111",
  };

  const azuriraniKorisnik = {
    id: 5,
    ime: "Ana",
    prezime: "Novak",
    email: "ana@test.ba",
    brojTelefona: "061111111",
    uloga: "PACIJENT",
  };

  it("uspješno ažurira korisnika i vraća ažurirane podatke", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(postojeciKorisnik as any);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(azuriraniKorisnik as any);

    const { req, res } = mockReqRes({ id: "5" }, {}, { prezime: "Novak" });
    await updateKorisnik(req, res);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Korisnik uspješno ažuriran.",
      korisnik: azuriraniKorisnik,
    });
  });

  it("vraća 404 kada korisnik nije pronađen", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(null);

    const { req, res } = mockReqRes({ id: "999" }, {}, { ime: "Test" });
    await updateKorisnik(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Korisnik nije pronađen." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 409 kada novi email već koristi drugi korisnik", async () => {
    vi.mocked(prismaMock.korisnik.findUnique)
      .mockResolvedValueOnce(postojeciKorisnik as any)
      .mockResolvedValueOnce({ id: 99, email: "zauzet@test.ba" } as any);

    const { req, res } = mockReqRes({ id: "5" }, {}, { email: "zauzet@test.ba" });
    await updateKorisnik(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Email je već u upotrebi." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes({ id: "5" }, {}, { ime: "Test" });
    await updateKorisnik(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri ažuriranju korisnika." });
  });
});

// ─────────────────────────────────────────────
// deleteKorisnik
// ─────────────────────────────────────────────
describe("deleteKorisnik", () => {
  const lažniKorisnik = {
    id: 5,
    ime: "Ana",
    prezime: "Anić",
    email: "ana@test.ba",
    uloga: "PACIJENT",
  };

  it("uspješno briše korisnika", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(lažniKorisnik as any);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);

    const { req, res } = mockReqRes({ id: "5" });
    await deleteKorisnik(req, res);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ poruka: "Korisnik uspješno obrisan." });
  });

  it("vraća 400 kada admin pokušava obrisati vlastiti nalog", async () => {
    const { req, res } = mockReqRes({ id: "1" }, {}, {}, { id: 1, uloga: "ADMINISTRATOR" });
    await deleteKorisnik(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Ne možete obrisati vlastiti nalog." });
    expect(prismaMock.korisnik.findUnique).not.toHaveBeenCalled();
  });

  it("vraća 404 kada korisnik nije pronađen", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(null);

    const { req, res } = mockReqRes({ id: "999" });
    await deleteKorisnik(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Korisnik nije pronađen." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes({ id: "5" });
    await deleteKorisnik(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri brisanju korisnika." });
  });
});

// ─────────────────────────────────────────────
// promijeniUlogu
// ─────────────────────────────────────────────
describe("promijeniUlogu", () => {
  const lažniKorisnik = {
    id: 5,
    uloga: "PACIJENT",
    pacijentProfile: { id: 10 },
    doktorProfile: null,
    osobljeProfile: null,
  };

  it("uspješno mijenja ulogu korisnika", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(lažniKorisnik as any);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);

    const { req, res } = mockReqRes({ id: "5" }, {}, { novaUloga: "ADMINISTRATOR" });
    await promijeniUlogu(req, res);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("PACIJENT") })
    );
  });

  it("vraća 400 za nevažeću ulogu", async () => {
    const { req, res } = mockReqRes({ id: "5" }, {}, { novaUloga: "IZMISLJENA_ULOGA" });
    await promijeniUlogu(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("Nevažeća uloga") })
    );
    expect(prismaMock.korisnik.findUnique).not.toHaveBeenCalled();
  });

  it("vraća 404 kada korisnik nije pronađen", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(null);

    const { req, res } = mockReqRes({ id: "999" }, {}, { novaUloga: "PACIJENT" });
    await promijeniUlogu(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Korisnik nije pronađen." });
  });

  it("vraća 400 za DOKTOR ulogu bez obaveznih podataka", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue({
      ...lažniKorisnik,
      doktorProfile: null,
    } as any);

    const { req, res } = mockReqRes(
      { id: "5" },
      {},
      { novaUloga: "DOKTOR", dodatniPodaci: {} }
    );
    await promijeniUlogu(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("brojLicence") })
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 400 za MEDICINSKO_OSOBLJE ulogu bez obaveznih podataka", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue({
      ...lažniKorisnik,
      osobljeProfile: null,
    } as any);

    const { req, res } = mockReqRes(
      { id: "5" },
      {},
      { novaUloga: "MEDICINSKO_OSOBLJE", dodatniPodaci: {} }
    );
    await promijeniUlogu(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("pozicija") })
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes({ id: "5" }, {}, { novaUloga: "PACIJENT" });
    await promijeniUlogu(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri promjeni uloge." });
  });
});

// ─────────────────────────────────────────────
// blokirajNalog
// ─────────────────────────────────────────────
describe("blokirajNalog", () => {
  const aktivniKorisnik = { id: 5, nalogZakljucan: false };
  const blokiraniKorisnik = { id: 5, nalogZakljucan: true };

  it("uspješno blokira nalog korisnika", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(aktivniKorisnik as any);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);

    const { req, res } = mockReqRes({ id: "5" });
    await blokirajNalog(req, res);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nalog je uspješno blokiran." });
  });

  it("vraća 400 kada admin pokušava blokirati vlastiti nalog", async () => {
    const { req, res } = mockReqRes({ id: "1" }, {}, {}, { id: 1, uloga: "ADMINISTRATOR" });
    await blokirajNalog(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Ne možete blokirati vlastiti nalog." });
    expect(prismaMock.korisnik.findUnique).not.toHaveBeenCalled();
  });

  it("vraća 404 kada korisnik nije pronađen", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(null);

    const { req, res } = mockReqRes({ id: "999" });
    await blokirajNalog(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Korisnik nije pronađen." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 400 kada je nalog već blokiran", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(blokiraniKorisnik as any);

    const { req, res } = mockReqRes({ id: "5" });
    await blokirajNalog(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nalog je već blokiran." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes({ id: "5" });
    await blokirajNalog(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri blokiranju naloga." });
  });
});

// ─────────────────────────────────────────────
// odblokirajNalog
// ─────────────────────────────────────────────
describe("odblokirajNalog", () => {
  const blokiraniKorisnik = { id: 5, nalogZakljucan: true };
  const aktivniKorisnik = { id: 5, nalogZakljucan: false };

  it("uspješno odblokira nalog korisnika", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(blokiraniKorisnik as any);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);

    const { req, res } = mockReqRes({ id: "5" });
    await odblokirajNalog(req, res);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nalog je uspješno odblokiran." });
  });

  it("vraća 404 kada korisnik nije pronađen", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(null);

    const { req, res } = mockReqRes({ id: "999" });
    await odblokirajNalog(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Korisnik nije pronađen." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 400 kada nalog nije blokiran", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(aktivniKorisnik as any);

    const { req, res } = mockReqRes({ id: "5" });
    await odblokirajNalog(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nalog nije blokiran." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes({ id: "5" });
    await odblokirajNalog(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri deblokiranju naloga." });
  });
});

// ─────────────────────────────────────────────
// getRasporedi
// ─────────────────────────────────────────────
describe("getRasporedi", () => {
  const lažniRasporedi = [
    { id: 1, idDoktor: 2, danUSedmici: "PONEDJELJAK", aktivan: true },
    { id: 2, idDoktor: 2, danUSedmici: "SRIJEDA", aktivan: true },
  ];

  it("vraća sve rasporede", async () => {
    vi.mocked(prismaMock.rasporedDoktora.findMany).mockResolvedValue(lažniRasporedi as any);

    const { req, res } = mockReqRes();
    await getRasporedi(req, res);

    expect(prismaMock.rasporedDoktora.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(lažniRasporedi);
  });

  it("filtrira rasporede po idDoktor", async () => {
    vi.mocked(prismaMock.rasporedDoktora.findMany).mockResolvedValue(lažniRasporedi as any);

    const { req, res } = mockReqRes({}, { idDoktor: "2" });
    await getRasporedi(req, res);

    expect(prismaMock.rasporedDoktora.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ idDoktor: 2 }) })
    );
  });

  it("vraća prazan niz kada nema rasporeda", async () => {
    vi.mocked(prismaMock.rasporedDoktora.findMany).mockResolvedValue([]);

    const { req, res } = mockReqRes();
    await getRasporedi(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.rasporedDoktora.findMany).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes();
    await getRasporedi(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri dohvatanju rasporeda." });
  });
});

// ─────────────────────────────────────────────
// createRaspored
// ─────────────────────────────────────────────
describe("createRaspored", () => {
  const validanBody = {
    idDoktor: 2,
    danUSedmici: "PONEDJELJAK",
    vrijemeOd: "08:00",
    vrijemeDo: "16:00",
    datumOd: "2026-06-01",
  };

  const lažniRaspored = { id: 1, idDoktor: 2, danUSedmici: "PONEDJELJAK" };

  it("uspješno kreira novi raspored i vraća ga sa statusom 201", async () => {
    vi.mocked(prismaMock.doktor.findUnique).mockResolvedValue({ id: 2 } as any);
    vi.mocked(prismaMock.rasporedDoktora.findFirst).mockResolvedValue(null);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(lažniRaspored as any);

    const { req, res } = mockReqRes({}, {}, validanBody);
    await createRaspored(req, res);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: "Raspored uspješno kreiran.", raspored: lažniRaspored })
    );
  });

  it("vraća 400 kada nedostaju obavezna polja", async () => {
    const { req, res } = mockReqRes({}, {}, { idDoktor: 2 });
    await createRaspored(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: expect.stringContaining("Obavezna polja") })
    );
    expect(prismaMock.doktor.findUnique).not.toHaveBeenCalled();
  });

  it("vraća 404 kada doktor nije pronađen", async () => {
    vi.mocked(prismaMock.doktor.findUnique).mockResolvedValue(null);

    const { req, res } = mockReqRes({}, {}, validanBody);
    await createRaspored(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Doktor nije pronađen." });
    expect(prismaMock.rasporedDoktora.findFirst).not.toHaveBeenCalled();
  });

  it("vraća 409 kada doktor već ima aktivan raspored za taj dan", async () => {
    vi.mocked(prismaMock.doktor.findUnique).mockResolvedValue({ id: 2 } as any);
    vi.mocked(prismaMock.rasporedDoktora.findFirst).mockResolvedValue({ id: 99 } as any);

    const { req, res } = mockReqRes({}, {}, validanBody);
    await createRaspored(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Doktor već ima aktivan raspored za taj dan." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.doktor.findUnique).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes({}, {}, validanBody);
    await createRaspored(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri kreiranju rasporeda." });
  });
});

// ─────────────────────────────────────────────
// updateRaspored
// ─────────────────────────────────────────────
describe("updateRaspored", () => {
  const postojeciRaspored = {
    id: 1,
    idDoktor: 2,
    danUSedmici: "PONEDJELJAK",
    aktivan: true,
  };

  it("uspješno ažurira raspored", async () => {
    const azuriraniRaspored = { ...postojeciRaspored, danUSedmici: "UTORAK" };
    vi.mocked(prismaMock.rasporedDoktora.findUnique).mockResolvedValue(postojeciRaspored as any);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(azuriraniRaspored as any);

    const { req, res } = mockReqRes({ id: "1" }, {}, { danUSedmici: "UTORAK" });
    await updateRaspored(req, res);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: "Raspored uspješno ažuriran.", raspored: azuriraniRaspored })
    );
  });

  it("vraća 404 kada raspored nije pronađen", async () => {
    vi.mocked(prismaMock.rasporedDoktora.findUnique).mockResolvedValue(null);

    const { req, res } = mockReqRes({ id: "999" }, {}, { danUSedmici: "UTORAK" });
    await updateRaspored(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Raspored nije pronađen." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.rasporedDoktora.findUnique).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes({ id: "1" }, {}, { danUSedmici: "UTORAK" });
    await updateRaspored(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri ažuriranju rasporeda." });
  });
});

// ─────────────────────────────────────────────
// deleteRaspored
// ─────────────────────────────────────────────
describe("deleteRaspored", () => {
  const postojeciRaspored = { id: 1, idDoktor: 2, aktivan: true };

  it("uspješno deaktivira raspored (soft delete)", async () => {
    vi.mocked(prismaMock.rasporedDoktora.findUnique).mockResolvedValue(postojeciRaspored as any);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);

    const { req, res } = mockReqRes({ id: "1" });
    await deleteRaspored(req, res);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ poruka: "Raspored uspješno deaktiviran." });
  });

  it("vraća 404 kada raspored nije pronađen", async () => {
    vi.mocked(prismaMock.rasporedDoktora.findUnique).mockResolvedValue(null);

    const { req, res } = mockReqRes({ id: "999" });
    await deleteRaspored(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Raspored nije pronađen." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.rasporedDoktora.findUnique).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes({ id: "1" });
    await deleteRaspored(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri brisanju rasporeda." });
  });
});

// ─────────────────────────────────────────────
// getSviTermini
// ─────────────────────────────────────────────
describe("getSviTermini", () => {
  const lažniTermini = [
    { id: 1, status: "SLOBODAN", datum: new Date("2026-06-01"), idDoktor: 2 },
    { id: 2, status: "ZAUZET", datum: new Date("2026-06-02"), idDoktor: 3 },
  ];

  it("vraća paginiranu listu termina s default parametrima", async () => {
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue(lažniTermini as any);
    vi.mocked(prismaMock.termin.count).mockResolvedValue(2);

    const { req, res } = mockReqRes({}, {});
    await getSviTermini(req, res);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20, orderBy: { datum: "desc" } })
    );
    expect(res.json).toHaveBeenCalledWith({
      termini: lažniTermini,
      paginacija: { ukupno: 2, stranica: 1, limit: 20, ukupnoStranica: 1 },
    });
  });

  it("filtrira termine po statusu", async () => {
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue([lažniTermini[1]] as any);
    vi.mocked(prismaMock.termin.count).mockResolvedValue(1);

    const { req, res } = mockReqRes({}, { status: "ZAUZET" });
    await getSviTermini(req, res);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "ZAUZET" }) })
    );
  });

  it("filtrira termine po idDoktor", async () => {
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue([lažniTermini[0]] as any);
    vi.mocked(prismaMock.termin.count).mockResolvedValue(1);

    const { req, res } = mockReqRes({}, { idDoktor: "2" });
    await getSviTermini(req, res);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ idDoktor: 2 }) })
    );
  });

  it("filtrira termine po datumskom rasponu", async () => {
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue(lažniTermini as any);
    vi.mocked(prismaMock.termin.count).mockResolvedValue(2);

    const { req, res } = mockReqRes({}, { datumOd: "2026-06-01", datumDo: "2026-06-30" });
    await getSviTermini(req, res);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          datum: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
        }),
      })
    );
  });

  it("vraća 500 pri grešci baze podataka", async () => {
    vi.mocked(prismaMock.termin.findMany).mockRejectedValue(new Error("DB greška"));

    const { req, res } = mockReqRes({}, {});
    await getSviTermini(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška pri dohvatanju termina." });
  });
});
