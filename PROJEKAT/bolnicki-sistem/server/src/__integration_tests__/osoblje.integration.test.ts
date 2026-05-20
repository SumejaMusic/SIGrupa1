import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

vi.mock("../emailService.js", () => ({
  posaljiPotvrdurezerv:      vi.fn().mockResolvedValue(undefined),
  posaljiResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
  posaljiVerifikacioniKod:   vi.fn().mockResolvedValue(undefined),
}));

const JWT_SECRET       = process.env.JWT_SECRET ?? "test-secret";
const ISPRAVNA_LOZINKA = "TestAuth123!";

// ─── State ───────────────────────────────────────────────────────────────────
let tokenOsoblje:  string;
let tokenDoktor:   string;
let tokenPacijent: string;

let idOsoblje:  number;
let idDoktor:   number;
let idPacijent: number;

let originalHashOsoblje:  string;
let originalHashDoktor:   string;
let originalHashPacijent: string;

let idRezervacije:  number | undefined;
let idNalaza:       number | undefined;

// ─── beforeAll ───────────────────────────────────────────────────────────────
beforeAll(async () => {
  const noviHash = await bcrypt.hash(ISPRAVNA_LOZINKA, 4);

  const osoblje  = await prisma.korisnik.findFirst({ where: { uloga: "MEDICINSKO_OSOBLJE" } });
  const doktor   = await prisma.korisnik.findFirst({ where: { uloga: "DOKTOR" } });
  const pacijent = await prisma.korisnik.findFirst({ where: { uloga: "PACIJENT" } });

  if (!osoblje)  console.warn("beforeAll: MEDICINSKO_OSOBLJE nije pronađeno u bazi.");
  if (!doktor)   console.warn("beforeAll: DOKTOR nije pronađen u bazi.");
  if (!pacijent) console.warn("beforeAll: PACIJENT nije pronađen u bazi.");

  if (osoblje) {
    originalHashOsoblje = osoblje.pristupnaSifra;
    idOsoblje           = osoblje.id;
  }
  if (doktor) {
    originalHashDoktor = doktor.pristupnaSifra;
    idDoktor           = doktor.id;
  }
  if (pacijent) {
    originalHashPacijent = pacijent.pristupnaSifra;
    idPacijent           = pacijent.id;
  }

  const idsZaUpdate = [idOsoblje, idDoktor, idPacijent].filter((id): id is number => id !== undefined);
  if (idsZaUpdate.length > 0) {
    await prisma.korisnik.updateMany({
      where: { id: { in: idsZaUpdate } },
      data: {
        pristupnaSifra:         noviHash,
        nalogZakljucan:         false,
        brojNeuspjelihPrijava:  0,
        vrijemeZakljucavanja:   null,
        zadnjiNeuspjeliPokusaj: null,
      },
    });
  }

  if (idOsoblje) {
    tokenOsoblje = jwt.sign({ id: idOsoblje, uloga: "MEDICINSKO_OSOBLJE" }, JWT_SECRET, { expiresIn: "1h" });
  }
  if (idDoktor) {
    tokenDoktor = jwt.sign({ id: idDoktor, uloga: "DOKTOR" }, JWT_SECRET, { expiresIn: "1h" });
  }
  if (idPacijent) {
    tokenPacijent = jwt.sign({ id: idPacijent, uloga: "PACIJENT" }, JWT_SECRET, { expiresIn: "1h" });
  }

  // Pronađi završenu rezervaciju za pregled testove.
  // historija.nalaz je Prisma one-to-many (array), ali TypeScript ga može
  // tipizirati kao single object ovisno o verziji šeme — Array.isArray guard
  // rješava ts(2345) bez gubljenja runtime ispravnosti.
  const zavrsenaRezervacija = await prisma.rezervacije.findFirst({
    where: { zavrseno: true },
    include: { historija: { include: { nalaz: true } } },
  });
  if (zavrsenaRezervacija) {
    idRezervacije = zavrsenaRezervacija.id;
    const rawNalaz = zavrsenaRezervacija.historija?.nalaz;
    const prviNalaz = Array.isArray(rawNalaz) ? rawNalaz[0] : undefined;
    if (prviNalaz) idNalaza = prviNalaz.id;
  }
});

