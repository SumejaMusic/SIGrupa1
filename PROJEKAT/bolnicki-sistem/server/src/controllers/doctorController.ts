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

    // Mapiranje podataka za frontend
    const doktoriMapirani = doktori.map((d) => ({
      id: d.id,
      ime: d.korisnik.ime,
      prezime: d.korisnik.prezime,
      specijalizacija: d.specijalizacija,
      odjelId: d.idOdjela,
      email: d.korisnik.email,
      brojTelefona: d.korisnik.brojTelefona,
      trajanjePregleda: d.trajanjePregleda,
    }));

    res.json(doktoriMapirani);
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
// POST /api/doktori/rezervacije/:id/komentar
// Doktor dodaje komentar na rezervaciju
// ─────────────────────────────────────────────
export const dodajKomentarDoktor = async (
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

    if (korisnikPayload.uloga !== "DOKTOR") {
      res.status(403).json({ poruka: "Samo doktori mogu koristiti ovu rutu." });
      return;
    }

    const tekst = typeof req.body.komentar === "string" ? req.body.komentar.trim() : "";
    if (!tekst) {
      res.status(400).json({ poruka: "Komentar ne može biti prazan." });
      return;
    }

    const idRezervacije = Number(req.params.id);
    if (!Number.isInteger(idRezervacije) || idRezervacije <= 0) {
      res.status(400).json({ poruka: "Nevažeći ID rezervacije." });
      return;
    }

    const rezervacija = await prisma.rezervacije.findUnique({
      where: { id: idRezervacije },
      select: {
        id: true,
        idDoktor: true,
        datumOtkazivanja: true,
        zavrseno: true,
        doktor: { select: { idKorisnik: true } },
        pacijent: { select: { idKorisnik: true } },
      },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    if (rezervacija.datumOtkazivanja) {
      res.status(400).json({ poruka: "Nije moguće komentarisati otkazanu rezervaciju." });
      return;
    }

    if (rezervacija.zavrseno) {
      res.status(400).json({ poruka: "Nije moguće komentarisati završenu rezervaciju." });
      return;
    }

    if (rezervacija.doktor?.idKorisnik !== korisnikPayload.id) {
      res.status(403).json({ poruka: "Nemate dozvolu za komentarisanje ove rezervacije." });
      return;
    }

    const komentar = await prisma.komentar.create({
      data: {
        idRezervacije: rezervacija.id,
        idKorisnik: korisnikPayload.id,
        tekst,
        jeDoktor: true,
        datumKreiranja: new Date(),
      },
      include: {
        korisnik: { select: { ime: true, prezime: true } },
      },
    });

    res.status(201).json({
      id: komentar.id,
      tekst: komentar.tekst,
      autor: komentar.korisnik
        ? `${komentar.korisnik.ime} ${komentar.korisnik.prezime}`
        : "Doktor",
      datum: komentar.datumKreiranja.toISOString().split("T")[0],
      jeDoktor: true,
    });
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