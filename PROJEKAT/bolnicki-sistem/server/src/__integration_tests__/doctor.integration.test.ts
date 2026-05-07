import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// 1. MOCK EMAIL SERVISA - Ovo sprječava "Missing API key" grešku
// Mora biti prije importa app.js jer app uvozi rute -> kontrolere -> emailService
vi.mock("../lib/emailService.js", () => ({
  posaljiPotvrdurezerv: vi.fn().mockResolvedValue({ success: true }),
  posaljiOtkazivanjeEmail: vi.fn().mockResolvedValue({ success: true }),
  posaljiEmailPodsjetnik: vi.fn().mockResolvedValue({ success: true }),
}));

// 2. MOCK MULTERA - Ovo sprječava "Cannot read properties of undefined (reading 'single')"
vi.mock('multer', () => {
  const multerMock = () => ({
    single: vi.fn(() => (req, res, next) => next()),
    array: vi.fn(() => (req, res, next) => next()),
    fields: vi.fn(() => (req, res, next) => next()),
  });
  multerMock.memoryStorage = vi.fn();
  multerMock.diskStorage = vi.fn();
  return {
    default: multerMock,
    __esModule: true
  };
});

// Tek nakon mock-ova uvoziš app
import app from "../app.js";

describe("GET /api/doktori", () => {
  it("vraća sve doktore", async () => {
    const res = await request(app).get("/api/doktori");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const doktor = res.body[0];
    expect(doktor).toHaveProperty("id");
    expect(doktor).toHaveProperty("ime");
    expect(doktor).toHaveProperty("prezime");
    expect(doktor).toHaveProperty("specijalizacija");
    expect(doktor).toHaveProperty("email");
    expect(doktor).toHaveProperty("trajanjePregleda");
  });

  it("filtrira doktore po specijalizaciji", async () => {
    const res = await request(app)
      .get("/api/doktori")
      .query({ specijalizacija: "Opća medicina" });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].specijalizacija).toContain("medicina");
  });

  it("vraća praznu listu za nepostojeću specijalizaciju", async () => {
    const res = await request(app)
      .get("/api/doktori")
      .query({ specijalizacija: "Nepostojeca9999" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("filtrira doktore po odjelId", async () => {
    const res = await request(app)
      .get("/api/doktori")
      .query({ odjelId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("odjelId", 1);
  });
});

describe("GET /api/doktori/:id", () => {
  it("vraća doktora po ID-u sa uključenim podacima", async () => {
    const res = await request(app).get("/api/doktori/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
    expect(res.body).toHaveProperty("specijalizacija");
    expect(res.body).toHaveProperty("korisnik");
    expect(res.body).toHaveProperty("odjel");
    expect(res.body.korisnik).toHaveProperty("email");
  });

  it("vraća 404 za nepostojećeg doktora", async () => {
    const res = await request(app).get("/api/doktori/99999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("poruka");
  });
});

describe("GET /api/doktori/:id/raspored", () => {
  it("vraća aktivan raspored doktora", async () => {
    const res = await request(app).get("/api/doktori/1/raspored");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const raspored = res.body[0];
    expect(raspored).toHaveProperty("danUSedmici");
    expect(raspored).toHaveProperty("vrijemeOd");
    expect(raspored).toHaveProperty("vrijemeDo");
    expect(raspored.aktivan).toBe(true);
  });

  it("vraća praznu listu za doktora bez rasporeda", async () => {
    const res = await request(app).get("/api/doktori/99999/raspored");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});