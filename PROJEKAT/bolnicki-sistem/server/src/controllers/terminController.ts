import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";

const BUFFER_TTL_SECONDS = 120; // NFR-22: 2 minute lock

// ─────────────────────────────────────────────
// GET /api/termini?doktorId=&datum=
// US-05 — Slobodni termini filtrirани po doktoru i datumu
// ─────────────────────────────────────────────
export const getSlobodniTermini = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { doktorId, datum } = req.query;

    const termini = await prisma.termin.findMany({
      where: {
        idDoktor: doktorId ? Number(doktorId) : undefined,
        datum: datum ? new Date(datum as string) : undefined,
        status: "SLOBODAN", // samo slobodni termini
      },
      include: {
        doktor: {
          include: { korisnik: true },
        },
      },
      orderBy: { datum: "asc" },
    });

    // Filtriraj termine koji su trenutno zaključani u Redisu (buffer zona)
    const slobodni = await Promise.all(
      termini.map(async (t) => {
        const lock = await redis.get(`termin:lock:${t.id}`);
        return lock ? null : t;
      })
    );

    res.json(slobodni.filter(Boolean));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/termini/:id
// ─────────────────────────────────────────────
//kasnije ce nam biti koristan
export const getTerminById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const termin = await prisma.termin.findUnique({
      where: { id: Number(req.params.id) },
      include: { doktor: true },
    });

    if (!termin) {
      res.status(404).json({ poruka: "Termin nije pronađen." });
      return;
    }

    res.json(termin);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/termini/:id/zakljucaj
// US-12, NFR-22 — Buffer zona, Redis lock na 2 minute
// ─────────────────────────────────────────────
export const zaključajTermin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const terminId = Number(req.params.id);
    const korisnikId = (req as any).korisnik.id;
    const lockKey = `termin:lock:${terminId}`;

    // Provjeri da li je već zaključan od nekog drugog
    const postojećiLock = await redis.get(lockKey);
    if (postojećiLock && postojećiLock !== String(korisnikId)) {
      res.status(409).json({ poruka: "Termin je trenutno zauzet. Pokušajte ponovo." });
      return;
    }

    // Postavi lock sa TTL od 120 sekundi
    await redis.setex(lockKey, BUFFER_TTL_SECONDS, String(korisnikId));

    res.json({ poruka: "Termin uspješno zaključan.", ttl: BUFFER_TTL_SECONDS });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/termini/:id/oslobodi
// US-12 — Ručno oslobađanje (pacijent odustao)
// ─────────────────────────────────────────────
export const oslobodiTermin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const terminId = Number(req.params.id);
    const lockKey = `termin:lock:${terminId}`;

    await redis.del(lockKey);

    res.json({ poruka: "Termin oslobođen." });
  } catch (err) {
    next(err);
  }
};