// ─── afterAll ────────────────────────────────────────────────────────────────
afterAll(async () => {
  if (idOsoblje  && originalHashOsoblje)  await prisma.korisnik.update({ where: { id: idOsoblje  }, data: { pristupnaSifra: originalHashOsoblje  } });
  if (idDoktor   && originalHashDoktor)   await prisma.korisnik.update({ where: { id: idDoktor   }, data: { pristupnaSifra: originalHashDoktor   } });
  if (idPacijent && originalHashPacijent) await prisma.korisnik.update({ where: { id: idPacijent }, data: { pristupnaSifra: originalHashPacijent } });
  await prisma.$disconnect();
});

// ─── Helper: auth header ─────────────────────────────────────────────────────
const authOsoblje  = () => ({ Authorization: `Bearer ${tokenOsoblje}`,  "x-test-korisnik-id": String(idOsoblje)  });
const authDoktor   = () => ({ Authorization: `Bearer ${tokenDoktor}`,   "x-test-korisnik-id": String(idDoktor)   });
const authPacijent = () => ({ Authorization: `Bearer ${tokenPacijent}`, "x-test-korisnik-id": String(idPacijent) });

// ═════════════════════════════════════════════════════════════════════════════
// AUTORIZACIJA — zaštita ruta
// ═════════════════════════════════════════════════════════════════════════════
describe("Autorizacija — osoblje rute", () => {
  it("vraća 401 bez tokena", async () => {
    const res = await request(app).get("/api/osoblje/termini");
    expect(res.status).toBe(401);
  });

  it("vraća 403 kada pacijent pokušava pristupiti osoblje ruti", async () => {
    if (!tokenPacijent) return console.warn("Skip: PACIJENT nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini")
      .set(authPacijent());
    expect(res.status).toBe(403);
  });

  it("dozvoljava pristup medicinskom osoblju", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini")
      .set(authOsoblje());
    expect(res.status).toBe(200);
  });

  it("dozvoljava pristup doktoru", async () => {
    if (!tokenDoktor) return console.warn("Skip: DOKTOR nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini")
      .set(authDoktor());
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/termini
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje/termini", () => {
  it("vraća listu termina za danas", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/termini").set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća termine za proslijeđeni datum", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini")
      .query({ datum: "2026-05-17" })
      .set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća 400 za neispravan format datuma", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini")
      .query({ datum: "nije-datum" })
      .set(authOsoblje());
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/termini/svi
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje/termini/svi", () => {
  it("vraća sve termine", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/termini/svi").set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/termini/pretraga
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje/termini/pretraga", () => {
  it("vraća rezultate pretrage po imenu", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini/pretraga")
      .query({ ime: "An" })
      .set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća 400 kada ime ima manje od 2 karaktera", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini/pretraga")
      .query({ ime: "A" })
      .set(authOsoblje());
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it("vraća 400 kada ime nije proslijeđeno", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini/pretraga")
      .set(authOsoblje());
    expect(res.status).toBe(400);
  });

  it("vraća prazan niz za nepostojeće ime", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini/pretraga")
      .query({ ime: "Xyznepostoji9999" })
      .set(authOsoblje());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/termini/otkazani
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje/termini/otkazani", () => {
  it("vraća sve otkazane termine bez filtera", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/termini/otkazani").set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća otkazane termine za datum u DD-MM-YYYY formatu", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini/otkazani")
      .query({ datum: "17-05-2026" })
      .set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća 400 za neispravan format datuma", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini/otkazani")
      .query({ datum: "2026-05-17" })
      .set(authOsoblje());
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/termini/hitni
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje/termini/hitni", () => {
  it("vraća sve hitne termine", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/termini/hitni").set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/termini/zavrseni
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje/termini/zavrseni", () => {
  it("vraća sve završene preglede", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/termini/zavrseni").set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("filtrira završene preglede po idPacijenta", async () => {
    if (!tokenOsoblje || !idPacijent) return console.warn("Skip.");
    const res = await request(app)
      .get("/api/osoblje/termini/zavrseni")
      .query({ idPacijenta: idPacijent })
      .set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća 400 za neispravan idPacijenta", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .get("/api/osoblje/termini/zavrseni")
      .query({ idPacijenta: "abc" })
      .set(authOsoblje());
    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/termini/:id
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje/termini/:id", () => {
  it("vraća 404 za nepostojeći ID", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/termini/99999999").set(authOsoblje());
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("poruka");
  });

  it("vraća 400 za neispravan ID", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/termini/abc").set(authOsoblje());
    expect(res.status).toBe(400);
  });

  it("vraća detalje rezervacije za postojeći ID", async () => {
    if (!tokenOsoblje || !idRezervacije) return console.warn("Skip: nema rezervacije u bazi.");
    const res = await request(app)
      .get(`/api/osoblje/termini/${idRezervacije}`)
      .set(authOsoblje());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", idRezervacije);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/osoblje/termini/:id/hitnost
// ═════════════════════════════════════════════════════════════════════════════
describe("PATCH /api/osoblje/termini/:id/hitnost", () => {
  it("vraća 400 kada hitnost nije boolean", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .patch("/api/osoblje/termini/1/hitnost")
      .set(authOsoblje())
      .send({ hitnost: "true" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it("vraća 400 za neispravan ID", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .patch("/api/osoblje/termini/abc/hitnost")
      .set(authOsoblje())
      .send({ hitnost: true });
    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/osoblje/termini/:id/otkazi
// ═════════════════════════════════════════════════════════════════════════════
describe("PATCH /api/osoblje/termini/:id/otkazi", () => {
  it("vraća 400 kada potvrda nije proslijeđena", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .patch("/api/osoblje/termini/1/otkazi")
      .set(authOsoblje())
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it("vraća 400 za neispravan ID", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .patch("/api/osoblje/termini/abc/otkazi")
      .set(authOsoblje())
      .send({ potvrda: true });
    expect(res.status).toBe(400);
  });

  it("vraća 404 za nepostojeću rezervaciju", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app)
      .patch("/api/osoblje/termini/99999999/otkazi")
      .set(authOsoblje())
      .send({ potvrda: true });
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/pacijenti / doktori / odjeli / sobe / tipovi-pregleda
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje — dropdown liste", () => {
  it("vraća listu pacijenata", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/pacijenti").set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("vraća listu doktora", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/doktori").set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("vraća listu odjela", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/odjeli").set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("vraća listu soba", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/sobe").set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća tipove pregleda", async () => {
    if (!tokenOsoblje) return console.warn("Skip: MEDICINSKO_OSOBLJE nije u bazi.");
    const res = await request(app).get("/api/osoblje/tipovi-pregleda").set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/termini/slobodni/:idDoktor
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje/termini/slobodni/:idDoktor", () => {
  it("vraća slobodne termine za doktora i datum", async () => {
    if (!tokenOsoblje || !idDoktor) return console.warn("Skip.");
    const res = await request(app)
      .get(`/api/osoblje/termini/slobodni/${idDoktor}`)
      .query({ datum: "2026-06-01" })
      .set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća 400 kada datum nije proslijeđen", async () => {
    if (!tokenOsoblje || !idDoktor) return console.warn("Skip.");
    const res = await request(app)
      .get(`/api/osoblje/termini/slobodni/${idDoktor}`)
      .set(authOsoblje());
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/termini/slobodni-datumi/:idDoktor
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje/termini/slobodni-datumi/:idDoktor", () => {
  it("vraća slobodne datume za doktora", async () => {
    if (!tokenOsoblje || !idDoktor) return console.warn("Skip.");
    const res = await request(app)
      .get(`/api/osoblje/termini/slobodni-datumi/${idDoktor}`)
      .set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća 400 za neispravan ID doktora", async () => {
    if (!tokenOsoblje) return console.warn("Skip.");
    const res = await request(app)
      .get("/api/osoblje/termini/slobodni-datumi/abc")
      .set(authOsoblje());
    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/nalazi/pacijent/:idPacijenta
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje/nalazi/pacijent/:idPacijenta", () => {
  it("vraća nalaze za pacijenta", async () => {
    if (!tokenOsoblje || !idPacijent) return console.warn("Skip.");
    const res = await request(app)
      .get(`/api/osoblje/nalazi/pacijent/${idPacijent}`)
      .set(authOsoblje());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća prazan niz za pacijenta bez nalaza", async () => {
    if (!tokenOsoblje) return console.warn("Skip.");
    const res = await request(app)
      .get("/api/osoblje/nalazi/pacijent/99999999")
      .set(authOsoblje());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("vraća 400 za neispravan ID pacijenta", async () => {
    if (!tokenOsoblje) return console.warn("Skip.");
    const res = await request(app)
      .get("/api/osoblje/nalazi/pacijent/abc")
      .set(authOsoblje());
    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/osoblje/nalazi/:id/pdf
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/osoblje/nalazi/:id/pdf", () => {
  it("vraća 404 za nepostojeći nalaz", async () => {
    if (!tokenOsoblje) return console.warn("Skip.");
    const res = await request(app)
      .get("/api/osoblje/nalazi/99999999/pdf")
      .set(authOsoblje());
    expect(res.status).toBe(404);
  });

  it("vraća 400 za neispravan ID nalaza", async () => {
    if (!tokenOsoblje) return console.warn("Skip.");
    const res = await request(app)
      .get("/api/osoblje/nalazi/abc/pdf")
      .set(authOsoblje());
    expect(res.status).toBe(400);
  });

  it("vraća PDF sa ispravnim Content-Type headerom", async () => {
    if (!tokenOsoblje || !idNalaza) return console.warn("Skip: nema nalaza u bazi.");
    const res = await request(app)
      .get(`/api/osoblje/nalazi/${idNalaza}/pdf`)
      .set(authOsoblje());
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/pregledi/:rezervacijaId
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/pregledi/:rezervacijaId", () => {
  it("vraća historiju pregleda za završenu rezervaciju", async () => {
    if (!tokenDoktor || !idRezervacije) return console.warn("Skip: nema završene rezervacije.");
    const res = await request(app)
      .get(`/api/pregledi/${idRezervacije}`)
      .set(authDoktor());
    expect(res.status).toBe(200);
    if (res.body !== null) {
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("dijagnoza");
      expect(res.body).toHaveProperty("terapija");
      expect(res.body).toHaveProperty("recepti");
      expect(res.body).toHaveProperty("nalaz");
    }
  });

  it("vraća null za rezervaciju bez historije", async () => {
    if (!tokenDoktor) return console.warn("Skip: DOKTOR nije u bazi.");
    const rezervacijaBezHistorije = await prisma.rezervacije.findFirst({
      where: { historija: null },
    });
    if (!rezervacijaBezHistorije) return console.warn("Skip: sve rezervacije imaju historiju.");
    const res = await request(app)
      .get(`/api/pregledi/${rezervacijaBezHistorije.id}`)
      .set(authDoktor());
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/pregledi/:rezervacijaId/zavrsi
// ═════════════════════════════════════════════════════════════════════════════
describe("POST /api/pregledi/:rezervacijaId/zavrsi", () => {
  it("vraća 400 kada dijagnoza ili terapija nedostaju", async () => {
    if (!tokenDoktor) return console.warn("Skip: DOKTOR nije u bazi.");
    const res = await request(app)
      .post("/api/pregledi/1/zavrsi")
      .set(authDoktor())
      .send({ dijagnoza: "Grip" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka", "Dijagnoza i terapija su obavezni.");
  });

  it("vraća 404 za nepostojeću rezervaciju", async () => {
    if (!tokenDoktor) return console.warn("Skip: DOKTOR nije u bazi.");
    const res = await request(app)
      .post("/api/pregledi/99999999/zavrsi")
      .set(authDoktor())
      .send({ dijagnoza: "Grip", terapija: "Odmor" });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("poruka");
  });
});