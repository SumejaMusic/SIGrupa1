import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

const MAX_COMMENT_LENGTH = 500;

type ReviewZaDoktora = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
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

const mapirajReviewZaPacijenta = (review: ReviewZaDoktora) => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
});

const mapirajAnonimneKomentare = (reviews: ReviewZaDoktora[]) => {
  let brojac = 0;
  return reviews
    .filter((review) => review.comment && review.comment.trim().length > 0)
    .map((review) => {
      brojac += 1;
      return {
        id: review.id,
        author: `Anonymous Pacijent ${brojac}`,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      };
    });
};

// POST /api/appointments/:id/review
export const kreirajReview = async (req: Request, res: Response, next: NextFunction) => {
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
        review: { select: { id: true } },
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

    if (rezervacija.review) {
      res.status(409).json({ poruka: "Ovaj termin je već ocijenjen." });
      return;
    }

    try {
      const review = await prisma.review.create({
        data: {
          appointmentId: rezervacija.id,
          rating,
          comment,
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        poruka: "Hvala na anonimnoj ocjeni.",
        review: mapirajReviewZaPacijenta(review),
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
export const getReviewsZaDoktora = async (req: Request, res: Response, next: NextFunction) => {
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

    const reviews = await prisma.review.findMany({
      where: {
        hidden: false,
        appointment: { idDoktor: doktorId },
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
      orderBy: [
        { createdAt: "asc" },
        { id: "asc" },
      ],
    });

    const suma = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = reviews.length > 0 ? Number((suma / reviews.length).toFixed(2)) : null;

    res.json({
      doctorId: doktorId,
      averageRating,
      reviewCount: reviews.length,
      comments: mapirajAnonimneKomentare(reviews),
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/reviews/:id/hide
export const sakrijReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewId = Number(req.params.id);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      res.status(400).json({ poruka: "Neispravan ID ocjene." });
      return;
    }

    const hidden = req.body.hidden === undefined ? true : Boolean(req.body.hidden);

    const postoji = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });

    if (!postoji) {
      res.status(404).json({ poruka: "Ocjena nije pronađena." });
      return;
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        hidden,
        hiddenAt: hidden ? new Date() : null,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        hidden: true,
        hiddenAt: true,
        createdAt: true,
      },
    });

    res.json({
      poruka: hidden ? "Komentar je sakriven." : "Komentar je ponovo vidljiv.",
      review,
    });
  } catch (err) {
    next(err);
  }
};
