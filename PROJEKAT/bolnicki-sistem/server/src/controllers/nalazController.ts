import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

// GET /api/nalazi/pacijent/:pacijentId
export const getNalaziZaPacijenta = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    if (!korisnikPayload) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    // samo doktor, osoblje, admin ili sam pacijent mogu vidjeti nalaze
    const dozvoljeneUloge = ["DOKTOR", "ADMINISTRATOR", "MEDICINSKO_OSOBLJE", "VLASNIK"];
    if (!dozvoljeneUloge.includes(korisnikPayload.uloga)) {
      // ako je pacijent moze vidjet samo svoje nalaze
      const pacijent = await prisma.pacijent.findFirst({
        where: { idKorisnik: korisnikPayload.id },
      });
      if (!pacijent || pacijent.id !== Number(req.params.pacijentId)) {
        res.status(403).json({ poruka: "Nemate dozvolu za pregled ovih nalaza." });
        return;
      }
    }

    const nalazi = await prisma.nalaz.findMany({
      where: {
        pregledi: {
          some: {
            idPacijent: Number(req.params.pacijentId),
          },
        },
      },
      select: {
        id: true,
        naziv: true,
        vrijemeNalaza: true,
        opis: true,
      },
      orderBy: { vrijemeNalaza: "desc" },
    });

    res.json(nalazi);
  } catch (err) {
    next(err);
  }
};

// GET /api/nalazi/:id/pdf
export const getNalazPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    if (!korisnikPayload) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    const nalaz = await prisma.nalaz.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        pregledi: {
          select: {
            idPacijent: true,
            idDoktor: true,
          },
        },
      },
    });

    if (!nalaz) {
      res.status(404).json({ poruka: "Nalaz nije pronađen." });
      return;
    }

    const dozvoljeneUloge = ["DOKTOR", "ADMINISTRATOR", "MEDICINSKO_OSOBLJE", "VLASNIK"];
    if (!dozvoljeneUloge.includes(korisnikPayload.uloga)) {
      const pacijent = await prisma.pacijent.findFirst({
        where: { idKorisnik: korisnikPayload.id },
      });
      const jeVlasnik = nalaz.pregledi.some(p => p.idPacijent === pacijent?.id);
      if (!pacijent || !jeVlasnik) {
        res.status(403).json({ poruka: "Nemate dozvolu za pregled ovog nalaza." });
        return;
      }
    }

    if (!nalaz.dokumentPDF) {
      res.status(404).json({ poruka: "PDF nije priložen uz ovaj nalaz." });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${nalaz.naziv}"`);
    res.send(nalaz.dokumentPDF);
  } catch (err) {
    next(err);
  }
};

// GET /api/nalazi/rezervacija/:rezervacijaId
export const getNalaziZaRezervaciju = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    if (!korisnikPayload) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    const historija = await prisma.historijaPregleda.findUnique({
      where: { idRezervacija: Number(req.params.rezervacijaId) },
      include: {
        nalaz: {
          select: { id: true, naziv: true, vrijemeNalaza: true, opis: true },
        },
      },
    });

    if (!historija || !historija.nalaz) {
      res.json([]);
      return;
    }

    // pacijent moze vidjeti samo svoju historiju
    const dozvoljeneUloge = ["DOKTOR", "ADMINISTRATOR", "MEDICINSKO_OSOBLJE", "VLASNIK"];
    if (!dozvoljeneUloge.includes(korisnikPayload.uloga)) {
      const pacijent = await prisma.pacijent.findFirst({
        where: { idKorisnik: korisnikPayload.id },
      });
      if (!pacijent || historija.idPacijent !== pacijent.id) {
        res.status(403).json({ poruka: "Nemate dozvolu za pregled ovih nalaza." });
        return;
      }
    }

    res.json([historija.nalaz]);
  } catch (err) {
    next(err);
  }
};