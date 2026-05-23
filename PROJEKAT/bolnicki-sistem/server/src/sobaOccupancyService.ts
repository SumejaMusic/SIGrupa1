import { StatusSobe, StatusTermina, TipSobe } from "@prisma/client";
import { prisma } from "./lib/prisma.js";

const SOON_THRESHOLD_MINUTES = 30;

export type StatusZauzetostiSobe = "SLOBODAN" | "ZAUZET" | "USKORO_ZAUZET";

type SazetakDoktora = {
  id: number;
  ime: string;
  prezime: string;
  specijalizacija: string;
  odjel: {
    id: number;
    naziv: string;
  } | null;
};

type SazetakTermina = {
  id: number;
  terminId: number;
  doktor: SazetakDoktora;
  pacijent: {
    ime: string;
    prezime: string;
  } | null;
  tipPregleda: string | null;
  hitnost: boolean;
  vrijeme: number;
  vrijemeTekst: string;
  krajVrijeme: number;
  krajVrijemeTekst: string;
};

type SazetakSlobodnogTermina = {
  id: number;
  doktorId: number;
  doktor: SazetakDoktora;
  datum: string;
  datumTekst: string;
  vrijeme: number;
  vrijemeTekst: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${pad(hours)}:${pad(mins)}`;
};

const localDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const validateDateParam = (dateParam: string | undefined, now: Date): string => {
  if (!dateParam || dateParam === "today") {
    return localDateKey(now);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    throw {
      status: 400,
      poruka: "Neispravan format datuma. Koristite YYYY-MM-DD ili today.",
    };
  }

  const parsed = new Date(`${dateParam}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().substring(0, 10) !== dateParam) {
    throw {
      status: 400,
      poruka: "Uneseni datum ne postoji u kalendaru.",
    };
  }

  return dateParam;
};

const createDayRange = (dateKey: string) => ({
  start: new Date(`${dateKey}T00:00:00.000Z`),
  end: new Date(`${dateKey}T23:59:59.999Z`),
});

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const isoDateKey = (date: Date): string => date.toISOString().substring(0, 10);

const formatDateText = (date: Date): string => {
  const dateKey = isoDateKey(date);
  const [year, month, day] = dateKey.split("-");
  return `${day}.${month}.${year}.`;
};

const summarizeDoctor = (doktor: any): SazetakDoktora => ({
  id: doktor.id,
  ime: doktor.korisnik?.ime ?? "",
  prezime: doktor.korisnik?.prezime ?? "",
  specijalizacija: doktor.specijalizacija ?? "",
  odjel: doktor.odjel
    ? {
        id: doktor.odjel.id,
        naziv: doktor.odjel.naziv,
      }
    : null,
});

const getReservationRoomId = (rezervacija: any): number | null => {
  return rezervacija.idSobe ?? rezervacija.soba?.id ?? rezervacija.doktor?.idSobe ?? rezervacija.doktor?.soba?.id ?? null;
};

const getTermRoomId = (termin: any): number | null => {
  return termin.doktor?.idSobe ?? termin.doktor?.soba?.id ?? null;
};

const summarizeAppointment = (rezervacija: any): SazetakTermina => {
  const duration =
    rezervacija.tipPregleda?.trajanjeMinuta ??
    rezervacija.doktor?.trajanjePregleda ??
    30;
  const start = rezervacija.termin.vrijeme;
  const end = start + duration;

  return {
    id: rezervacija.id,
    terminId: rezervacija.termin.id,
    doktor: summarizeDoctor(rezervacija.doktor),
    pacijent: rezervacija.pacijent?.korisnik
      ? {
          ime: rezervacija.pacijent.korisnik.ime,
          prezime: rezervacija.pacijent.korisnik.prezime,
        }
      : null,
    tipPregleda: rezervacija.tipPregleda?.naziv ?? null,
    hitnost: Boolean(rezervacija.hitnost),
    vrijeme: start,
    vrijemeTekst: minutesToTime(start),
    krajVrijeme: end,
    krajVrijemeTekst: minutesToTime(end),
  };
};

const summarizeAvailableTerm = (termin: any): SazetakSlobodnogTermina => ({
  id: termin.id,
  doktorId: termin.idDoktor,
  doktor: summarizeDoctor(termin.doktor),
  datum: isoDateKey(termin.datum),
  datumTekst: formatDateText(termin.datum),
  vrijeme: termin.vrijeme,
  vrijemeTekst: minutesToTime(termin.vrijeme),
});

export function odrediStatusZauzetostiSobe(
  currentAppointment: SazetakTermina | null,
  nextAppointment: SazetakTermina | null,
  referenceMinute: number,
  isToday: boolean,
): StatusZauzetostiSobe {
  if (currentAppointment) return "ZAUZET";

  const startsSoon =
    isToday &&
    nextAppointment !== null &&
    nextAppointment.vrijeme >= referenceMinute &&
    nextAppointment.vrijeme - referenceMinute <= SOON_THRESHOLD_MINUTES;

  return startsSoon ? "USKORO_ZAUZET" : "SLOBODAN";
}

