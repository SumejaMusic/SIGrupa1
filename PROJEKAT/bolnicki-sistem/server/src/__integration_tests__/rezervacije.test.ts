import { vi, describe, it, expect, beforeEach } from "vitest";

// 1. PRESRETANJE RUTA - Ovo je ključ. 
// Mock-ujemo rute tako da uopšte ne uvoze kontroler tokom inicijalizacije testa.
vi.mock("../routes/reservationRoutes.js", () => ({
  default: { post: vi.fn(), get: vi.fn(), patch: vi.fn() }
}));

// 2. MOCK ZA MULTER
vi.mock('multer', () => {
  const m = () => ({
    single: () => (req: any, res: any, next: any) => next(),
    array: () => (req: any, res: any, next: any) => next(),
  });
  m.memoryStorage = vi.fn();
  return { default: m };
});

// 3. MOCK ZA EMAIL I APP (zbog Socket.io)
vi.mock("../app.js", () => ({
  io: { emit: vi.fn() },
  default: {} 
}));

vi.mock("../lib/emailService.js", () => ({
  posaljiPotvrdurezerv: vi.fn().mockResolvedValue({ success: true }),
}));

// 4. MOCK ZA PRISMU I OSTALE SERVISE
vi.mock("../lib/prisma.js");
vi.mock("../lib/redis.js");
vi.mock("../lib/currentPatient.js");

// TEK SAD UVOZIMO KONTROLER
import { prismaMock } from "../lib/__mocks__/prisma.js";
import { redisMock } from "../lib/__mocks__/redis.js";
import { kreirajRezervaciju } from "../controllers/reservationController.js";
import { getCurrentPacijent } from "../lib/currentPatient.js";

const mockReqRes = (body = {}) => ({
  req: { body, korisnik: { id: 1 } } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any,
  next: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Rezervacije Testovi", () => {
  it("uspješno kreira rezervaciju", async () => {
    vi.mocked(getCurrentPacijent).mockResolvedValue({ id: 10, idKorisnik: 1 } as any);
    vi.mocked(prismaMock.termin.findUnique).mockResolvedValue({ id: 5, idDoktor: 2, status: "SLOBODAN" } as any);
    vi.mocked(redisMock.get).mockResolvedValue("1");
    
    // Mock za transakciju mora vratiti objekt koji liči na rezervaciju
    vi.mocked(prismaMock.$transaction).mockResolvedValue({
      id: 99,
      doktor: { korisnik: { ime: "Dr", prezime: "Test" } },
      pacijent: { korisnik: { email: "p@p.com" } },
      termin: { datum: new Date() }
    } as any);

    const { req, res, next } = mockReqRes({ terminId: 5, doktorId: 2 });
    await kreirajRezervaciju(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});