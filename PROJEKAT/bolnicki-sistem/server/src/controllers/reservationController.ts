import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { posaljiPotvrdurezerv } from "../emailService.js";
import { io } from "../app.js";
import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Dozvoljeni su samo PDF fajlovi."));
    }
    cb(null, true);
  },
});

console.log("reservationController učitan");

// POST /api/rezervacije
export const kreirajRezervaciju = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("📥 Kreiranje rezervacije");
    const idTermina = Number(req.body.idTermina ?? req.body.terminId);
    const idDoktor = Number(req.body.idDoktor ?? req.body.doktorId);
    const idTipPregledaRaw = req.body.idTipPregleda ?? req.body.tipPregledaId;
    const idTipPregleda = idTipPregledaRaw === undefined || idTipPregledaRaw === null
      ? null : Number(idTipPregledaRaw);
    const komentar = req.body.komentar;
    const hitnost = req.body.hitnost;

    if (!Number.isInteger(idTermina) || idTermina <= 0 || !Number.isInteger(idDoktor) || idDoktor <= 0) {
      res.status(400).json({ poruka: "Nedostaju ispravni podaci za termin ili doktora." });
      return;
    }

    const korisnikPayload = (req as any).korisnik;
    if (!korisnikPayload) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    const pacijent = await prisma.pacijent.findFirst({
      where: { idKorisnik: korisnikPayload.id },
      include: { korisnik: true },
    });

    if (!pacijent) {
      res.status(404).json({ poruka: "Profil pacijenta nije pronađen." });
      return;
    }

    const korisnikId = pacijent.idKorisnik;

    const termin = await prisma.termin.findUnique({ where: { id: idTermina } });

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
      where: { idPacijent: pacijent.id, idTermina, datumOtkazivanja: null },
    });

    if (duplikat) {
      res.status(409).json({ poruka: "Rezervacija za ovaj termin već postoji." });
      return;
    }

    const lock = await redis.get(`termin:lock:${idTermina}`);

    if (!lock && lock === String(korisnikId)) {
      res.status(409).json({ poruka: "Termin nije zaključan. Pokrenite proces ponovo." });
      return;
    }

    const rezervacija = await prisma.$transaction(async (tx) => {
      const nova = await tx.rezervacije.create({
        data: {
          idTermina,
          idPacijent: pacijent.id,
          idDoktor,
          komentar: komentar ?? null,
          hitnost: hitnost ?? false,
          doktorRezervisao: false,
          datumKreiranja: new Date(),
          idTipPregleda,
        },
        include: {
          termin: true,
          pacijent: { include: { korisnik: true } },
          doktor: { include: { korisnik: true } },
        },
      });

      const file = (req as any).file;
      if (file) {
        const nalaz = await tx.nalaz.create({
          data: {
            naziv: file.originalname,
            opis: komentar ?? null,
            dokumentPDF: file.buffer,
          },
        });

        await tx.historijaPregleda.create({
          data: {
            idPacijent: pacijent.id,
            idDoktor,
            idRezervacija: nova.id,
            idNalaz: nalaz.id,
            dijagnoza: "Nije unesena",
            terapija: "Nije unesena",
            biljeske: komentar ?? null,
          },
        });
      }

      await tx.termin.update({ where: { id: idTermina }, data: { status: "ZAKAZAN" } });
      return nova;
    });

    io.emit("termin-azuriran", { doktorId: idDoktor, terminId: idTermina });
    await redis.del(`termin:lock:${idTermina}`);

    const doktorKorisnik = rezervacija.doktor.korisnik;
    const pacijentKorisnik = rezervacija.pacijent.korisnik;

    try {
      await posaljiPotvrdurezerv({
        pacijentEmail: pacijentKorisnik.email,
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

    res.status(201).json(rezervacija);
  } catch (err) {
    next(err);
  }
};

// GET /api/rezervacije/moje
export const getRezervacijeZaPacijenta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    if (!korisnikPayload) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    const pacijent = await prisma.pacijent.findFirst({
      where: { idKorisnik: korisnikPayload.id },
      include: { korisnik: true },
    });

    if (!pacijent) {
      res.status(404).json({ poruka: "Profil pacijenta nije pronađen." });
      return;
    }

    const rezervacije = await prisma.rezervacije.findMany({
      where: { idPacijent: pacijent.id, datumOtkazivanja: null },
      include: {
        termin: true,
        doktor: { include: { korisnik: true, soba: true } },
        tipPregleda: true,
        soba: true,
      },
      orderBy: { datumKreiranja: "desc" },
    });

    res.json(rezervacije);
  } catch (err) {
    next(err);
  }
};

// GET /api/rezervacije/doktor/:doktorId
export const getRezervacijeZaDoktora = async (req: Request, res: Response, next: NextFunction) => {
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
export const otkaziRezervacijuPacijent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    if (!korisnikPayload) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    const pacijent = await prisma.pacijent.findFirst({
      where: { idKorisnik: korisnikPayload.id },
      include: { korisnik: true },
    });

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
    const razlikaSati = (vrijemeTermina.getTime() - sada.getTime()) / (1000 * 60 * 60);

    if (razlikaSati < 24) {
      res.status(400).json({ poruka: "Nije moguće otkazati termin manje od 24 sata unaprijed." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.rezervacije.update({ where: { id: rezervacija.id }, data: { datumOtkazivanja: new Date() } });
      await tx.termin.update({ where: { id: rezervacija.idTermina }, data: { status: "SLOBODAN" } });
    });

    io.emit("termin-azuriran", { doktorId: rezervacija.idDoktor, terminId: rezervacija.idTermina });
    res.json({ poruka: "Rezervacija uspješno otkazana." });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rezervacije/:id/otkazi/osoblje
export const otkaziRezervacijuOsoblje = async (req: Request, res: Response, next: NextFunction) => {
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
      await tx.rezervacije.update({ where: { id: rezervacija.id }, data: { doktorOtkazao: true, datumOtkazivanja: new Date() } });
      await tx.termin.update({ where: { id: rezervacija.idTermina }, data: { status: "SLOBODAN" } });
    });

    res.json({ poruka: "Rezervacija otkazana od strane osoblja." });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rezervacije/:id/komentar
export const dodajKomentar = async (req: Request, res: Response, next: NextFunction) => {
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
export const promijeniTrajanje = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { novaTrajanje } = req.body;
    res.json({ poruka: "Trajanje termina ažurirano.", novaTrajanje });
  } catch (err) {
    next(err);
  }
};

// GET /api/rezervacije/:id/komentari
export const getKomentari = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rezervacija = await prisma.rezervacije.findUnique({
      where: { id: Number(req.params.id) },
      select: { komentar: true, datumKreiranja: true },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    const komentari = rezervacija.komentar ? [{
      id: Number(req.params.id) * 1000,
      tekst: rezervacija.komentar,
      autor: "Vi",
      datum: new Date(rezervacija.datumKreiranja).toISOString().split("T")[0],
      jeDoktor: false,
    }] : [];

    res.json(komentari);
  } catch (err) {
    next(err);
  }
};