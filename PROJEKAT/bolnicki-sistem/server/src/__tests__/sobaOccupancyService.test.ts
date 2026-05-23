import { describe, expect, it, vi, beforeEach } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import { getZauzetostSobaService } from "../sobaOccupancyService.js";

vi.mock("../lib/prisma.js");

const doctor = {
  id: 1,
  idSobe: 1,
  specijalizacija: "Kardiologija",
  trajanjePregleda: 30,
  korisnik: { id: 10, ime: "Nedim", prezime: "Beganovic" },
  odjel: { id: 3, naziv: "Kardiologija" },
  soba: { id: 1, naziv: "Ordinacija 1" },
};

const room = {
  id: 1,
  naziv: "Ordinacija 1",
  tip: "ORDINACIJA",
  sprat: 1,
  statusSobe: "AKTIVNA",
  doktori: [doctor],
};

const reservation = (overrides: any = {}) => ({
  id: overrides.id ?? 100,
  idSobe: null,
  hitnost: overrides.hitnost ?? false,
  datumOtkazivanja: null,
  zavrseno: false,
  termin: {
    id: overrides.terminId ?? 20,
    datum: new Date("2026-05-23T00:00:00.000Z"),
    vrijeme: overrides.vrijeme ?? 600,
    status: "ZAKAZAN",
    opis: null,
  },
  tipPregleda: overrides.tipPregleda ?? {
    id: 1,
    naziv: "Kontrolni pregled",
    trajanjeMinuta: overrides.trajanjeMinuta ?? 30,
  },
  soba: null,
  pacijent: {
    korisnik: { ime: overrides.pacijentIme ?? "Ana", prezime: overrides.pacijentPrezime ?? "Anic" },
  },
  doktor: doctor,
});

const freeTerm = (overrides: any = {}) => ({
  id: overrides.id ?? 30,
  idDoktor: doctor.id,
  datum: new Date("2026-05-23T00:00:00.000Z"),
  vrijeme: overrides.vrijeme ?? 660,
  status: "SLOBODAN",
  doktor: doctor,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prismaMock.soba.findMany).mockResolvedValue([room] as any);
  vi.mocked(prismaMock.termin.findMany).mockResolvedValue([] as any);
});

describe("getZauzetostSobaService", () => {
  it("označava kabinet kao zauzet kada je termin trenutno u toku", async () => {
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([
      reservation({ vrijeme: 600, trajanjeMinuta: 30 }),
      reservation({ id: 101, terminId: 21, vrijeme: 660 }),
    ] as any);

    const result = await getZauzetostSobaService("today", new Date(2026, 4, 23, 10, 10));

    expect(result.rooms[0]).toMatchObject({
      status: "ZAUZET",
      currentAppointment: {
        vrijeme: 600,
        vrijemeTekst: "10:00",
        krajVrijemeTekst: "10:30",
      },
      nextAppointment: {
        vrijeme: 660,
        vrijemeTekst: "11:00",
      },
      canAssignEmergency: false,
    });
  });

  it("označava kabinet kao uskoro zauzet kada sljedeći termin počinje unutar 30 minuta", async () => {
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([
      reservation({ vrijeme: 620 }),
    ] as any);

    const result = await getZauzetostSobaService("today", new Date(2026, 4, 23, 10, 0));

    expect(result.rooms[0]).toMatchObject({
      status: "USKORO_ZAUZET",
      currentAppointment: null,
      nextAppointment: {
        vrijeme: 620,
        vrijemeTekst: "10:20",
      },
      canAssignEmergency: false,
    });
  });

  it("označava kabinet kao slobodan i nudi slobodne termine za hitnu dodjelu", async () => {
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([
      reservation({ vrijeme: 700 }),
    ] as any);
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue([
      freeTerm({ id: 30, vrijeme: 610 }),
      freeTerm({ id: 31, vrijeme: 650 }),
    ] as any);

    const result = await getZauzetostSobaService("today", new Date(2026, 4, 23, 10, 0));

    expect(result.rooms[0]).toMatchObject({
      status: "SLOBODAN",
      currentAppointment: null,
      nextAppointment: {
        vrijeme: 700,
        vrijemeTekst: "11:40",
      },
      canAssignEmergency: true,
    });
    expect(result.rooms[0].availableTerms).toEqual([
      expect.objectContaining({ id: 30, vrijemeTekst: "10:10" }),
      expect.objectContaining({ id: 31, vrijemeTekst: "10:50" }),
    ]);
  });

  it("odbija neispravan date query parametar", async () => {
    await expect(getZauzetostSobaService("23-05-2026", new Date(2026, 4, 23, 10, 0)))
      .rejects
      .toMatchObject({
        status: 400,
        poruka: "Neispravan format datuma. Koristite YYYY-MM-DD ili today.",
      });
  });
});
