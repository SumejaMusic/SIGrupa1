import { vi, describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import { redisMock } from "../lib/__mocks__/redis.js";
import { forgotPassword, resetPassword } from "../controllers/authController.js";

vi.mock("../lib/prisma.js");
vi.mock("../lib/redis.js");
vi.mock("../emailService.js");
vi.mock("../lib/encryption.js", () => ({
  enkriptuj: vi.fn((tekst: string) => `enc:${tekst}`),
  dekriptuj: vi.fn((tekst: string) => tekst.replace("enc:", "")),
}));
const mockReqRes = (body = {}, headers = {}) => ({
  req: {
    body,
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
    headers,
  } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────
// forgotPassword
// ─────────────────────────────────────────────
describe("forgotPassword", () => {
  const genericnaPortuka = "Ukoliko račun postoji, poslan je email za reset lozinke.";

  // ─── HAPPY PATH ───────────────────────────────

  it("vraća generičku poruku kada korisnik postoji i šalje email — AC1", async () => {
    vi.mocked(redisMock.get).mockResolvedValue(null);
    vi.mocked(redisMock.ttl).mockResolvedValue(-1);
    vi.mocked(redisMock.setex).mockResolvedValue(undefined as any);
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue({
      id: 1,
      email: "test@test.com",
      ime: "Test",
    } as any);

    const { req, res } = mockReqRes({ email: "test@test.com" });
    await forgotPassword(req, res);

    expect(prismaMock.korisnik.findUnique).toHaveBeenCalledWith({
      where: { email: "test@test.com" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ poruka: genericnaPortuka });
  });

  it("vraća generičku poruku kada korisnik NE postoji — sigurnost", async () => {
    vi.mocked(redisMock.get).mockResolvedValue(null);
    vi.mocked(redisMock.ttl).mockResolvedValue(-1);
    vi.mocked(redisMock.setex).mockResolvedValue(undefined as any);
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(null);

    const { req, res } = mockReqRes({ email: "nepostoji@test.com" });
    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ poruka: genericnaPortuka });
  });

  // ─── RATE LIMITING ────────────────────────────

  it("vraća 429 kada je prekoračen rate limit (3 zahtjeva)", async () => {
    vi.mocked(redisMock.get).mockResolvedValue("3");
    vi.mocked(redisMock.ttl).mockResolvedValue(900);

    const { req, res } = mockReqRes({ email: "test@test.com" });
    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Previše zahtjeva. Pokušajte ponovo kasnije.",
    });
    expect(prismaMock.korisnik.findUnique).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("vraća 500 pri grešci na serveru", async () => {
    vi.mocked(redisMock.get).mockRejectedValue(new Error("Redis greška"));

    const { req, res } = mockReqRes({ email: "test@test.com" });
    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Greška na serveru." });
  });
});

// ─────────────────────────────────────────────
// resetPassword
// ─────────────────────────────────────────────
describe("resetPassword", () => {

  // ─── HAPPY PATH ───────────────────────────────

  it("uspješno resetuje lozinku sa validnim tokenom — AC1", async () => {
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(redisMock.del).mockResolvedValue(1);
    vi.mocked(prismaMock.korisnik.update).mockResolvedValue({} as any);

    const { req, res } = mockReqRes({
      token: "validantoken123",
      newPassword: "NovaLozinka1!",
    });
    await resetPassword(req, res);

    expect(redisMock.get).toHaveBeenCalledWith("reset-password:validantoken123");
    expect(prismaMock.korisnik.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(redisMock.del).toHaveBeenCalledWith("reset-password:validantoken123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Lozinka je uspješno resetovana.",
    });
  });

  it("briše token iz Redisa nakon uspješnog reseta", async () => {
    vi.mocked(redisMock.get).mockResolvedValue("1");
    vi.mocked(redisMock.del).mockResolvedValue(1);
    vi.mocked(prismaMock.korisnik.update).mockResolvedValue({} as any);

    const { req, res } = mockReqRes({
      token: "validantoken123",
      newPassword: "NovaLozinka1!",
    });
    await resetPassword(req, res);

    expect(redisMock.del).toHaveBeenCalledWith("reset-password:validantoken123");
  });

  // ─── 400 SLUČAJEVI ────────────────────────────

  it("vraća 400 kada token nedostaje", async () => {
    const { req, res } = mockReqRes({ newPassword: "NovaLozinka1!" });
    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Nedostaje token." });
    expect(prismaMock.korisnik.update).not.toHaveBeenCalled();
  });

  it("vraća 400 kada je token nevažeći ili istekao", async () => {
    vi.mocked(redisMock.get).mockResolvedValue(null);

    const { req, res } = mockReqRes({
      token: "istekaotoken",
      newPassword: "NovaLozinka1!",
    });
    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Nevažeći ili istekao token.",
    });
    expect(prismaMock.korisnik.update).not.toHaveBeenCalled();
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("vraća 500 pri grešci na serveru", async () => {
    vi.mocked(redisMock.get).mockRejectedValue(new Error("Redis greška"));

    const { req, res } = mockReqRes({
      token: "validantoken123",
      newPassword: "NovaLozinka1!",
    });
    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      poruka: "Greška na serveru prilikom resetovanja lozinke.",
    });
  });
});