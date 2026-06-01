import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const MAX_COMMENT_LENGTH = 500;
const REVIEW_TOKEN_PURPOSE = "appointment-review";

/*type RecenzijaZaDoktora = {
  id: number;
  ocjena: number;
  komentar: string | null;
  kreiranoAt: Date;
};*/
// Novo — prikazuje i sakrivene, ali bez teksta
type RecenzijaZaDoktora = {
  id: number;
  ocjena: number;
  komentar: string | null;
  
  kreiranoAt: Date;
  sakriven: boolean;   // ← dodati ovo u tip
};
type ReviewTokenPayload = {
  appointmentId: number;
  purpose: typeof REVIEW_TOKEN_PURPOSE;
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

const getReviewTokenSecret = () => process.env.REVIEW_TOKEN_SECRET || process.env.JWT_SECRET;

const procitajReviewToken = (token: string): number | null => {
  const secret = getReviewTokenSecret();
  if (!secret) {
    throw new Error("Nedostaje REVIEW_TOKEN_SECRET ili JWT_SECRET za javne ocjene.");
  }

  const payload = jwt.verify(token, secret) as Partial<ReviewTokenPayload>;
  if (payload.purpose !== REVIEW_TOKEN_PURPOSE) return null;
  if (!Number.isInteger(payload.appointmentId) || Number(payload.appointmentId) <= 0) return null;

  return Number(payload.appointmentId);
};

/*const mapirajAnonimneKomentare = (recenzije: RecenzijaZaDoktora[]) => {
  let brojac = 0;
  return recenzije
    .filter((recenzija) => recenzija.komentar && recenzija.komentar.trim().length > 0)
    .map((recenzija) => {
      brojac += 1;
      return {
        id: recenzija.id,
        author: `Anonymous Patient ${brojac}`,
        rating: recenzija.ocjena,
        comment: recenzija.komentar,
        createdAt: recenzija.kreiranoAt,
      };
    });
};*/


const mapirajAnonimneKomentare = (recenzije: RecenzijaZaDoktora[]) => {
  let brojac = 0;
  return recenzije
    .filter((r) => r.komentar || r.sakriven) // prikaži one sa komentarom ILI sakrivene
    .map((r) => {
      brojac += 1;
      return {
        id: r.id,
        author: `Anonymous Patient ${brojac}`,
        rating: r.ocjena,
        comment: r.sakriven ? null : r.komentar, // sakriven = null tekst
        createdAt: r.kreiranoAt,
      };
    });
};

const validirajOcjenuIzBodyja = (body: any, res: Response) => {
  const rating = parseRating(body.rating ?? body.ocjena);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ poruka: "Ocjena je obavezna i mora biti broj od 1 do 5." });
    return null;
  }

  const comment = pripremiKomentar(body.comment ?? body.komentar);
  if (comment && comment.length > MAX_COMMENT_LENGTH) {
    res.status(400).json({ poruka: "Komentar ne smije imati više od 500 znakova." });
    return null;
  }

  return { rating, comment };
};

const kreirajRecenzijuZaTermin = async (appointmentId: number, rating: number, comment: string | null) => {
  const recenzija = await prisma.recenzija.create({
    data: {
      idRezervacije: appointmentId,
      ocjena: rating,
      komentar: comment,
    },
    select: {
      id: true,
      ocjena: true,
      komentar: true,
      kreiranoAt: true,
      // Novo — odmah kreirana recenzija nije sakrivena
      sakriven: true,
    },
  });

  return mapirajRecenzijuZaPacijenta(recenzija);
};

