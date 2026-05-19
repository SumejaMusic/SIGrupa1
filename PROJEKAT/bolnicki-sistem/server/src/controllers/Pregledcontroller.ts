import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { dekriptuj } from "../lib/encryption.js";

function safeDecrypt(vrijednost: string): string {
  try {
    return dekriptuj(vrijednost);
  } catch {
    return vrijednost;
  }
}

function dekriptujRecept(r: any) {
  return {
    ...r,
    nazivLijeka: safeDecrypt(r.nazivLijeka),
    doza: safeDecrypt(r.doza),
    napomena: r.napomena ? safeDecrypt(r.napomena) : r.napomena,
  };
}

// POST /api/pregledi/:rezervacijaId/zavrsi
export const zavrsiPregled = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rezervacijaId = Number(req.params.rezervacijaId);
    const { dijagnoza, terapija, biljeske, recept } = req.body;

    if (!dijagnoza?.trim() || !terapija?.trim()) {
      res.status(400).json({ poruka: "Dijagnoza i terapija su obavezni." });
      return;
    }

    if (recept !== undefined && recept !== null) {
      if (!recept.nazivLijeka?.trim() || !recept.doza?.trim() || !recept.trajanje) {
        res.status(400).json({ poruka: "Recept mora sadržavati naziv lijeka, dozu i trajanje." });
        return;
      }
      if (Number(recept.trajanje) <= 0) {
        res.status(400).json({ poruka: "Trajanje recepta mora biti pozitivan broj." });
        return;
      }
    }

    const rezervacija = await prisma.rezervacije.findUnique({
      where: { id: rezervacijaId },
      include: { historija: true, termin: true },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    const korisnikPayload = (req as any).korisnik;
    if (!korisnikPayload) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    if (korisnikPayload.doktorId && korisnikPayload.doktorId !== rezervacija.idDoktor) {
      res.status(403).json({ poruka: "Nemate pravo završiti ovaj pregled." });
      return;
    }

    if (rezervacija.zavrseno) {
      res.status(409).json({ poruka: "Ovaj pregled je već završen." });
      return;
    }

    const rezultat = await prisma.$transaction(async (tx) => {
      let historija;

      if (rezervacija.historija) {
        historija = await tx.historijaPregleda.update({
          where: { idRezervacija: rezervacijaId },
          data: {
            dijagnoza: dijagnoza.trim(),
            terapija: terapija.trim(),
            biljeske: biljeske?.trim() ?? null,
          },
        });
      } else {
        historija = await tx.historijaPregleda.create({
          data: {
            idPacijent: rezervacija.idPacijent,
            idDoktor: rezervacija.idDoktor,
            idRezervacija: rezervacijaId,
            dijagnoza: dijagnoza.trim(),
            terapija: terapija.trim(),
            biljeske: biljeske?.trim() ?? null,
            datumPregleda: rezervacija.termin.datum,
          },
        });
      }

      let noviRecept = null;
      if (recept?.nazivLijeka && recept?.doza && recept?.trajanje) {
        noviRecept = await tx.recept.create({
          data: {
            idHistorijaPregleda: historija.id,
            idDoktor: rezervacija.idDoktor,
            nazivLijeka: recept.nazivLijeka.trim(),
            doza: recept.doza.trim(),
            trajanje: Number(recept.trajanje),
            napomena: recept.napomena?.trim() ?? null,
          },
        });
      }

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
export const getPregled = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rezervacijaId = Number(req.params.rezervacijaId);

    // Provjera da je rezervacijaId validan broj
    if (!Number.isInteger(rezervacijaId) || rezervacijaId <= 0) {
      res.status(400).json({ poruka: "Nevažeći ID rezervacije." });
      return;
    }

    const historija = await prisma.historijaPregleda.findUnique({
      where: { idRezervacija: rezervacijaId },
      include: {
        recepti: true,
        nalaz: {
          select: { id: true, naziv: true, vrijemeNalaza: true, opis: true },
        },
      },
    });

    if (!historija) {
      res.json(null);
      return;
    }

    res.json({
      ...historija,
      recepti: historija.recepti.map(dekriptujRecept),
    });
  } catch (err) {
    next(err);
  }
};