export async function getZauzetostSobaService(dateParam?: string, now = new Date()) {
  const date = validateDateParam(dateParam, now);
  const today = localDateKey(now);
  const isToday = date === today;
  const referenceMinute = isToday
    ? now.getHours() * 60 + now.getMinutes()
    : date > today
      ? -1
      : 24 * 60;
  const { start, end } = createDayRange(date);
  const includeUpcomingFreeTerms = date >= today;
  const freeTermsEnd = includeUpcomingFreeTerms ? addDays(end, 7) : end;

  const [rooms, reservations, freeTerms] = await Promise.all([
    prisma.soba.findMany({
      where: {
        statusSobe: StatusSobe.AKTIVNA,
        tip: { in: [TipSobe.KABINET, TipSobe.ORDINACIJA] },
      },
      include: {
        doktori: {
          include: {
            korisnik: { select: { id: true, ime: true, prezime: true } },
            odjel: true,
          },
          orderBy: { id: "asc" },
        },
      },
      orderBy: [{ sprat: "asc" }, { naziv: "asc" }],
    }),
    prisma.rezervacije.findMany({
      where: {
        datumOtkazivanja: null,
        zavrseno: false,
        termin: {
          datum: { gte: start, lte: end },
        },
      },
      include: {
        termin: true,
        tipPregleda: true,
        soba: true,
        pacijent: {
          include: {
            korisnik: { select: { ime: true, prezime: true } },
          },
        },
        doktor: {
          include: {
            korisnik: { select: { id: true, ime: true, prezime: true } },
            odjel: true,
            soba: true,
          },
        },
      },
      orderBy: [{ termin: { vrijeme: "asc" } }],
    }),
    prisma.termin.findMany({
      where: {
        status: StatusTermina.SLOBODAN,
        datum: { gte: start, lte: freeTermsEnd },
      },
      include: {
        doktor: {
          include: {
            korisnik: { select: { id: true, ime: true, prezime: true } },
            odjel: true,
            soba: true,
          },
        },
      },
      orderBy: [{ vrijeme: "asc" }],
    }),
  ]);

  const appointmentsByRoom = new Map<number, SazetakTermina[]>();
  for (const reservation of reservations) {
    const roomId = getReservationRoomId(reservation);
    if (!roomId) continue;

    const appointment = summarizeAppointment(reservation);
    const current = appointmentsByRoom.get(roomId) ?? [];
    current.push(appointment);
    appointmentsByRoom.set(roomId, current);
  }

  const freeTermsByRoom = new Map<number, SazetakSlobodnogTermina[]>();
  for (const term of freeTerms) {
    const roomId = getTermRoomId(term);
    if (!roomId) continue;
    if (isToday && isoDateKey(term.datum) === today && term.vrijeme <= referenceMinute) continue;

    const current = freeTermsByRoom.get(roomId) ?? [];
    current.push(summarizeAvailableTerm(term));
    freeTermsByRoom.set(roomId, current);
  }

  return {
    date,
    generatedAt: now.toISOString(),
    refreshIntervalSeconds: 60,
    rooms: rooms.map((room) => {
      const roomAppointments = (appointmentsByRoom.get(room.id) ?? []).sort((a, b) => a.vrijeme - b.vrijeme);
      const availableTerms = (freeTermsByRoom.get(room.id) ?? [])
        .sort((a, b) => a.datum.localeCompare(b.datum) || a.vrijeme - b.vrijeme);
      const currentAppointment = isToday
        ? roomAppointments.find((appointment) => (
            appointment.vrijeme <= referenceMinute &&
            referenceMinute < appointment.krajVrijeme
          )) ?? null
        : null;
      const nextAppointment = roomAppointments.find((appointment) => appointment.vrijeme > referenceMinute) ?? null;
      const status = odrediStatusZauzetostiSobe(currentAppointment, nextAppointment, referenceMinute, isToday);
      const activeDoctor =
        currentAppointment?.doktor ??
        nextAppointment?.doktor ??
        availableTerms[0]?.doktor ??
        (room.doktori[0] ? summarizeDoctor(room.doktori[0]) : null);

      return {
        id: room.id,
        naziv: room.naziv,
        tip: room.tip,
        sprat: room.sprat,
        status,
        activeDoctor,
        currentAppointment,
        nextAppointment,
        availableTerms: availableTerms.slice(0, 8),
        canAssignEmergency: status === "SLOBODAN" && (availableTerms.length > 0 || (isToday && activeDoctor !== null)),
      };
    }),
  };
}
