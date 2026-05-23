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
  datum: overrides.datum ?? new Date("2026-05-23T00:00:00.000Z"),
  vrijeme: overrides.vrijeme ?? 660,
  status: "SLOBODAN",
  doktor: overrides.doktor ?? doctor,
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
      expect.objectContaining({ id: 30, datum: "2026-05-23", datumTekst: "23.05.2026.", vrijemeTekst: "10:10" }),
      expect.objectContaining({ id: 31, datum: "2026-05-23", datumTekst: "23.05.2026.", vrijemeTekst: "10:50" }),
    ]);
  });

  it("nudi naredne slobodne termine kada slobodan kabinet nema termin danas", async () => {
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([] as any);
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue([
      freeTerm({ id: 42, datum: new Date("2026-05-24T00:00:00.000Z"), vrijeme: 540 }),
    ] as any);

    const result = await getZauzetostSobaService("today", new Date(2026, 4, 23, 16, 30));

    expect(result.rooms[0]).toMatchObject({
      status: "SLOBODAN",
      availableTerms: [
        expect.objectContaining({
          id: 42,
          datum: "2026-05-24",
          datumTekst: "24.05.2026.",
          vrijemeTekst: "09:00",
        }),
      ],
      canAssignEmergency: true,
    });
  });

  it("prihvata konkretan datum u YYYY-MM-DD formatu i ne označava prošli dan kao uskoro zauzet", async () => {
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([
      reservation({ vrijeme: 620 }),
    ] as any);

    const result = await getZauzetostSobaService("2026-05-22", new Date(2026, 4, 23, 10, 0));

    expect(result.date).toBe("2026-05-22");
    expect(result.rooms[0]).toMatchObject({
      status: "SLOBODAN",
      currentAppointment: null,
      nextAppointment: null,
      canAssignEmergency: false,
    });
  });

  it("za budući dan vraća prvi sljedeći termin, ali status ostaje slobodan jer nije tekući dan", async () => {
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([
      reservation({ vrijeme: 540 }),
    ] as any);
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue([
      freeTerm({ id: 41, vrijeme: 600 }),
    ] as any);

    const result = await getZauzetostSobaService("2026-05-24", new Date(2026, 4, 23, 10, 0));

    expect(result.rooms[0]).toMatchObject({
      status: "SLOBODAN",
      currentAppointment: null,
      nextAppointment: {
        vrijemeTekst: "09:00",
      },
      availableTerms: [
        expect.objectContaining({ id: 41, vrijemeTekst: "10:00" }),
      ],
      canAssignEmergency: true,
    });
  });

  it("koristi sobu direktno sa rezervacije i fallback trajanje doktora kada tip pregleda nije dodijeljen", async () => {
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([
      {
        ...reservation({
        idSobe: 1,
        vrijeme: 600,
        }),
        tipPregleda: null,
      },
    ] as any);

    const result = await getZauzetostSobaService("today", new Date(2026, 4, 23, 10, 10));

    expect(result.rooms[0].currentAppointment).toMatchObject({
      tipPregleda: null,
      krajVrijemeTekst: "10:30",
    });
  });

  it("preskače rezervacije i slobodne termine koji se ne mogu povezati, ali slobodan kabinet ostaje dostupan za formu", async () => {
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([
      {
        ...reservation({ vrijeme: 600 }),
        idSobe: null,
        soba: null,
        doktor: {
          ...doctor,
          idSobe: null,
          soba: null,
        },
      },
    ] as any);
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue([
      freeTerm({
        id: 50,
        doktor: {
          ...doctor,
          idSobe: null,
          soba: null,
        },
      }),
    ] as any);

    const result = await getZauzetostSobaService("today", new Date(2026, 4, 23, 10, 10));

    expect(result.rooms[0]).toMatchObject({
      status: "SLOBODAN",
      currentAppointment: null,
      nextAppointment: null,
      availableTerms: [],
      canAssignEmergency: true,
    });
  });

  it("vraća null za aktivnog doktora kada kabinet nema doktora, termina ni rezervacija", async () => {
    vi.mocked(prismaMock.soba.findMany).mockResolvedValue([
      { ...room, doktori: [] },
    ] as any);
    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([] as any);

    const result = await getZauzetostSobaService("today", new Date(2026, 4, 23, 10, 0));

    expect(result.rooms[0]).toMatchObject({
      activeDoctor: null,
      canAssignEmergency: false,
    });
  });

  it("pokriva fallback vrijednosti za doktora, pacijenta, trajanje pregleda i prošle slobodne termine", async () => {
    const doktorBezDetalja = {
      id: 7,
      idSobe: 1,
    };

    vi.mocked(prismaMock.rezervacije.findMany).mockResolvedValue([
      {
        ...reservation({ vrijeme: 600 }),
        tipPregleda: null,
        pacijent: null,
        doktor: doktorBezDetalja,
      },
    ] as any);
    vi.mocked(prismaMock.termin.findMany).mockResolvedValue([
      freeTerm({ id: 70, vrijeme: 590 }),
      freeTerm({
        id: 71,
        vrijeme: 650,
        doktor: {
          ...doctor,
          idSobe: null,
          soba: { id: 1, naziv: "Ordinacija 1" },
        },
      }),
    ] as any);

    const result = await getZauzetostSobaService("today", new Date(2026, 4, 23, 10, 10));

    expect(result.rooms[0].currentAppointment).toMatchObject({
      doktor: {
        id: 7,
        ime: "",
        prezime: "",
        specijalizacija: "",
        odjel: null,
      },
      pacijent: null,
      tipPregleda: null,
      krajVrijemeTekst: "10:30",
    });
    expect(result.rooms[0].availableTerms).toEqual([
      expect.objectContaining({ id: 71, vrijemeTekst: "10:50" }),
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

  it("odbija datum koji ne postoji u kalendaru", async () => {
    await expect(getZauzetostSobaService("2026-02-30", new Date(2026, 4, 23, 10, 0)))
      .rejects
      .toMatchObject({
        status: 400,
        poruka: "Uneseni datum ne postoji u kalendaru.",
      });
  });
});
