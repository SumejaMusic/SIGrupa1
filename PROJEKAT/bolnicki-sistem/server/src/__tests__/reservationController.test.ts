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
} from "../controllers/reservationController.js";

vi.mock("../lib/prisma.js");
vi.mock("../lib/redis.js");

const mockReqRes = (params = {}, query = {}, body = {}, korisnik = { id: 1 }) => ({
  req: { params, query, body, korisnik } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any,
  next: vi.fn(),
});

// ─────────────────────────────────────────────
// kreirajRezervaciju — US-06, US-07, US-13
// ─────────────────────────────────────────────
// mozda ce se morati nadograditi testovi kada se impelentira login
// TODO: testovi za email potvrdu i podsjetnik za hronicne bolesnike
describe("kreirajRezervaciju", () => {
  const lažniPacijent = { id: 10, idKorisnik: 1 };
  const lažnaRezervacija = {
    id: 99,
    idTermina: 5,
    idPacijent: 10,
    termin: { id: 5, datum: new Date("2025-06-01") },
    pacijent: { korisnik: { email: "test@test.com" } },
    doktor: { korisnik: { ime: "Dr. Marić" } },
  };

  // ─── HAPPY PATH ───────────────────────────────

  it("uspješno kreira rezervaciju i vraća je sa statusom 201 — US-06 AC1", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue(lažnaRezervacija as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { terminId: 5, doktorId: 2, tipPregledaId: 1 },
      { id: 1 }
    );
    await kreirajRezervaciju(req, res, next);

    // Provjera ulaza — da li controller traži pacijenta
    expect(prismaMock.pacijent.findFirst).toHaveBeenCalledWith({
      where: { idKorisnik: 1 },
    });
    // Provjera izlaza — vraća 201 sa rezervacijom
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(lažnaRezervacija);
    expect(next).not.toHaveBeenCalled();
  });

  it("briše Redis lock nakon uspješne rezervacije — NFR-22", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue(lažnaRezervacija as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5 }, { id: 1 });
    await kreirajRezervaciju(req, res, next);

    // Provjera ulaza — lock se briše s ispravnim ključem
    expect(redisMock.del).toHaveBeenCalledWith("termin:lock:5");
    expect(next).not.toHaveBeenCalled();
  });

  it("kreira rezervaciju sa komentarom — US-22", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue({
      ...lažnaRezervacija,
      komentar: "Imam bolove u srcu",
    } as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { terminId: 5, doktorId: 2, tipPregledaId: 1, komentar: "Imam bolove u srcu" },
      { id: 1 }
    );
    await kreirajRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ komentar: "Imam bolove u srcu" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("kreira rezervaciju bez komentara — US-22 AC1", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(prismaMock.$transaction).mockResolvedValue({
      ...lažnaRezervacija,
      komentar: null,
    } as any);
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes(
      {},
      {},
      { terminId: 5, doktorId: 2, tipPregledaId: 1 }, // bez komentara
      { id: 1 }
    );
    await kreirajRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ komentar: null })
    );
    expect(next).not.toHaveBeenCalled();
  });

  // ─── 404 SLUČAJEVI ────────────────────────────

  it("vraća 404 kada profil pacijenta nije pronađen — US-06", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5 }, { id: 1 });
    await kreirajRezervaciju(req, res, next);

    expect(prismaMock.pacijent.findFirst).toHaveBeenCalledWith({
      where: { idKorisnik: 1 },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Profil pacijenta nije pronađen.",
    });
    expect(prismaMock.rezervacije.findFirst).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── 409 SLUČAJEVI — US-13 ────────────────────

  it("vraća 409 za duplu rezervaciju — US-13 AC1", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue({ id: 1 } as any);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5 }, { id: 1 });
    await kreirajRezervaciju(req, res, next);

    expect(prismaMock.rezervacije.findFirst).toHaveBeenCalledWith({
      where: { idPacijent: lažniPacijent.id, idTermina: 5 },
    });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Rezervacija za ovaj termin već postoji.",
    });
    expect(redisMock.get).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 409 kada termin nije zaključan u Redisu — US-12, US-13 AC1", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue(null); // nema locka

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5 }, { id: 1 });
    await kreirajRezervaciju(req, res, next);

    expect(redisMock.get).toHaveBeenCalledWith("termin:lock:5");
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Termin nije zaključan. Pokrenite proces ponovo.",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća 409 kada termin zaključao drugi korisnik — US-13 AC2", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockResolvedValue("999"); // drugi korisnik ima lock

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5 }, { id: 1 });
    await kreirajRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Termin nije zaključan. Pokrenite proces ponovo.",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("poziva next pri Prisma grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.pacijent.findFirst).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5 }, { id: 1 });
    await kreirajRezervaciju(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("poziva next pri Redis grešci i ne vraća odgovor", async () => {
    const greška = new Error("Redis greška");
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
    vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
    vi.mocked(redisMock.get).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {}, { terminId: 5 }, { id: 1 });
    await kreirajRezervaciju(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  // Nedostaje — hitnost je false po defaultu ako nije poslana (mozda ce se trebati prosiriti kasnije kada se detaljnije impelentira)
it("kreira rezervaciju sa hitnost: false kada hitnost nije poslana", async () => {
  vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
  vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
  vi.mocked(redisMock.get).mockResolvedValue("1");
  vi.mocked(prismaMock.$transaction).mockResolvedValue({
    ...lažnaRezervacija,
    hitnost: false,
  } as any);
  vi.mocked(redisMock.del).mockResolvedValue(1);

  const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2, tipPregledaId: 1 }, { id: 1 });
  await kreirajRezervaciju(req, res, next);

  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ hitnost: false })
  );
});

