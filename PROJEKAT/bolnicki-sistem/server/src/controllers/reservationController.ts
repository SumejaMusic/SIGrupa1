import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { getCurrentPacijent } from "../lib/currentPatient.js";
import { posaljiPotvrdurezerv } from "../emailService.js";

// POST /api/rezervacije
// US-06, US-07, US-13, US-08, US-31
console.log("reservationController učitan");
export const kreirajRezervaciju = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("📥 Kreiranje rezervacije");
    const idTermina = Number(req.body.idTermina ?? req.body.terminId);
    const idDoktor = Number(req.body.idDoktor ?? req.body.doktorId);
    const idTipPregledaRaw = req.body.idTipPregleda ?? req.body.tipPregledaId;
    const idTipPregleda =
      idTipPregledaRaw === undefined || idTipPregledaRaw === null
        ? null
        : Number(idTipPregledaRaw);
    const komentar = req.body.komentar;
    const hitnost = req.body.hitnost;
    if (!Number.isInteger(idTermina) || idTermina <= 0 || !Number.isInteger(idDoktor) || idDoktor <= 0) {
      res.status(400).json({ poruka: "Nedostaju ispravni podaci za termin ili doktora." });
      return;
    }

    const pacijent = await getCurrentPacijent();
    if (!pacijent) {
      res.status(404).json({ poruka: "Profil pacijenta nije pronađen." });
      return;
    }

    const korisnikId = pacijent.idKorisnik;

    const termin = await prisma.termin.findUnique({
      where: { id: idTermina },
    });

    if (!termin) {
      res.status(404).json({ poruka: "Termin nije pronađen." });
      return;
    }

    if (termin.idDoktor !== idDoktor) {
      res.status(400).json({ poruka: "Odabrani termin ne pripada izabranom doktoru." });
      return;
    }

    if (termin.status !== "SLOBODAN") {
      res.status(409).json({ poruka: "Termin više nije slobodan." });
      return;
    }

    const duplikat = await prisma.rezervacije.findFirst({
  where: {
    idPacijent: pacijent.id,
    idTermina: idTermina,
    datumOtkazivanja: null, // ← ignoriši otkazane
  },
});
    if (duplikat) {
      res.status(409).json({ poruka: "Rezervacija za ovaj termin već postoji." });
      return;
    }

    const lock = await redis.get(`termin:lock:${idTermina}`);
    if (!lock || lock !== String(korisnikId)) {
      res.status(409).json({ poruka: "Termin nije zaključan. Pokrenite proces ponovo." });
      return;
    }

    const rezervacija = await prisma.$transaction(async (tx) => {
      const nova = await tx.rezervacije.create({
        data: {
          idTermina: idTermina,
          idPacijent: pacijent.id,
          idDoktor: idDoktor,
          komentar: komentar ?? null,
          hitnost: hitnost ?? false,
          doktorRezervisao: false,
          datumKreiranja: new Date(),
          idTipPregleda: idTipPregleda,
        },
        include: {
          termin: true,
          pacijent: { include: { korisnik: true } },
          doktor: { include: { korisnik: true } },
        },
      });

      await tx.termin.update({
        where: { id: idTermina },
        data: { status: "ZAKAZAN" },
      });

      return nova;
    });

    await redis.del(`termin:lock:${idTermina}`);
    const doktorKorisnik = rezervacija.doktor.korisnik;
    const pacijentKorisnik = rezervacija.pacijent.korisnik;

    try {
      await posaljiPotvrdurezerv({
        pacijentEmail: 'smusic1@etf.unsa.ba',
        pacijentIme: pacijentKorisnik.ime,
        pacijentPrezime: pacijentKorisnik.prezime,
        doktorIme: doktorKorisnik.ime,
        doktorPrezime: doktorKorisnik.prezime,
        doktorSpecijalizacija: rezervacija.doktor.specijalizacija,
        datum: rezervacija.termin.datum,
        vrijeme: rezervacija.termin.vrijeme,
        rezervacijaId: rezervacija.id,
        hitnost: rezervacija.hitnost ?? false,
        komentar: rezervacija.komentar ?? undefined,
      });
      console.log(`✅ Email poslan na: ${pacijentKorisnik.email}`);
    } catch (emailErr) {
      console.error("❌ Email NIJE poslan:", emailErr);
    }

    // Samo JEDAN res.status ovdje!
    res.status(201).json(rezervacija);

  } catch (err) {
    next(err);
  }
};

// GET /api/rezervacije/moje
// US-05 — Rezervacije ulogovanog pacijenta
export const getRezervacijeZaPacijenta = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pacijent = await getCurrentPacijent();

    if (!pacijent) {
      res.status(404).json({ poruka: "Profil pacijenta nije pronađen." });
      return;
    }

    const rezervacije = await prisma.rezervacije.findMany({
      where: {
        idPacijent: pacijent.id,
        datumOtkazivanja: null,
      },
      //include: { termin: true, doktor: { include: { korisnik: true } } }, zamjenjeno s ovim ispod da povuce iz baze tip ako sta ne bude radilo vratiti 
      include: { termin: true, doktor: { include: { korisnik: true } }, tipPregleda: true },
      orderBy: { datumKreiranja: "desc" },
    });

    res.json(rezervacije);
  } catch (err) {
    next(err);
  }
};

// GET /api/rezervacije/doktor/:doktorId
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

// PATCH /api/rezervacije/:id/otkazi/pacijent
// US-10, NFR-09, NFR-11
export const otkaziRezervacijuPacijent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pacijent = await getCurrentPacijent();

    if (!pacijent) {
      res.status(404).json({ poruka: "Profil pacijenta nije pronađen." });
      return;
    }

    const rezervacija = await prisma.rezervacije.findUnique({
      where: { id: Number(req.params.id) },
      include: { termin: true, pacijent: { include: { korisnik: true } } },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    if (rezervacija.idPacijent !== pacijent.id) {
      res.status(403).json({ poruka: "Nemate dozvolu da otkažete ovu rezervaciju." });
      return;
    }

    const sada = new Date();
    const vrijemeTermina = new Date(rezervacija.termin.datum);
    const razlikaMs = vrijemeTermina.getTime() - sada.getTime();
    const razlikaSati = razlikaMs / (1000 * 60 * 60);

    if (razlikaSati < 24) {
      res.status(400).json({ poruka: "Nije moguće otkazati termin manje od 24 sata unaprijed." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.rezervacije.update({
        where: { id: rezervacija.id },
        data: { datumOtkazivanja: new Date() },
      });

      await tx.termin.update({
        where: { id: rezervacija.idTermina },
        data: { status: "SLOBODAN" },
      });
    });

    res.json({ poruka: "Rezervacija uspješno otkazana." });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rezervacije/:id/otkazi/osoblje
// US-09, NFR-09, NFR-11
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
        data: { status: "SLOBODAN" },
      });
    });

    res.json({ poruka: "Rezervacija otkazana od strane osoblja." });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rezervacije/:id/komentar
// US-22
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

// PATCH /api/rezervacije/:id/trajanje
// US-15, NFR-16
export const promijeniTrajanje = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { novaTrajanje } = req.body;

    // TODO: Ažuriraj trajanje na Doktor.trajanjePregleda ili TipPregleda
    // TODO: Emituj WebSocket event za real-time update (NFR-16)

    res.json({ poruka: "Trajanje termina ažurirano.", novaTrajanje });
  } catch (err) {
    next(err);
  }
};
