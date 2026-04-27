import { vi, describe, it, expect } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import { redisMock } from "../lib/__mocks__/redis.js";
import {
  getSlobodniTermini,
  getTerminById,
  zaključajTermin,
  oslobodiTermin,
} from "../controllers/terminController.js";

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
// getSlobodniTermini — US-05 AC4
// ─────────────────────────────────────────────
describe("getSlobodniTermini", () => {
  // ─── HAPPY PATH ───────────────────────────────

  it("vraća sve slobodne termine kada nema filtera i nema Redis lockova", async () => {
    const lažniTermini = [
      { id: 1, idDoktor: 1, datum: new Date("2025-06-01"), status: "SLOBODAN" },
      { id: 2, idDoktor: 2, datum: new Date("2025-06-02"), status: "SLOBODAN" },
    ];
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue(lažniTermini as any);
    vi.mocked(redisMock.get).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({}, {});
    await getSlobodniTermini(req, res, next);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          idDoktor: undefined,
          datum: undefined,
          status: "SLOBODAN",
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(lažniTermini);
    expect(next).not.toHaveBeenCalled();
  });

  it("filtrira termine po doktorId i vraća samo njegove termine — US-05 AC1", async () => {
    const lažniTermini = [
      { id: 1, idDoktor: 5, datum: new Date("2025-06-01"), status: "SLOBODAN" },
    ];
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue(lažniTermini as any);
    vi.mocked(redisMock.get).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({}, { doktorId: "5" });
    await getSlobodniTermini(req, res, next);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          idDoktor: 5,
          status: "SLOBODAN",
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(lažniTermini);
    expect(next).not.toHaveBeenCalled();
  });

  it("filtrira termine po datumu i vraća samo termine za taj dan", async () => {
    const lažniTermini = [
      { id: 1, idDoktor: 1, datum: new Date("2025-06-01"), status: "SLOBODAN" },
    ];
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue(lažniTermini as any);
    vi.mocked(redisMock.get).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({}, { datum: "2025-06-01" });
    await getSlobodniTermini(req, res, next);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          datum: new Date("2025-06-01"),
          status: "SLOBODAN",
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(lažniTermini);
    expect(next).not.toHaveBeenCalled();
  });

  it("filtrira termine po doktorId i datumu istovremeno i vraća rezultat", async () => {
    const lažniTermini = [
      { id: 1, idDoktor: 5, datum: new Date("2025-06-01"), status: "SLOBODAN" },
    ];
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue(lažniTermini as any);
    vi.mocked(redisMock.get).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({}, { doktorId: "5", datum: "2025-06-01" });
    await getSlobodniTermini(req, res, next);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          idDoktor: 5,
          datum: new Date("2025-06-01"),
          status: "SLOBODAN",
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(lažniTermini);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── REDIS LOCK — US-05 AC4, US-12 ───────────

  it("skriva zaključan termin i vraća samo slobodne — US-05 AC4", async () => {
    const lažniTermini = [
      { id: 1, status: "SLOBODAN" },
      { id: 2, status: "SLOBODAN" },
    ];
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue(lažniTermini as any);
    vi.mocked(redisMock.get).mockImplementation(async (key) =>
      key === "termin:lock:1" ? "999" : null
    );

    const { req, res, next } = mockReqRes({}, {});
    await getSlobodniTermini(req, res, next);

    expect(res.json).toHaveBeenCalledWith([lažniTermini[1]]);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća prazan niz kada su svi termini zaključani — US-05 AC4", async () => {
    const lažniTermini = [
      { id: 1, status: "SLOBODAN" },
      { id: 2, status: "SLOBODAN" },
    ];
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue(lažniTermini as any);
    vi.mocked(redisMock.get).mockResolvedValue("999");

    const { req, res, next } = mockReqRes({}, {});
    await getSlobodniTermini(req, res, next);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "SLOBODAN" }),
      })
    );
    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("prikazuje termin zaključan od istog korisnika — US-12", async () => {
    const lažniTermini = [{ id: 1, status: "SLOBODAN" }];
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue(lažniTermini as any);
    // isti korisnik ima lock — termin se prikazuje kao zauzet svima
    vi.mocked(redisMock.get).mockResolvedValue("1");

    const { req, res, next } = mockReqRes({}, {});
    await getSlobodniTermini(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── EDGE CASES ───────────────────────────────

  it("vraća prazan niz kada nema termina u bazi", async () => {
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, {});
    await getSlobodniTermini(req, res, next);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "SLOBODAN" }),
      })
    );
    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća prazan niz kada doktor nema termina", async () => {
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue([]);
    vi.mocked(redisMock.get).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({}, { doktorId: "999" });
    await getSlobodniTermini(req, res, next);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          idDoktor: 999,
          status: "SLOBODAN",
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("vraća prazan niz kada nema termina za traženi datum", async () => {
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue([]);
    vi.mocked(redisMock.get).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({}, { datum: "2099-01-01" });
    await getSlobodniTermini(req, res, next);

    expect(prismaMock.termin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          datum: new Date("2099-01-01"),
          status: "SLOBODAN",
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("poziva next pri Prisma grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.termin.findMany).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {});
    await getSlobodniTermini(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });

  it("poziva next pri Redis grešci i ne vraća odgovor", async () => {
    const lažniTermini = [{ id: 1, status: "SLOBODAN" }];
    const greška = new Error("Redis greška");
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue(lažniTermini as any);
    vi.mocked(redisMock.get).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({}, {});
    await getSlobodniTermini(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe("getTerminById", () => {
  // ─── HAPPY PATH ───────────────────────────────

  it("vraća termin sa svim podacima kada postoji — US-05 AC3", async () => {
    const lažniTermin = {
      id: 1,
      status: "SLOBODAN",
      doktor: { id: 2, ime: "Dr. Marić" },
    };
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(lažniTermin as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getTerminById(req, res, next);

    expect(prismaMock.termin.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(res.json).toHaveBeenCalledWith(lažniTermin);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("uključuje podatke o doktoru u odgovoru — US-05 AC3", async () => {
    const lažniTermin = {
      id: 5,
      status: "SLOBODAN",
      datum: new Date("2025-06-01"),
      doktor: { id: 2, ime: "Dr. Marić", specijalizacija: "Kardiologija" },
    };
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(lažniTermin as any);

    const { req, res, next } = mockReqRes({ id: "5" });
    await getTerminById(req, res, next);

    expect(prismaMock.termin.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5 },
        include: { doktor: true },
      })
    );
    expect(res.json).toHaveBeenCalledWith(lažniTermin);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── 404 SLUČAJEVI ────────────────────────────

  it("vraća 404 kada termin ne postoji — US-05 AC3", async () => {
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ id: "999" });
    await getTerminById(req, res, next);

    expect(prismaMock.termin.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 999 } })
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin nije pronađen." });
    expect(next).not.toHaveBeenCalled();
  });

  // ─── EDGE CASES ───────────────────────────────

  it("konvertuje string ID u broj prije slanja Prismi", async () => {
    const lažniTermin = { id: 42, status: "SLOBODAN", doktor: {} };
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(lažniTermin as any);

    const { req, res, next } = mockReqRes({ id: "42" });
    await getTerminById(req, res, next);

    expect(prismaMock.termin.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } })
    );
    expect(res.json).toHaveBeenCalledWith(lažniTermin);
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva next kada je ID nevalidan string koji postaje NaN", async () => {
    vi.mocked(prismaMock.termin.findUnique).mockImplementation(({ where }: any) => {
      if (isNaN(where.id)) {
        return Promise.reject(new Error("Nevalidan ID"));
      }
      return Promise.resolve(null);
    });

    const { req, res, next } = mockReqRes({ id: "abc" });
    await getTerminById(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("poziva next pri DB grešci i ne vraća odgovor", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.termin.findUnique).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getTerminById(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// zaključajTermin — US-12, US-13 AC2
// ─────────────────────────────────────────────
describe("zaključajTermin", () => {
  // ─── HAPPY PATH ───────────────────────────────

  it("uspješno zaključava slobodan termin i vraća potvrdu — US-12 AC1", async () => {
    vi.mocked(redisMock.get).mockResolvedValue(null);
    vi.mocked(redisMock.setex).mockResolvedValue("OK");

    const { req, res, next } = mockReqRes({ id: "1" }, {}, {}, { id: 1 });
    await zaključajTermin(req, res, next);

    expect(redisMock.setex).toHaveBeenCalledWith("termin:lock:1", 120, "1");
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Termin uspješno zaključan.",
      ttl: 120,
    });
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("lock traje tačno 120 sekundi (2 minute) — US-12 AC1", async () => {
    vi.mocked(redisMock.get).mockResolvedValue(null);
    vi.mocked(redisMock.setex).mockResolvedValue("OK");

    const { req, res, next } = mockReqRes({ id: "5" }, {}, {}, { id: 3 });
    await zaključajTermin(req, res, next);

    expect(redisMock.setex).toHaveBeenCalledWith("termin:lock:5", 120, "3");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ttl: 120 })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("dozvoljava istom korisniku da obnovi lock i vraća potvrdu — US-12", async () => {
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(redisMock.setex).mockResolvedValue("OK");

    const { req, res, next } = mockReqRes({ id: "1" }, {}, {}, { id: 1 });
    await zaključajTermin(req, res, next);

    expect(redisMock.setex).toHaveBeenCalledWith("termin:lock:1", 120, "1");
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Termin uspješno zaključan.",
      ttl: 120,
    });
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── 409 SLUČAJEVI — US-13 AC2 ───────────────

  it("vraća 409 kada termin zaključao drugi korisnik i ne postavlja novi lock — US-13 AC2", async () => {
    vi.mocked(redisMock.get).mockResolvedValue("999");

    const { req, res, next } = mockReqRes({ id: "1" }, {}, {}, { id: 1 });
    await zaključajTermin(req, res, next);

    expect(redisMock.get).toHaveBeenCalledWith("termin:lock:1");
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Termin je trenutno zauzet. Pokušajte ponovo.",
    });
    expect(redisMock.setex).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── EDGE CASES ───────────────────────────────

  it("konvertuje string ID termina u ispravan Redis ključ", async () => {
    vi.mocked(redisMock.get).mockResolvedValue(null);
    vi.mocked(redisMock.setex).mockResolvedValue("OK");

    const { req, res, next } = mockReqRes({ id: "42" }, {}, {}, { id: 7 });
    await zaključajTermin(req, res, next);

    expect(redisMock.get).toHaveBeenCalledWith("termin:lock:42");
    expect(redisMock.setex).toHaveBeenCalledWith("termin:lock:42", 120, "7");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ poruka: "Termin uspješno zaključan." })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("sprječava zaključavanje od strane korisnika čiji ID je sličan ali nije isti — US-13 AC2", async () => {
    vi.mocked(redisMock.get).mockResolvedValue("1");

    const { req, res, next } = mockReqRes({ id: "1" }, {}, {}, { id: 10 });
    await zaključajTermin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Termin je trenutno zauzet. Pokušajte ponovo.",
    });
    expect(redisMock.setex).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("poziva next pri Redis grešci na get i ne vraća odgovor", async () => {
    const greška = new Error("Redis greška");
    vi.mocked(redisMock.get).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, {}, { id: 1 });
    await zaključajTermin(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("poziva next pri Redis grešci na setex i ne vraća odgovor", async () => {
    const greška = new Error("Redis setex greška");
    vi.mocked(redisMock.get).mockResolvedValue(null);
    vi.mocked(redisMock.setex).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" }, {}, {}, { id: 1 });
    await zaključajTermin(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("oslobodiTermin", () => {
  // ─── HAPPY PATH ───────────────────────────────

  it("uspješno oslobađa zaključan termin i vraća potvrdu — US-12", async () => {
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({ id: "1" });
    await oslobodiTermin(req, res, next);

    expect(redisMock.del).toHaveBeenCalledWith("termin:lock:1");
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin oslobođen." });
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("uspješno oslobađa termin koji nije bio zaključan — US-12", async () => {
    vi.mocked(redisMock.del).mockResolvedValue(0);

    const { req, res, next } = mockReqRes({ id: "1" });
    await oslobodiTermin(req, res, next);

    expect(redisMock.del).toHaveBeenCalledWith("termin:lock:1");
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin oslobođen." });
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  // ─── EDGE CASES ───────────────────────────────

  it("konvertuje string ID u ispravan Redis ključ", async () => {
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({ id: "42" });
    await oslobodiTermin(req, res, next);

    expect(redisMock.del).toHaveBeenCalledWith("termin:lock:42");
    expect(res.json).toHaveBeenCalledWith({ poruka: "Termin oslobođen." });
    expect(next).not.toHaveBeenCalled();
  });

  it("poziva del samo jednom po zahtjevu", async () => {
    vi.mocked(redisMock.del).mockResolvedValue(1);

    const { req, res, next } = mockReqRes({ id: "1" });
    await oslobodiTermin(req, res, next);

    expect(redisMock.del).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("poziva next pri Redis grešci i ne vraća odgovor", async () => {
    const greška = new Error("Redis greška");
    vi.mocked(redisMock.del).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" });
    await oslobodiTermin(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});