const provjeriDaLiTerminMozeBitiOcijenjen = async (appointmentId: number) => {
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
    return { status: 404, poruka: "Termin nije pronađen." } as const;
  }

  if (rezervacija.datumOtkazivanja) {
    return { status: 400, poruka: "Nije moguće ocijeniti otkazani termin." } as const;
  }

  if (!rezervacija.zavrseno) {
    return { status: 400, poruka: "Ocjenu možete ostaviti tek nakon završenog pregleda." } as const;
  }

  if (rezervacija.recenzija) {
    return { status: 409, poruka: "Ovaj termin je već ocijenjen." } as const;
  }

  return { status: 200, rezervacija } as const;
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

    const validiranaOcjena = validirajOcjenuIzBodyja(req.body, res);
    if (!validiranaOcjena) return;

    const pacijent = await prisma.pacijent.findFirst({
      where: { idKorisnik: korisnikPayload.id },
      select: { id: true },
    });

    if (!pacijent) {
      res.status(404).json({ poruka: "Profil pacijenta nije pronađen." });
      return;
    }

    const provjera = await provjeriDaLiTerminMozeBitiOcijenjen(appointmentId);
    if (provjera.status !== 200) {
      res.status(provjera.status).json({ poruka: provjera.poruka });
      return;
    }

    if (provjera.rezervacija.idPacijent !== pacijent.id) {
      res.status(403).json({ poruka: "Možete ocijeniti samo svoj termin." });
      return;
    }

    try {
      const review = await kreirajRecenzijuZaTermin(
        provjera.rezervacija.id,
        validiranaOcjena.rating,
        validiranaOcjena.comment
      );

      res.status(201).json({
        poruka: "Hvala na anonimnoj ocjeni.",
        review,
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

// GET /api/appointments/review/:token
export const getJavniPozivZaRecenziju = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = String(req.params.token ?? "");
    if (!token) {
      res.status(400).json({ poruka: "Nedostaje token za ocjenu." });
      return;
    }

    let appointmentId: number | null = null;
    try {
      appointmentId = procitajReviewToken(token);
    } catch (err: any) {
      if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
        res.status(401).json({ poruka: "Link za ocjenu nije validan ili je istekao." });
        return;
      }
      throw err;
    }

    if (!appointmentId) {
      res.status(401).json({ poruka: "Link za ocjenu nije validan." });
      return;
    }

    const rezervacija = await prisma.rezervacije.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        zavrseno: true,
        datumOtkazivanja: true,
        recenzija: { select: { id: true, ocjena: true, komentar: true, kreiranoAt: true,sakriven: true } },
        termin: { select: { datum: true, vrijeme: true } },
        doktor: { select: { korisnik: { select: { ime: true, prezime: true } } } },
        
      },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Termin nije pronađen." });
      return;
    }

    const mozeOcijeniti = Boolean(rezervacija.zavrseno && !rezervacija.datumOtkazivanja && !rezervacija.recenzija);

    res.json({
      appointment: {
        id: rezervacija.id,
        doctorName: `Dr. ${rezervacija.doktor.korisnik.ime} ${rezervacija.doktor.korisnik.prezime}`,
        date: rezervacija.termin.datum,
        time: rezervacija.termin.vrijeme,
        completed: rezervacija.zavrseno,
        canceled: Boolean(rezervacija.datumOtkazivanja),
        canReview: mozeOcijeniti,
        review: rezervacija.recenzija ? mapirajRecenzijuZaPacijenta(rezervacija.recenzija) : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/appointments/review/:token
export const kreirajJavnuRecenziju = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = String(req.params.token ?? "");
    if (!token) {
      res.status(400).json({ poruka: "Nedostaje token za ocjenu." });
      return;
    }

    let appointmentId: number | null = null;
    try {
      appointmentId = procitajReviewToken(token);
    } catch (err: any) {
      if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
        res.status(401).json({ poruka: "Link za ocjenu nije validan ili je istekao." });
        return;
      }
      throw err;
    }

    if (!appointmentId) {
      res.status(401).json({ poruka: "Link za ocjenu nije validan." });
      return;
    }

    const validiranaOcjena = validirajOcjenuIzBodyja(req.body, res);
    if (!validiranaOcjena) return;

    const provjera = await provjeriDaLiTerminMozeBitiOcijenjen(appointmentId);
    if (provjera.status !== 200) {
      res.status(provjera.status).json({ poruka: provjera.poruka });
      return;
    }

    try {
      const review = await kreirajRecenzijuZaTermin(
        provjera.rezervacija.id,
        validiranaOcjena.rating,
        validiranaOcjena.comment
      );

      res.status(201).json({
        poruka: "Hvala na anonimnoj ocjeni.",
        review,
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

   /* const recenzije = await prisma.recenzija.findMany({
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
    const averageRating = recenzije.length > 0 ? Number((suma / recenzije.length).toFixed(2)) : null;*/
    // Novo — dohvata SVE recenzije, sakriven samo utiče na prikaz komentara
const recenzije = await prisma.recenzija.findMany({
  where: {
    rezervacija: { idDoktor: doktorId },
  },
  select: {
    id: true,
    ocjena: true,
    komentar: true,
    sakriven: true,
    kreiranoAt: true,
  },
  orderBy: [{ kreiranoAt: "asc" }, { id: "asc" }],
});

// Prosjek uključuje SVE ocjene (i sakrivene)
const suma = recenzije.reduce((acc, recenzija) => acc + recenzija.ocjena, 0);
const averageRating = recenzije.length > 0 ? Number((suma / recenzije.length).toFixed(2)) : null;

res.json({
  doctorId: doktorId,
  averageRating,
  reviewCount: recenzije.length,
  comments: mapirajAnonimneKomentare(recenzije),
});

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
