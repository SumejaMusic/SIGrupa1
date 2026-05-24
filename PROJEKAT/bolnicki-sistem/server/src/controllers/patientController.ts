import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { dekriptuj } from "../lib/encryption.js";

function odrediPolIzJmbg(jmbg?: string): "M" | "F" | "/" {
  if (!jmbg || jmbg.length < 7) return "/";
  return jmbg[6] < "5" ? "M" : "F";
}

// GET /api/pacijenti
export const getSviPacijenti = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pacijenti = await prisma.pacijent.findMany({
      include: {
        korisnik: {
          select: {
            ime: true,
            prezime: true,
            email: true,
            datumRodjenja: true,
            jmbg: true,
            brojTelefona: true,
          }
        }
      }
    });

    const mapirani = pacijenti.map(p => ({
      id: p.id,
      ime: p.korisnik.ime,
      prezime: p.korisnik.prezime,
      email: p.korisnik.email,
      godisteRodjenja: new Date(p.korisnik.datumRodjenja).getFullYear(),
      pol: odrediPolIzJmbg(p.korisnik.jmbg),
      telefon: p.korisnik.brojTelefona ?? "/",
    }));

    res.json(mapirani);
  } catch (err) {
    next(err);
  }
};

// pomocna funkcija za dekriptovanje jednog recepta, da se moze prikazati doktoru
function dekriptujRecept(r: any) {
  return {
    ...r,
    nazivLijeka: safeDecrypt(r.nazivLijeka),
    doza: safeDecrypt(r.doza),
    napomena: r.napomena ? safeDecrypt(r.napomena) : r.napomena,
  };
}

function safeDecrypt(vrijednost: string): string {
  try {
    return dekriptuj(vrijednost);
  } catch {
    return vrijednost;
  }
}

// GET /api/historija/pacijent/:pacijentId
export const getHistorijaPacijenta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pacijentId = Number(req.params.pacijentId);

    const historija = await prisma.historijaPregleda.findMany({
      where: { idPacijent: pacijentId },
      include: {
        rezervacija: {
          include: {
            termin: true,
            doktor: { include: { korisnik: true } }
          }
        },
        nalaz: true,
        recepti: true,
      },
      orderBy: { datumPregleda: "desc" }
    });

    const historijaSDekriptovanim = historija.map(h => ({
      ...h,
      recepti: h.recepti.map(dekriptujRecept),
    }));

    res.json(historijaSDekriptovanim);
  } catch (err) {
    next(err);
  }
};

// GET /api/pacijenti/hronicni
export const getHronicniPacijenti = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pacijenti = await prisma.pacijent.findMany({
      where: {
        hronicniBolesnik: true,
      },
      select: {
        id: true,
        hronicniBolesnik: true,
        reviewPeriodDays: true,
        zadnjiRutinskiPregledAt: true,
        korisnik: {
          select: {
            ime: true,
            prezime: true,
            email: true,
            datumRodjenja: true,
            jmbg: true,
            brojTelefona: true,
          }
        }
      }
    });

    const mapirani = pacijenti.map(p => ({
      id: p.id,
      ime: p.korisnik.ime,
      prezime: p.korisnik.prezime,
      email: p.korisnik.email,
      godisteRodjenja: new Date(p.korisnik.datumRodjenja).getFullYear(),
      pol: odrediPolIzJmbg(p.korisnik.jmbg),
      telefon: p.korisnik.brojTelefona ?? "/",
      hronicni: p.hronicniBolesnik,
      reviewPeriodDays: p.reviewPeriodDays,
      zadnjiRutinskiPregledAt: p.zadnjiRutinskiPregledAt,
    }));

    res.json(mapirani);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/pacijenti/:id/hronicni
export const updateHronicniStatusPacijenta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pacijentId = Number(req.params.id);
    const { hronicniBolesnik, reviewPeriodDays } = req.body;

    if (isNaN(pacijentId)) {
      return res.status(400).json({ poruka: "Neispravan ID pacijenta." });
    }

    if (typeof hronicniBolesnik !== "boolean") {
      return res.status(400).json({ poruka: "Polje hronicniBolesnik mora biti boolean." });
    }

    if (hronicniBolesnik && (!reviewPeriodDays || reviewPeriodDays <= 0)) {
      return res.status(400).json({ poruka: "Morate unijeti validan reviewPeriodDays." });
    }

    const azuriraniPacijent = await prisma.pacijent.update({
      where: { id: pacijentId },
      data: {
        hronicniBolesnik,
        reviewPeriodDays: hronicniBolesnik ? Number(reviewPeriodDays) : null,
      },
      include: {
        korisnik: {
          select: {
            ime: true,
            prezime: true,
            email: true,
          }
        }
      }
    });

    res.json({
      poruka: "Status hronicnog pacijenta uspješno ažuriran.",
      pacijent: azuriraniPacijent,
    });
  } catch (err) {
    next(err);
  }
};