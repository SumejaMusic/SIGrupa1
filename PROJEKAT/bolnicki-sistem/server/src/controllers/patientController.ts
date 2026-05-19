import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { dekriptuj } from "../lib/encryption.js";

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
      pol: p.korisnik.jmbg[6] < "5" ? "M" : "F",
      telefon: p.korisnik.brojTelefona ?? "/",
    }));

    res.json(mapirani);
  } catch (err) {
    next(err);
  }
};

// pomocna funkcija za dekriptovanje jednog recepta, da se moze prikaszat doktoru
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
    const historija = await prisma.historijaPregleda.findMany({
      where: { idPacijent: Number(req.params.pacijentId) },
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