// Nedostaje — Redis lock se ne briše ako transakcija ne uspije (mozda ce se trebati prosiriti kada implementiramo detaljnije)
it("ne briše Redis lock kada transakcija ne uspije", async () => {
  const greška = new Error("Transakcija pala");
  vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
  vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
  vi.mocked(redisMock.get).mockResolvedValue("1");
  vi.mocked(prismaMock.$transaction).mockRejectedValue(greška);

  const { req, res, next } = mockReqRes({}, {}, { terminId: 5 }, { id: 1 });
  await kreirajRezervaciju(req, res, next);

  expect(redisMock.del).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledWith(greška);
});
});

// ─────────────────────────────────────────────
// getRezervacijeZaPacijenta — US-05
// ─────────────────────────────────────────────
describe("getRezervacijeZaPacijenta", () => {
  const lažniPacijent = { id: 10, idKorisnik: 1 };

  // ─── HAPPY PATH ───────────────────────────────

  it("vraća rezervacije za pacijenta poredane po datumu — US-01 AC1", async () => {
    const lažneRezervacije = [
      { id: 2, datumKreiranja: new Date("2025-06-02") },
      { id: 1, datumKreiranja: new Date("2025-06-01") },
      { id: 3, datumKreiranja: new Date("2025-06-04") }
    ];
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue(lažneRezervacije as any);

    const { req, res, next } = mockReqRes({}, {}, {}, { id: 1 });
    await getRezervacijeZaPacijenta(req, res, next);

    expect(prismaMock.rezervacije.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idPacijent: lažniPacijent.id },
        orderBy: { datumKreiranja: "desc" },
      })
    );
    expect(res.json).toHaveBeenCalledWith(lažneRezervacije);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća prazan niz kada pacijent nema rezervacija", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(lažniPacijent as any);
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, {}, {}, { id: 1 });
    await getRezervacijeZaPacijenta(req, res, next);

    expect(prismaMock.rezervacije.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idPacijent: lažniPacijent.id } })
    );
    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── 404 SLUČAJEVI ────────────────────────────
  //mozda treba detaljnije implementirati kad ubacimo login
  it("vraća 404 kada profil pacijenta nije pronađen", async () => {
    vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({}, {}, {}, { id: 1 });
    await getRezervacijeZaPacijenta(req, res, next);

    expect(prismaMock.pacijent.findFirst).toHaveBeenCalledWith({
      where: { idKorisnik: 1 },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Profil pacijenta nije pronađen.",
    });
    expect(prismaMock.rezervacije.findMany).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("poziva next pri grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.pacijent.findFirst).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {}, {}, { id: 1 });
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

  // ─── HAPPY PATH ───────────────────────────────

  it("vraća rezervacije za doktora poredane po datumu — US-11 AC1", async () => {
    const lažneRezervacije = [
      { id: 2, idDoktor: 3, datumKreiranja: new Date("2025-06-02") },
      { id: 1, idDoktor: 3, datumKreiranja: new Date("2025-06-01") },
    ];
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue(lažneRezervacije as any);

    const { req, res, next } = mockReqRes({ doktorId: "3" });
    await getRezervacijeZaDoktora(req, res, next);

    expect(prismaMock.rezervacije.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idDoktor: 3 },
        orderBy: { datumKreiranja: "desc" },
      })
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

  // ─── EDGE CASES ───────────────────────────────
  it("šalje ispravan doktorId u where klauzuli — ne vraća tuđe rezervacije", async () => {
  const rezervacijeDoktora3 = [
    { id: 1, idDoktor: 3 },
    { id: 2, idDoktor: 3 },
  ];
  vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue(
    rezervacijeDoktora3 as any
  );

  const { req, res, next } = mockReqRes({ doktorId: "3" });
  await getRezervacijeZaDoktora(req, res, next);

  // Provjera da controller traži SAMO rezervacije doktora 3
  expect(prismaMock.rezervacije.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { idDoktor: 3 }, // ne idDoktor: 5 ili bilo koji drugi
    })
  );
  // Provjera da se ne vraćaju rezervacije drugog doktora
  expect(prismaMock.rezervacije.findMany).not.toHaveBeenCalledWith(
    expect.objectContaining({
      where: { idDoktor: 5 },
    })
  );
  expect(res.json).toHaveBeenCalledWith(rezervacijeDoktora3);
  expect(next).not.toHaveBeenCalled();
});

  it("konvertuje string doktorId u broj prije slanja Prismi", async () => {
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({ doktorId: "42" });
    await getRezervacijeZaDoktora(req, res, next);

    expect(prismaMock.rezervacije.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idDoktor: 42 } }) // broj, ne string
    );
    expect(next).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

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
// otkaziRezervacijuPacijent — US-10
// ─────────────────────────────────────────────
//TODO: testovi za email podsjetnike kada se impelentira
describe("otkaziRezervacijuPacijent", () => {
  // Termin je 48 sati u budućnosti — dozvoljeno otkazivanje
  const lažnaRezervacija = {
    id: 1,
    idTermina: 5,
    termin: {
      id: 5,
      datum: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
    pacijent: { korisnik: { email: "test@test.com" } },
  };

  // Termin je za 12 sati — zabranjeno otkazivanje
  const lažnaRezervacijaBlizu = {
    id: 2,
    idTermina: 6,
    termin: {
      id: 6,
      datum: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
    pacijent: { korisnik: { email: "test@test.com" } },
  };

  // ─── HAPPY PATH ───────────────────────────────

  it("uspješno otkazuje rezervaciju više od 24h prije termina — US-10 AC1", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(lažnaRezervacija as any);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await otkaziRezervacijuPacijent(req, res, next);

    expect(prismaMock.rezervacije.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Rezervacija uspješno otkazana.",
    });
    //obratiti paznju ako se doda status za odgovor onda treba izbrisati "not"
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── 404 SLUČAJEVI ────────────────────────────

  it("vraća 404 kada rezervacija nije pronađena — US-10", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ id: "999" });
    await otkaziRezervacijuPacijent(req, res, next);

    expect(prismaMock.rezervacije.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 999 } })
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Rezervacija nije pronađena.",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── EDGE CASES — US-10 AC2 ───────────────────

  it("zabranjuje otkazivanje manje od 24h prije termina — US-10 AC2", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(
      lažnaRezervacijaBlizu as any
    );

    const { req, res, next } = mockReqRes({ id: "2" });
    await otkaziRezervacijuPacijent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Nije moguće otkazati termin manje od 24 sata unaprijed.",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("zabranjuje otkazivanje tačno 24h ili manje prije termina — US-10 AC2", async () => {
    const rezervacijaTacno24h = {
      ...lažnaRezervacijaBlizu,
      termin: {
        id: 7,
        datum: new Date(Date.now() + 24 * 60 * 60 * 1000 - 1000), // 1 sekunda manje od 24h
      },
    };
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(
      rezervacijaTacno24h as any
    );

    const { req, res, next } = mockReqRes({ id: "3" });
    await otkaziRezervacijuPacijent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("poziva next pri grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.rezervacije.findUnique).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" });
    await otkaziRezervacijuPacijent(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
  // Nedostaje — termin je prošao (u prošlosti)
it("zabranjuje otkazivanje termina koji je već prošao — US-10 AC2", async () => {
  const rezervacijaUProšlosti = {
    id: 3,
    idTermina: 7,
    termin: {
      id: 7,
      datum: new Date(Date.now() - 24 * 60 * 60 * 1000), // juče
    },
    pacijent: { korisnik: { email: "test@test.com" } },
  };
  vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(
    rezervacijaUProšlosti as any
  );

  const { req, res, next } = mockReqRes({ id: "3" });
  await otkaziRezervacijuPacijent(req, res, next);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({
    poruka: "Nije moguće otkazati termin manje od 24 sata unaprijed.",
  });
  expect(prismaMock.$transaction).not.toHaveBeenCalled();
  expect(next).not.toHaveBeenCalled();
});
});

