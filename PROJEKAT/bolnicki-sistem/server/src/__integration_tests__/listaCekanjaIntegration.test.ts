// listaCekanjaController.integration.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// Mockovi servisa
vi.mock("../listaCekanjaService.js", () => ({
  prijaviSeNaListuCekanja: vi.fn(),
  potvrdiWaitlistTermin: vi.fn(),
  odbijWaitlistTermin: vi.fn(),
  otkaziCekanje: vi.fn(),
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    pacijent: { findFirst: vi.fn() },
    listaCekanja: { findMany: vi.fn() },
    termin: { findUnique: vi.fn() },
    rezervacije: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("../lib/redis.js", () => ({
  redis: { get: vi.fn() },
}));

vi.mock("../middleware/authMiddleware.js", () => ({
  autentifikuj: (req: any, res: any, next: any) => {
    req.korisnik = { id: 1, uloga: "PACIJENT" };
    next();
  },
}));

vi.mock("../middleware/autorizacija.js", () => ({
  autorizacija: () => (req: any, res: any, next: any) => next(),
}));

import {
  prijaviSeNaListuCekanja,
  potvrdiWaitlistTermin,
  odbijWaitlistTermin,
  otkaziCekanje,
} from "../listaCekanjaService.js";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import listaCekanjaRoutes from "../routes/listaCekanjaRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/lista-cekanja", listaCekanjaRoutes);

const prismaMock = prisma as any;
const redisMock = redis as any;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── POST /api/lista-cekanja ───────────────────────────────

describe("POST /api/lista-cekanja", () => {
  it("vraća 201 pri uspješnoj prijavi", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1, hronicniBolesnik: false });
    (prijaviSeNaListuCekanja as any).mockResolvedValue({ id: 1 });

    const res = await request(app)
      .post("/api/lista-cekanja")
      .send({ doktorId: 1, zeleniDatum: "2025-06-15" });

    expect(res.status).toBe(201);
    expect(res.body.poruka).toBe("Uspješno prijavljeni na listu čekanja.");
  });

  it("vraća 400 ako nedostaje doktorId", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1, hronicniBolesnik: false });

    const res = await request(app)
      .post("/api/lista-cekanja")
      .send({ zeleniDatum: "2025-06-15" });

    expect(res.status).toBe(400);
  });

  it("vraća 404 ako pacijent nije pronađen", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/lista-cekanja")
      .send({ doktorId: 1, zeleniDatum: "2025-06-15" });

    expect(res.status).toBe(404);
  });

  it("vraća 409 ako su slobodni termini dostupni", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1, hronicniBolesnik: false });
    (prijaviSeNaListuCekanja as any).mockRejectedValue({
      status: 400,
      poruka: "Postoje slobodni termini za taj dan. Zakažite direktno.",
    });

    const res = await request(app)
      .post("/api/lista-cekanja")
      .send({ doktorId: 1, zeleniDatum: "2025-06-15" });

    expect(res.status).toBe(400);
    expect(res.body.poruka).toContain("slobodni termini");
  });
});

// ─── POST /api/lista-cekanja/:id/potvrdi ──────────────────

describe("POST /api/lista-cekanja/:id/potvrdi", () => {
  it("vraća 200 pri uspješnoj potvrdi", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1 });
    (potvrdiWaitlistTermin as any).mockResolvedValue({ rezervacija: { id: 1 } });

    const res = await request(app)
      .post("/api/lista-cekanja/1/potvrdi")
      .send({ terminIdsZaBrisanje: [] });

    expect(res.status).toBe(200);
    expect(res.body.poruka).toBe("Termin uspješno zakazan!");
  });

  it("vraća 410 ako je rok istekao", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1 });
    (potvrdiWaitlistTermin as any).mockRejectedValue({
      status: 410,
      poruka: "Rok za potvrdu je istekao. Ponuda više nije dostupna.",
    });

    const res = await request(app)
      .post("/api/lista-cekanja/1/potvrdi")
      .send({ terminIdsZaBrisanje: [] });

    expect(res.status).toBe(410);
  });

  it("proslijeđuje terminIdsZaBrisanje servisu", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1 });
    (potvrdiWaitlistTermin as any).mockResolvedValue({ rezervacija: { id: 1 } });

    await request(app)
      .post("/api/lista-cekanja/1/potvrdi")
      .send({ terminIdsZaBrisanje: [5, 6] });

    expect(potvrdiWaitlistTermin).toHaveBeenCalledWith(1, 1, [5, 6]);
  });
});

// ─── POST /api/lista-cekanja/:id/odbij ────────────────────

describe("POST /api/lista-cekanja/:id/odbij", () => {
  it("vraća 200 pri uspješnom odbijanju", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1 });
    (odbijWaitlistTermin as any).mockResolvedValue(undefined);

    const res = await request(app).post("/api/lista-cekanja/1/odbij");

    expect(res.status).toBe(200);
    expect(res.body.poruka).toBe("Termin odbijen. Ostajete u listi čekanja.");
  });

  it("vraća 404 ako zapis nije pronađen", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1 });
    (odbijWaitlistTermin as any).mockRejectedValue({ status: 404, poruka: "Zapis nije pronađen." });

    const res = await request(app).post("/api/lista-cekanja/1/odbij");

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/lista-cekanja/:id ────────────────────────

describe("DELETE /api/lista-cekanja/:id", () => {
  it("vraća 200 pri uspješnom otkazivanju", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1 });
    (otkaziCekanje as any).mockResolvedValue(undefined);

    const res = await request(app).delete("/api/lista-cekanja/1");

    expect(res.status).toBe(200);
    expect(res.body.poruka).toBe("Uspješno ste se uklonili sa liste čekanja.");
  });

  it("vraća 404 ako zapis nije aktivan", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1 });
    (otkaziCekanje as any).mockRejectedValue({ status: 404, poruka: "Zapis nije pronađen ili nije aktivan." });

    const res = await request(app).delete("/api/lista-cekanja/1");

    expect(res.status).toBe(404);
  });
});

// ─── GET /api/lista-cekanja/:id/pregled-potvrde ───────────

describe("GET /api/lista-cekanja/:id/pregled-potvrde", () => {
  it("vraća praznu listu ako nema Redis offer-a", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1 });
    redisMock.get.mockResolvedValue(null);

    const res = await request(app).get("/api/lista-cekanja/1/pregled-potvrde");

    expect(res.status).toBe(200);
    expect(res.body.kasnijiTermini).toEqual([]);
  });

  it("vraća listu kasnijih termina", async () => {
    prismaMock.pacijent.findFirst.mockResolvedValue({ id: 1 });
    redisMock.get.mockResolvedValue("5");
    prismaMock.termin.findUnique.mockResolvedValue({
      id: 5,
      idDoktor: 1,
      datum: new Date("2025-06-15"),
      doktor: { korisnik: { ime: "Marko", prezime: "Marković" } },
    });
    prismaMock.rezervacije.findMany.mockResolvedValue([
      {
        id: 10,
        idTermina: 20,
        termin: { datum: new Date("2025-07-01"), vrijeme: 540 },
      },
    ]);

    const res = await request(app).get("/api/lista-cekanja/1/pregled-potvrde");

    expect(res.status).toBe(200);
    expect(res.body.kasnijiTermini).toHaveLength(1);
    expect(res.body.kasnijiTermini[0].terminId).toBe(20);
    expect(res.body.doktorIme).toBe("Dr. Marko Marković");
  });
});