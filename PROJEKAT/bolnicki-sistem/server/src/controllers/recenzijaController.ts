import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

const MAX_COMMENT_LENGTH = 500;

type RecenzijaZaDoktora = {
  id: number;
  ocjena: number;
  komentar: string | null;
  kreiranoAt: Date;
};

const parseRating = (value: unknown) => {
  const rating = Number(value);
  return Number.isInteger(rating) ? rating : NaN;
};

const pripremiKomentar = (value: unknown) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const comment = value.trim();
  return comment.length > 0 ? comment : null;
};

const mapirajRecenzijuZaPacijenta = (recenzija: RecenzijaZaDoktora) => ({
  id: recenzija.id,
  rating: recenzija.ocjena,
  comment: recenzija.komentar,
  createdAt: recenzija.kreiranoAt,
});

const mapirajAnonimneKomentare = (recenzije: RecenzijaZaDoktora[]) => {
  let brojac = 0;
  return recenzije
    .filter((recenzija) => recenzija.komentar && recenzija.komentar.trim().length > 0)
    .map((recenzija) => {
      brojac += 1;
      return {
        id: recenzija.id,
        author: `Anonymous Pacijent ${brojac}`,
        rating: recenzija.ocjena,
        comment: recenzija.komentar,
        createdAt: recenzija.kreiranoAt,
      };
    });
};

// POST /api/appointments/:id/review
export const kreirajRecenziju = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointmentId = Number(req.params.id);
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      res.status(400).json({ poruka: "Neispravan ID termina." });
      return;
    }

    const korisnikPayload = (req as any).korisnik;
    if (!korisnikPayload) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    const rating = parseRating(req.body.rating ?? req.body.ocjena);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ poruka: "Ocjena je obavezna i mora biti broj od 1 do 5." });
      return;
    }

    const comment = pripremiKomentar(req.body.comment ?? req.body.komentar);
    if (comment && comment.length > MAX_COMMENT_LENGTH) {
      res.status(400).json({ poruka: "Komentar ne smije imati više od 500 znakova." });
      return;
    }

    const pacijent = await prisma.pacijent.findFirst({
      where: { idKorisnik: korisnikPayload.id },
      select: { id: true },
    });

    if (!pacijent) {
      res.status(404).json({ poruka: "Profil pacijenta nije pronađen." });
      return;
    }

    const rezervacija = await prisma.rezervacije.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        idPacijent: true,
        zavrseno: true,
        datumOtkazivanja: true,
        recenzija: { select: { id: true } },
      },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Termin nije pronađen." });
      return;
    }

    if (rezervacija.idPacijent !== pacijent.id) {
      res.status(403).json({ poruka: "Možete ocijeniti samo svoj termin." });
      return;
    }

    if (rezervacija.datumOtkazivanja) {
      res.status(400).json({ poruka: "Nije moguće ocijeniti otkazani termin." });
      return;
    }

    if (!rezervacija.zavrseno) {
      res.status(400).json({ poruka: "Ocjenu možete ostaviti tek nakon završenog pregleda." });
      return;
    }

    if (rezervacija.recenzija) {
      res.status(409).json({ poruka: "Ovaj termin je već ocijenjen." });
      return;
    }

    try {
      const recenzija = await prisma.recenzija.create({
        data: {
          idRezervacije: rezervacija.id,
          ocjena: rating,
          komentar: comment,
        },
        select: {
          id: true,
          ocjena: true,
          komentar: true,
          kreiranoAt: true,
        },
      });

      res.status(201).json({
        poruka: "Hvala na anonimnoj ocjeni.",
        review: mapirajRecenzijuZaPacijenta(recenzija),
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        res.status(409).json({ poruka: "Ovaj termin je već ocijenjen." });
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

// GET /api/doktori/:id/reviews
export const getRecenzijeZaDoktora = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doktorId = Number(req.params.id);
    if (!Number.isInteger(doktorId) || doktorId <= 0) {
      res.status(400).json({ poruka: "Neispravan ID doktora." });
      return;
    }

    const korisnikPayload = (req as any).korisnik;
    if (korisnikPayload?.uloga === "DOKTOR" && korisnikPayload.doktorId !== doktorId) {
      res.status(403).json({ poruka: "Nemate dozvolu za pregled ovih ocjena." });
      return;
    }

    const recenzije = await prisma.recenzija.findMany({
      where: {
        sakriven: false,
        rezervacija: { idDoktor: doktorId },
      },
      select: {
        id: true,
        ocjena: true,
        komentar: true,
        kreiranoAt: true,
      },
      orderBy: [
        { kreiranoAt: "asc" },
        { id: "asc" },
      ],
    });

    const suma = recenzije.reduce((acc, recenzija) => acc + recenzija.ocjena, 0);
    const averageRating = recenzije.length > 0 ? Number((suma / recenzije.length).toFixed(2)) : null;

    res.json({
      doctorId: doktorId,
      averageRating,
      reviewCount: recenzije.length,
      comments: mapirajAnonimneKomentare(recenzije),
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/reviews/:id/hide
export const sakrijRecenziju = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewId = Number(req.params.id);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      res.status(400).json({ poruka: "Neispravan ID ocjene." });
      return;
    }

    const hidden = req.body.hidden === undefined ? true : Boolean(req.body.hidden);

    const postoji = await prisma.recenzija.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });

    if (!postoji) {
      res.status(404).json({ poruka: "Ocjena nije pronađena." });
      return;
    }

    const recenzija = await prisma.recenzija.update({
      where: { id: reviewId },
      data: {
        sakriven: hidden,
        sakrivenAt: hidden ? new Date() : null,
      },
      select: {
        id: true,
        ocjena: true,
        komentar: true,
        sakriven: true,
        sakrivenAt: true,
        kreiranoAt: true,
      },
    });

    res.json({
      poruka: hidden ? "Komentar je sakriven." : "Komentar je ponovo vidljiv.",
      review: {
        id: recenzija.id,
        rating: recenzija.ocjena,
        comment: recenzija.komentar,
        hidden: recenzija.sakriven,
        hiddenAt: recenzija.sakrivenAt,
        createdAt: recenzija.kreiranoAt,
      },
    });
  } catch (err) {
    next(err);
  }
};
