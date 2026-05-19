import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

// POST /api/pregledi/:rezervacijaId/zavrsi
// Kreira ili ažurira HistorijaPregleda, opcionalno dodaje Recept
export const zavrsiPregled = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rezervacijaId = Number(req.params.rezervacijaId);
    const { dijagnoza, terapija, biljeske, recept } = req.body;

    if (!dijagnoza || !terapija) {
      res.status(400).json({ poruka: "Dijagnoza i terapija su obavezni." });
      return;
    }

    const rezervacija = await prisma.rezervacije.findUnique({
      where: { id: rezervacijaId },
      include: { historija: true },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    const rezultat = await prisma.$transaction(async (tx) => {
      let historija;

      if (rezervacija.historija) {
        // Ažuriraj postojeću historiju
        historija = await tx.historijaPregleda.update({
          where: { idRezervacija: rezervacijaId },
          data: {
            dijagnoza,
            terapija,
            biljeske: biljeske ?? null,
          },
        });
      } else {
        // Kreiraj novu historiju
        historija = await tx.historijaPregleda.create({
          data: {
            idPacijent: rezervacija.idPacijent,
            idDoktor: rezervacija.idDoktor,
            idRezervacija: rezervacijaId,
            dijagnoza,
            terapija,
            biljeske: biljeske ?? null,
          },
        });
      }

      // Dodaj recept ako je proslijeđen
      let noviRecept = null;
      if (recept?.nazivLijeka && recept?.doza && recept?.trajanje) {
        noviRecept = await tx.recept.create({
          data: {
            idHistorijaPregleda: historija.id,
            idDoktor: rezervacija.idDoktor,
            nazivLijeka: recept.nazivLijeka,
            doza: recept.doza,
            trajanje: Number(recept.trajanje),
            napomena: recept.napomena ?? null,
          },
        });
      }

      // Označi rezervaciju kao završenu
      await tx.rezervacije.update({
        where: { id: rezervacijaId },
        data: { zavrseno: true },
      });

      return { historija, recept: noviRecept };
    });

    res.status(200).json({
      poruka: "Pregled uspješno završen.",
      ...rezultat,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/pregledi/:rezervacijaId
// Dohvata historiju pregleda za rezervaciju (za prikaz u side panelu)
export const getPregled = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rezervacijaId = Number(req.params.rezervacijaId);

    const historija = await prisma.historijaPregleda.findUnique({
      where: { idRezervacija: rezervacijaId },
      include: {
        recepti: true,
        nalaz: {
          select: { id: true, naziv: true, vrijemeNalaza: true, opis: true },
        },
      },
    });

    res.json(historija ?? null);
  } catch (err) {
    next(err);
  }
};