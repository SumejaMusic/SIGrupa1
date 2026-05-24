import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, redisMock, ioMock } = vi.hoisted(() => {
  const prismaMock = {
    termin: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    listaCekanja: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    rezervacije: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const redisMock = {
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    sadd: vi.fn(),
    smembers: vi.fn(),
    expire: vi.fn(),
  };

  const ioMock = {
    emit: vi.fn(),
    to: vi.fn().mockReturnThis(),
  };

  return { prismaMock, redisMock, ioMock };
});

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../lib/redis.js", () => ({ redis: redisMock }));
vi.mock("../app.js", () => ({ io: ioMock }));
vi.mock("../emailService.js", () => ({
  posaljiWaitlistNotifikaciju: vi.fn().mockResolvedValue(undefined),
}));

import {
  prijaviSeNaListuCekanja,
  potvrdiWaitlistTermin,
  odbijWaitlistTermin,
  otkaziCekanje,
} from "../listaCekanjaService.js";

beforeEach(() => {
  vi.clearAllMocks();
});


// ─── prijaviSeNaListuCekanja ───────────────────────────────

describe("prijaviSeNaListuCekanja", () => {
  it("baca grešku ako doktor ne radi taj dan", async () => {
    prismaMock.termin.findFirst.mockResolvedValue(null);

    await expect(
      prijaviSeNaListuCekanja(1, 1, new Date())
    ).rejects.toMatchObject({ status: 400, poruka: "Doktor ne radi taj dan." });
  });

  it("baca grešku ako postoje slobodni termini", async () => {
    prismaMock.termin.findFirst
      .mockResolvedValueOnce({ id: 1 }) // terminPostoji
      .mockResolvedValueOnce({ id: 2, status: "SLOBODAN" }); // slobodanTermin

    await expect(
      prijaviSeNaListuCekanja(1, 1, new Date())
    ).rejects.toMatchObject({ status: 400, poruka: "Postoje slobodni termini za taj dan. Zakažite direktno." });
  });

  it("kreira zapis ako su svi termini zauzeti", async () => {
    prismaMock.termin.findFirst
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce(null);
    prismaMock.listaCekanja.create.mockResolvedValue({ id: 1, idPacijent: 1, idDoktor: 1 });

    const result = await prijaviSeNaListuCekanja(1, 1, new Date(), "NORMALAN");
    expect(prismaMock.listaCekanja.create).toHaveBeenCalledOnce();
    expect(result).toHaveProperty("id", 1);
  });
});

// ─── potvrdiWaitlistTermin ─────────────────────────────────

describe("potvrdiWaitlistTermin", () => {
  it("baca 404 ako zapis nije pronađen", async () => {
    prismaMock.listaCekanja.findFirst.mockResolvedValue(null);

    await expect(
      potvrdiWaitlistTermin(1, 1)
    ).rejects.toMatchObject({ status: 404 });
  });

  it("baca 410 ako je Redis offer istekao", async () => {
    prismaMock.listaCekanja.findFirst.mockResolvedValue({ id: 1, idPacijent: 1, status: "OBAVIJESTEN" });
    redisMock.get.mockResolvedValue(null);

    await expect(
      potvrdiWaitlistTermin(1, 1)
    ).rejects.toMatchObject({ status: 410 });
  });

  it("baca 409 ako termin nije NA_CEKANJU", async () => {
    prismaMock.listaCekanja.findFirst.mockResolvedValue({
      id: 1, idPacijent: 1, status: "OBAVIJESTEN", zeleniDatum: new Date()
    });
    redisMock.get.mockResolvedValue("5");
    prismaMock.termin.findUnique.mockResolvedValue({ id: 5, status: "ZAKAZAN", idDoktor: 1 });

    await expect(
      potvrdiWaitlistTermin(1, 1)
    ).rejects.toMatchObject({ status: 409 });
  });
});

// ─── odbijWaitlistTermin ───────────────────────────────────

describe("odbijWaitlistTermin", () => {
  it("baca 404 ako zapis nije pronađen", async () => {
    prismaMock.listaCekanja.findFirst.mockResolvedValue(null);

    await expect(
      odbijWaitlistTermin(1, 1)
    ).rejects.toMatchObject({ status: 404 });
  });

  it("mijenja status u ODBIJENO i briše Redis offer", async () => {
    prismaMock.listaCekanja.findFirst.mockResolvedValue({ id: 1, idPacijent: 1 });
    redisMock.get.mockResolvedValue(null);
    prismaMock.listaCekanja.update.mockResolvedValue({});

    await odbijWaitlistTermin(1, 1);

    expect(prismaMock.listaCekanja.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: "ODBIJENO" },
    });
    expect(redisMock.del).toHaveBeenCalledWith("waitlist:offer:1");
  });
});

// ─── otkaziCekanje ─────────────────────────────────────────

describe("otkaziCekanje", () => {
  it("baca 404 ako zapis nije aktivan", async () => {
    prismaMock.listaCekanja.findFirst.mockResolvedValue(null);

    await expect(
      otkaziCekanje(1, 1)
    ).rejects.toMatchObject({ status: 404 });
  });

  it("mijenja status u OTKAZANO", async () => {
    prismaMock.listaCekanja.findFirst.mockResolvedValue({
      id: 1, idPacijent: 1, status: "CEKA", idDoktor: 1, zeleniDatum: new Date()
    });
    prismaMock.listaCekanja.update.mockResolvedValue({});

    await otkaziCekanje(1, 1);

    expect(prismaMock.listaCekanja.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: "OTKAZANO" },
    });
  });

  it("oslobađa termin ako je bio OBAVIJESTEN i nema drugih u redu", async () => {
    prismaMock.listaCekanja.findFirst.mockResolvedValue({
      id: 1, idPacijent: 1, status: "OBAVIJESTEN", idDoktor: 1, zeleniDatum: new Date()
    });
    prismaMock.listaCekanja.update.mockResolvedValue({});
    redisMock.get.mockResolvedValue("5");
    redisMock.del.mockResolvedValue(1);
    prismaMock.listaCekanja.count.mockResolvedValue(0);
    prismaMock.termin.update.mockResolvedValue({});

    await otkaziCekanje(1, 1);

    expect(prismaMock.termin.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { status: "SLOBODAN", pacijent: { disconnect: true } },
    });
  });
});