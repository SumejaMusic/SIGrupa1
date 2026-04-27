import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

// ─────────────────────────────────────────────
// GET /api/doktori?specijalizacija=&odjelId=
// US-05 — Pregled dostupnih doktora
// dodajte ako je potreban i parametar idSobe
export const getSviDoktori = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { specijalizacija, odjelId } = req.query;

    const doktori = await prisma.doktor.findMany({
      where: {
        specijalizacija: specijalizacija
          ? { contains: specijalizacija as string, mode: "insensitive" }
          : undefined,
        idOdjela: odjelId ? Number(odjelId) : undefined,
      },
      include: {
        korisnik: {
          select: { ime: true, prezime: true, email: true, brojTelefona: true },
        },
        odjel: true,
      },
    });

    res.json(doktori);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/doktori/:id
// US-05 — Detalji doktora
// ─────────────────────────────────────────────
export const getDoktorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const doktor = await prisma.doktor.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        korisnik: {
          select: { ime: true, prezime: true, email: true },
        },
        odjel: true,  
        soba: true, //provjeriti da li je ovo uopste potrebno u ovoj ruti za pretragu doktora po id
      },
    });

    if (!doktor) {
      res.status(404).json({ poruka: "Doktor nije pronađen." });
      return;
    }

    res.json(doktor);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/doktori/:id/raspored
// US-05, US-06 — Raspored doktora po danima
// Pravilo 5.11: samo aktivni rasporedi
// ─────────────────────────────────────────────
export const getRasporedDoktora = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const raspored = await prisma.rasporedDoktora.findMany({
      where: {
        idDoktor: Number(req.params.id),
        aktivan: true, // Pravilo 5.11 — neaktivni rasporedi se ne prikazuju
        //ispitati bitnost ovog atributa za ovaj entitet
    },
      orderBy: { danUSedmici: "asc" },
    });

    res.json(raspored);
  } catch (err) {
    next(err);
  }
};