import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { dekriptuj } from "../lib/encryption.js";
import { posaljiPozivZaOcjenu } from "../emailService.js";

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

    if (!dijagnoza || !terapija) {
      res.status(400).json({ poruka: "Dijagnoza i terapija su obavezni." });
      return;
    }

    const rezervacija = await prisma.rezervacije.findUnique({
      where: { id: rezervacijaId },
      include: {
        historija: true,
        termin: true,
        pacijent: { include: { korisnik: true } },
        doktor: { include: { korisnik: true } },
      },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    const korisnikPayload = (req as any).korisnik;
    if (rezervacija.idDoktor !== korisnikPayload.doktorId) {
      res.status(403).json({ poruka: "Nemate dozvolu za završavanje ovog pregleda." });
      return;
    }

    if (rezervacija.zavrseno) {
      res.status(400).json({ poruka: "Pregled je već završen." });
      return;
    }

    if (rezervacija.datumOtkazivanja) {
      res.status(400).json({ poruka: "Nije moguće završiti otkazanu rezervaciju." });
      return;
    }

    const rezultat = await prisma.$transaction(async (tx) => {
      let historija;

      if (rezervacija.historija) {
        historija = await tx.historijaPregleda.update({
          where: { idRezervacija: rezervacijaId },
          data: {
            dijagnoza,
            terapija,
            biljeske: biljeske ?? null,
          },
        });
      } else {
        historija = await tx.historijaPregleda.create({
          data: {
            idPacijent: rezervacija.idPacijent,
            idDoktor: rezervacija.idDoktor,
            idRezervacija: rezervacijaId,
            dijagnoza,
            terapija,
            biljeske: biljeske ?? null,
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
            nazivLijeka: recept.nazivLijeka,
            doza: recept.doza,
            trajanje: Number(recept.trajanje),
            napomena: recept.napomena ?? null,
          },
        });
      }

      await tx.rezervacije.update({
        where: { id: rezervacijaId },
        data: { zavrseno: true },
      });

      return { historija, recept: noviRecept };
    });

    try {
      await posaljiPozivZaOcjenu({
        pacijentEmail: rezervacija.pacijent.korisnik.email,
        pacijentIme: rezervacija.pacijent.korisnik.ime,
        pacijentPrezime: rezervacija.pacijent.korisnik.prezime,
        doktorIme: rezervacija.doktor.korisnik.ime,
        doktorPrezime: rezervacija.doktor.korisnik.prezime,
        datum: rezervacija.termin.datum,
        vrijeme: rezervacija.termin.vrijeme,
        rezervacijaId,
      });
    } catch (emailErr) {
      console.error("Email poziva za ocjenu NIJE poslan:", emailErr);
    }

    res.status(200).json({
      poruka: "Pregled uspješno završen.",
      reviewPoziv: {
        kanal: "in-app",
        poruka: "Pacijent sada može anonimno ocijeniti završeni pregled.",
      },
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
