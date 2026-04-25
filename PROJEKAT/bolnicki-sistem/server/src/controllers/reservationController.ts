import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
//import { sendEmail } from "../lib/email.js";



// POST /api/rezervacije
// US-06, US-07, US-13, US-08, US-31
export const kreirajRezervaciju = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { terminId, doktorId, komentar, hitnost, tipPregledaId } = req.body;
    const korisnikId = (req as any).korisnik.id; //for now hardcodirana vrijednost za korisnika

    // US-13 — Provjera duplikata: isti pacijent, isti doktor, isti termin
    const pacijent = await prisma.pacijent.findFirst({ where: { idKorisnik: korisnikId } });
    if (!pacijent) {
      res.status(404).json({ poruka: "Profil pacijenta nije pronađen." });
      return;
    }

    const duplikat = await prisma.rezervacije.findFirst({
      where: { idPacijent: pacijent.id, idTermina: terminId },
    });
    if (duplikat) {
      res.status(409).json({ poruka: "Rezervacija za ovaj termin već postoji." });
      return;
    }

    // NFR-22 — Provjera Redis locka: termin mora biti zaključan od ovog korisnika
    //provjera ove funkcionalnosti nakon implementacije logina i registracije novih korisnika
    const lock = await redis.get(`termin:lock:${terminId}`);
    if (!lock || lock !== String(korisnikId)) {
      res.status(409).json({ poruka: "Termin nije zaključan. Pokrenite proces ponovo." });
      return;
    }

    // NFR-12 — ACID: sve u jednoj Prisma transakciji
    const rezervacija = await prisma.$transaction(async (tx) => {
      const nova = await tx.rezervacije.create({
        data: {
          idTermina: terminId,
          idPacijent: pacijent.id,
          idDoktor: doktorId,
          komentar: komentar ?? null, //za kasnije
          hitnost: hitnost ?? false, //za kasnije
          doktorRezervisao: false,
          datumKreiranja: new Date(),
          idTipPregleda: tipPregledaId,
        },
        //include prosiruje response baze na nase kreiranje reda rezervacije
        //ovo je kasnije potrebno za email potvrde
        include: {
          termin: true,
          pacijent: { include: { korisnik: true } },
          doktor: { include: { korisnik: true } },
        },
      });

      // Ažuriraj status termina na POTVRĐEN
      await tx.termin.update({
        where: { id: terminId },
        data: { status: "POTVRDJEN" }, //u bazi je POTVRDJEN umjesto POTVRDEN fyi
      });

      return nova;
    });

    // Oslobodi Redis lock nakon uspješnog kreiranja
    await redis.del(`termin:lock:${terminId}`);

    //US-08 - email potvrda
    //potrebno

    // US-31 — Podsjetnik za hronične bolesnike
    //potrebno 

    res.status(201).json(rezervacija);
  } catch (err) {
    next(err);
  }
};


// GET /api/rezervacije/moje
export const getRezervacijeZaPacijenta = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const korisnikId = (req as any).korisnik.id; 
    const pacijent = await prisma.pacijent.findFirst({ where: { idKorisnik: korisnikId } });

    if (!pacijent) {
      res.status(404).json({ poruka: "Profil pacijenta nije pronađen." });
      return;
    }

    const rezervacije = await prisma.rezervacije.findMany({
      where: { idPacijent: pacijent.id },
      include: { termin: true, doktor: { include: { korisnik: true } } },
      orderBy: { datumKreiranja: "desc" },
    });

    res.json(rezervacije);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/rezervacije/doktor/:doktorId
// ─────────────────────────────────────────────
export const getRezervacijeZaDoktora = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rezervacije = await prisma.rezervacije.findMany({
      where: { idDoktor: Number(req.params.doktorId) },
      include: { termin: true, pacijent: { include: { korisnik: true } } },
      orderBy: { datumKreiranja: "desc" },
    });

    res.json(rezervacije);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/rezervacije/:id/otkazi/pacijent
// US-10, NFR-09, NFR-11
// ─────────────────────────────────────────────
export const otkaziRezervacijuPacijent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rezervacija = await prisma.rezervacije.findUnique({
      where: { id: Number(req.params.id) },
      include: { termin: true, pacijent: { include: { korisnik: true } } },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    // Zabrana otkazivanja < 24h prije termina
    const sada = new Date();
    const vrijemeTermina = new Date(rezervacija.termin.datum);
    const razlikaMs = vrijemeTermina.getTime() - sada.getTime();
    const razlikaSati = razlikaMs / (1000 * 60 * 60);

    if (razlikaSati < 24) {
      res.status(400).json({ poruka: "Nije moguće otkazati termin manje od 24 sata unaprijed." });
      return;
    }

    // NFR-12 — ACID transakcija
    await prisma.$transaction(async (tx) => {
      await tx.rezervacije.update({
        where: { id: rezervacija.id },
        data: { doktorOtkazao: false, datumOtkazivanja: new Date() },
      });

      // NFR-09 — Odmah oslobodi termin (≤2s)
      await tx.termin.update({
        where: { id: rezervacija.idTermina },
        data: { status: "OTKAZAN" },
      });
    });

    // NFR-11 — Email obavijest pacijentu
    //potrebno

    res.json({ poruka: "Rezervacija uspješno otkazana." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/rezervacije/:id/otkazi/osoblje
// US-09, NFR-09, NFR-11
// ─────────────────────────────────────────────
export const otkaziRezervacijuOsoblje = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rezervacija = await prisma.rezervacije.findUnique({
      where: { id: Number(req.params.id) },
      include: { termin: true, pacijent: { include: { korisnik: true } } },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.rezervacije.update({
        where: { id: rezervacija.id },
        data: { doktorOtkazao: true, datumOtkazivanja: new Date() },
      });

      await tx.termin.update({
        where: { id: rezervacija.idTermina },
        data: { status: "OTKAZAN" },
      });
    });

   //email

    res.json({ poruka: "Rezervacija otkazana od strane osoblja." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/rezervacije/:id/komentar
// US-22
// ─────────────────────────────────────────────
export const dodajKomentar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { komentar } = req.body;

    const rezervacija = await prisma.rezervacije.update({
      where: { id: Number(req.params.id) },
      data: { komentar },
    });

    res.json(rezervacija);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/rezervacije/:id/trajanje
// US-15, NFR-16
// ─────────────────────────────────────────────
export const promijeniTrajanje = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { novaTrajanje } = req.body;

    // TODO: Ažuriraj trajanje na Doktor.TrajanjePregelda ili TipPregleda
    // TODO: Emituj WebSocket event za real-time update (NFR-16)
    // TODO: Logovati promjenu u AuditLog

    res.json({ poruka: "Trajanje termina ažurirano.", novaTrajanje });
  } catch (err) {
    next(err);
  }
};