// ─────────────────────────────────────────────
// otkaziRezervacijuOsoblje — US-09
// ─────────────────────────────────────────────

//TODO: testovi za email podsjetnike kada se impelentira
describe("otkaziRezervacijuOsoblje", () => {
  const lažnaRezervacija = {
    id: 1,
    idTermina: 5,
    termin: { id: 5, datum: new Date("2025-06-01") },
    pacijent: { korisnik: { email: "test@test.com" } },
  };

  // ─── HAPPY PATH ───────────────────────────────

  it("uspješno otkazuje rezervaciju i vraća potvrdu — US-09 AC1", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(lažnaRezervacija as any);
    vi.mocked(prismaMock.$transaction).mockResolvedValue(undefined as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await otkaziRezervacijuOsoblje(req, res, next);

    expect(prismaMock.rezervacije.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Rezervacija otkazana od strane osoblja.",
    });
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── 404 SLUČAJEVI ────────────────────────────

  it("vraća 404 kada rezervacija nije pronađena — US-09", async () => {
    vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ id: "999" });
    await otkaziRezervacijuOsoblje(req, res, next);

    expect(prismaMock.rezervacije.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 999 } })
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Rezervacija nije pronađena.",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

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
// dodajKomentar — US-22
// ─────────────────────────────────────────────
describe("dodajKomentar", () => {
  // ─── HAPPY PATH ───────────────────────────────

  it("uspješno dodaje komentar i vraća ažuriranu rezervaciju — US-22 AC1", async () => {
    const lažnaRezervacija = { id: 1, komentar: "Imam alergiju na penicilin" };
    vi.mocked(prismaMock.rezervacije.update).mockResolvedValue(lažnaRezervacija as any);

    const { req, res, next } = mockReqRes(
      { id: "1" },
      {},
      { komentar: "Imam alergiju na penicilin" }
    );
    await dodajKomentar(req, res, next);

    // Provjera ulaza — da li controller šalje ispravan komentar Prismi
    expect(prismaMock.rezervacije.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { komentar: "Imam alergiju na penicilin" },
    });
    // Provjera izlaza — vraća ažuriranu rezervaciju
    expect(res.json).toHaveBeenCalledWith(lažnaRezervacija);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("uspješno briše komentar kada je prazan string — US-22 AC2", async () => {
    const lažnaRezervacija = { id: 1, komentar: "" };
    vi.mocked(prismaMock.rezervacije.update).mockResolvedValue(lažnaRezervacija as any);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "" });
    await dodajKomentar(req, res, next);

    expect(prismaMock.rezervacije.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { komentar: "" },
    });
    expect(res.json).toHaveBeenCalledWith(lažnaRezervacija);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── EDGE CASES ───────────────────────────────

  it("konvertuje string ID u broj prije slanja Prismi", async () => {
    vi.mocked(prismaMock.rezervacije.update).mockResolvedValue({ id: 42 } as any);

    const { req, res, next } = mockReqRes(
      { id: "42" },
      {},
      { komentar: "Test komentar" }
    );
    await dodajKomentar(req, res, next);

    expect(prismaMock.rezervacije.update).toHaveBeenCalledWith({
      where: { id: 42 }, // broj, ne string
      data: { komentar: "Test komentar" },
    });
    expect(next).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("poziva next pri grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.rezervacije.update).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes(
      { id: "1" },
      {},
      { komentar: "Test" }
    );
    await dodajKomentar(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

//TODO: napisati testove za funkciju promijeniTrajanje kada se impelentiraju funkcionalnosti