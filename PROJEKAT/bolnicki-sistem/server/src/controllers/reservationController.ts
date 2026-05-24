import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { posaljiPotvrdurezerv, posaljiOtkazivanjeRezerv } from "../emailService.js";
import { io } from "../app.js";
import multer from "multer";
import { obradiOtkazivanje } from "../listaCekanjaService.js";
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

type KomentarSaKorisnikom = {
  id: number;
  tekst: string;
  jeDoktor: boolean;
  datumKreiranja: Date;
  korisnik?: {
    ime: string;
    prezime: string;
  } | null;
};

const izracunajVrijemeTermina = (termin: { datum: Date; vrijeme?: number | null }) => {
  const datum = new Date(termin.datum);
  const imaVrijemeUDatumu =
    datum.getHours() !== 0 ||
    datum.getMinutes() !== 0 ||
    datum.getSeconds() !== 0 ||
    datum.getMilliseconds() !== 0;
  const imaVrijemeUDatumuUTC =
    datum.getUTCHours() !== 0 ||
    datum.getUTCMinutes() !== 0 ||
    datum.getUTCSeconds() !== 0 ||
    datum.getUTCMilliseconds() !== 0;

  if (!Number.isInteger(termin.vrijeme) || (imaVrijemeUDatumu && imaVrijemeUDatumuUTC)) {
    return datum;
  }

  const datumSaSatnicom = new Date(datum);
  datumSaSatnicom.setHours(0, 0, 0, 0);
  datumSaSatnicom.setMinutes(termin.vrijeme as number);
  return datumSaSatnicom;
};

const korisnikJeDoktor = (korisnikPayload: any) => korisnikPayload?.uloga === "DOKTOR";

const formatirajKomentar = (komentar: KomentarSaKorisnikom) => ({
  id: komentar.id,
  tekst: komentar.tekst,
  autor: komentar.korisnik
    ? `${komentar.korisnik.ime} ${komentar.korisnik.prezime}`
    : komentar.jeDoktor ? "Doktor" : "Pacijent",
  datum: new Date(komentar.datumKreiranja).toISOString().split("T")[0],
  jeDoktor: komentar.jeDoktor,
});

const mozePristupitiRezervaciji = (
  korisnikPayload: any,
  rezervacija: {
    idDoktor?: number | null;
    pacijent?: { idKorisnik: number } | null;
    doktor?: { idKorisnik: number } | null;
  }
) => {
  if (["ADMINISTRATOR", "MEDICINSKO_OSOBLJE", "VLASNIK"].includes(korisnikPayload?.uloga)) {
    return true;
  }

  if (korisnikPayload?.uloga === "PACIJENT") {
    return rezervacija.pacijent?.idKorisnik === korisnikPayload.id;
  }

  if (korisnikPayload?.uloga === "DOKTOR") {
    return rezervacija.doktor?.idKorisnik === korisnikPayload.id ||
      rezervacija.idDoktor === korisnikPayload.doktorId;
  }

  return false;
};

// POST /api/rezervacije
export const kreirajRezervaciju = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("📥 Kreiranje rezervacije");
    const idTermina = Number(req.body.idTermina ?? req.body.terminId);
    const idDoktor = Number(req.body.idDoktor ?? req.body.doktorId);
    const idTipPregledaRaw = req.body.idTipPregleda ?? req.body.tipPregledaId;
    const idTipPregleda = idTipPregledaRaw === undefined || idTipPregledaRaw === null
      ? null : Number(idTipPregledaRaw);
    const komentar = typeof req.body.komentar === "string" ? req.body.komentar.trim() : "";
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

    const vrijemeTermina = izracunajVrijemeTermina(termin);
    if (vrijemeTermina.getTime() <= Date.now()) {
      res.status(400).json({ poruka: "Nevalidna rezervacija: ne možete rezervisati termin u prošlosti." });
      return;
    }

    const duplikat = await prisma.rezervacije.findFirst({
      where: { idPacijent: pacijent.id, idTermina, datumOtkazivanja: null },
    });

    if (duplikat) {
      res.status(409).json({ poruka: "Rezervacija za ovaj termin već postoji." });
      return;
    }

    const preklapanje = await prisma.rezervacije.findFirst({
      where: {
        idPacijent: pacijent.id,
        datumOtkazivanja: null,
        termin: {
          datum: termin.datum,
          vrijeme: termin.vrijeme,
        },
      },
    });

    if (preklapanje) {
      res.status(409).json({
        poruka: "Već imate zakazan pregled u isto vrijeme kod drugog doktora."
      });
      return;
    }

    const lock = await redis.get(`termin:lock:${idTermina}`);
//if (!lock && lock === String(korisnikId)) prije bilo
    if (!lock || lock !== String(korisnikId)) {
      res.status(409).json({ poruka: "Termin nije zaključan. Pokrenite proces ponovo." });
      return;
    }
    //javljalo je gresku servera jer upload pdf premasi duzinu prisma transakcije pa sam zamijenila
    //sa kodom ispod upload pdf se radi prije transakcije ako padne pdf se brise iz baze
    //ako bude problem vratiti
    /*const rezervacija = await prisma.$transaction(async (tx) => {
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
    });*/
    // PDF kreiraj VAN transakcije
    const file = (req as any).file;
    let nalazId: number | null = null;

    if (file) {
      const nalaz = await prisma.nalaz.create({
        data: {
          naziv: file.originalname,
          opis: komentar ?? null,
          dokumentPDF: file.buffer,
        },
      });
      nalazId = nalaz.id;
    }

    let rezervacija;
    try {
      rezervacija = await prisma.$transaction(async (tx) => {
        const nova = await tx.rezervacije.create({
          data: {
            idTermina,
            idPacijent: pacijent.id,
            idDoktor,
            komentar: komentar || null,
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

        if (komentar) {
          await tx.komentar.create({
            data: {
              idRezervacije: nova.id,
              idKorisnik: korisnikPayload.id,
              tekst: komentar,
              jeDoktor: korisnikJeDoktor(korisnikPayload),
              datumKreiranja: nova.datumKreiranja,
            },
          });
        }

        if (nalazId) {
          await tx.historijaPregleda.create({
            data: {
              idPacijent: pacijent.id,
              idDoktor,
              idRezervacija: nova.id,
              idNalaz: nalazId,
              dijagnoza: "Nije unesena",
              terapija: "Nije unesena",
              biljeske: komentar ?? null,
            },
          });
        }

        await tx.termin.update({ where: { id: idTermina }, data: { status: "ZAKAZAN" } });
        return nova;
      });
    } catch (err) {
      // Transakcija pukla — obriši PDF ako je bio uploadovan
      if (nalazId) {
        await prisma.nalaz.delete({ where: { id: nalazId } }).catch(() => {});
      }
      throw err;
    }

    io.emit("termin-azuriran", { doktorId: idDoktor, terminId: idTermina });
    // Ukloni s liste čekanja ako postoji
const datumTermina = new Date(termin.datum);
datumTermina.setUTCHours(0, 0, 0, 0);

await prisma.listaCekanja.updateMany({
  where: {
    idPacijent: pacijent.id,
    idDoktor: idDoktor,
    zeleniDatum: datumTermina,
    status: { in: ["CEKA", "OBAVIJESTEN"] }
  },
  data: { status: "OTKAZANO" as any }
});
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
        komentari: {
          include: { korisnik: { select: { ime: true, prezime: true } } },
          orderBy: { datumKreiranja: "asc" },
        },
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
      include: {
        termin: true,
        pacijent: { include: { korisnik: true } },
        komentari: {
          include: { korisnik: { select: { ime: true, prezime: true } } },
          orderBy: { datumKreiranja: "asc" },
        },
      },
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
    const vrijemeTermina = izracunajVrijemeTermina(rezervacija.termin);

    const razlikaSati = (vrijemeTermina.getTime() - sada.getTime()) / (1000 * 60 * 60);

    if (razlikaSati < 24) {
      res.status(400).json({
        poruka: "Nije moguće otkazati termin manje od 24 sata unaprijed."
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.rezervacije.update({ where: { id: rezervacija.id }, data: { datumOtkazivanja: new Date() } });
      await tx.termin.update({ where: { id: rezervacija.idTermina }, data: { status: "SLOBODAN" } });
    });

    console.log("🔄 Pozivam obradiOtkazivanje za termin:", rezervacija.idTermina);
await obradiOtkazivanje(rezervacija.idTermina, pacijent.id);
console.log("✅ obradiOtkazivanje završena");
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
      include: {
        termin: true,
        pacijent: { include: { korisnik: true } },
        doktor: { include: { korisnik: true } },
      },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    const vrijemeTermina = izracunajVrijemeTermina(rezervacija.termin);

    if (vrijemeTermina.getTime() <= Date.now()) {
      res.status(400).json({
        poruka: "Nije moguće otkazati termin koji je već prošao."
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.rezervacije.update({ where: { id: rezervacija.id }, data: { doktorOtkazao: true, datumOtkazivanja: new Date() } });
      await tx.termin.update({ where: { id: rezervacija.idTermina }, data: { status: "SLOBODAN" } });
    });

    const pacijentKorisnik = rezervacija.pacijent.korisnik;
    try {
      await posaljiOtkazivanjeRezerv({
        pacijentEmail: pacijentKorisnik.email,
        pacijentIme: pacijentKorisnik.ime,
        pacijentPrezime: pacijentKorisnik.prezime,
        doktorIme: rezervacija.doktor?.korisnik?.ime ?? "",
        doktorPrezime: rezervacija.doktor?.korisnik?.prezime ?? "",
        doktorSpecijalizacija: rezervacija.doktor?.specijalizacija ?? "",
        datum: rezervacija.termin.datum,
        vrijeme: rezervacija.termin.vrijeme,
        rezervacijaId: rezervacija.id,
      });
    } catch (emailErr) {
      console.error("❌ Email otkazivanja NIJE poslan:", emailErr);
    }
    console.log("🔄 Pozivam obradiOtkazivanje za termin:", rezervacija.idTermina);
await obradiOtkazivanje(rezervacija.idTermina); // bez ID-a
console.log("✅ obradiOtkazivanje završena");
    res.json({ poruka: "Rezervacija otkazana od strane osoblja." });
   
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rezervacije/:id/komentar
export const dodajKomentar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    if (!korisnikPayload) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    const tekst = typeof req.body.komentar === "string" ? req.body.komentar.trim() : "";
    if (!tekst) {
      res.status(400).json({ poruka: "Komentar ne može biti prazan." });
      return;
    }

    const rezervacija = await prisma.rezervacije.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        id: true,
        idDoktor: true,
        pacijent: { select: { idKorisnik: true } },
        doktor: { select: { idKorisnik: true } },
      },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    if (!mozePristupitiRezervaciji(korisnikPayload, rezervacija)) {
      res.status(403).json({ poruka: "Nemate dozvolu za komentarisanje ove rezervacije." });
      return;
    }

    const komentar = await prisma.komentar.create({
      data: {
        idRezervacije: rezervacija.id,
        idKorisnik: korisnikPayload.id,
        tekst,
        jeDoktor: korisnikJeDoktor(korisnikPayload),
      },
      include: {
        korisnik: { select: { ime: true, prezime: true } },
      },
    });

    res.status(201).json(formatirajKomentar(komentar));
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

    // Doktor smije komentarisati samo svoje rezervacije
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
      include: {
        pacijent: {
          select: {
            idKorisnik: true,
            korisnik: { select: { ime: true, prezime: true } },
          },
        },
        doktor: { select: { idKorisnik: true } },
        komentari: {
          include: { korisnik: { select: { ime: true, prezime: true } } },
          orderBy: { datumKreiranja: "asc" },
        },
      },
    });

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    const korisnikPayload = (req as any).korisnik;
    if (!mozePristupitiRezervaciji(korisnikPayload, rezervacija)) {
      res.status(403).json({ poruka: "Nemate dozvolu za pregled komentara ove rezervacije." });
      return;
    }

    if (rezervacija.komentari.length > 0) {
      res.json(rezervacija.komentari.map(formatirajKomentar));
      return;
    }

    const komentari = rezervacija.komentar ? [{
      id: Number(req.params.id) * 1000,
      tekst: rezervacija.komentar,
      autor: `${rezervacija.pacijent.korisnik.ime} ${rezervacija.pacijent.korisnik.prezime}`,
      datum: new Date(rezervacija.datumKreiranja).toISOString().split("T")[0],
      jeDoktor: false,
    }] : [];

    res.json(komentari);
  } catch (err) {
    next(err);
  }
};

// POST /api/rezervacije/doktor/pomjeri
export const pomjeriRezervaciju = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    if (!korisnikPayload) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    const idDoktor = korisnikPayload.doktorId;
    if (!idDoktor) {
      res.status(403).json({ poruka: "Nemate dozvolu." });
      return;
    }

    const idStareRezervacije = Number(req.body.idStareRezervacije);
    const idNovogTermina = Number(req.body.idNovogTermina);
    const korisnikId = korisnikPayload.id;

    const staraRezervacija = await prisma.rezervacije.findUnique({
      where: { id: idStareRezervacije },
      include: { termin: true, pacijent: { include: { korisnik: true } }, doktor: { include: { korisnik: true } } },
    });

    if (!staraRezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    if (staraRezervacija.idDoktor !== idDoktor) {
      res.status(403).json({ poruka: "Nemate dozvolu za ovu rezervaciju." });
      return;
    }

    const noviTermin = await prisma.termin.findUnique({ where: { id: idNovogTermina } });

    if (!noviTermin) {
      res.status(404).json({ poruka: "Novi termin nije pronađen." });
      return;
    }

    if (noviTermin.status !== "SLOBODAN") {
      res.status(409).json({ poruka: "Novi termin više nije slobodan." });
      return;
    }

    const lockKey = `termin:lock:${idNovogTermina}`;
    const lock = await redis.get(lockKey);
    if (!lock || lock !== String(korisnikId)) {
      res.status(409).json({ poruka: "Termin nije zaključan." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Otkaži staru rezervaciju i oslobodi stari termin
      await tx.rezervacije.update({
        where: { id: idStareRezervacije },
        data: { doktorOtkazao: true, datumOtkazivanja: new Date() },
      });
      await tx.termin.update({
        where: { id: staraRezervacija.idTermina },
        data: { status: "SLOBODAN" },
      });

      // Kreiraj novu rezervaciju
      await tx.rezervacije.create({
        data: {
          idTermina: idNovogTermina,
          idPacijent: staraRezervacija.idPacijent,
          idDoktor: idDoktor,
          komentar: "Termin pomjeren od strane doktora.",
          hitnost: false,
          doktorRezervisao: true,
          datumKreiranja: new Date(),
        },
      });

      // Zauzmi novi termin
      await tx.termin.update({
        where: { id: idNovogTermina },
        data: { status: "ZAKAZAN" },
      });
    });

    await redis.del(lockKey);
    io.emit("termin-azuriran", { doktorId: idDoktor, terminId: idNovogTermina });

    // Pošalji email obavijest
    try {
      await posaljiPotvrdurezerv({
        pacijentEmail: staraRezervacija.pacijent.korisnik.email,
        pacijentIme: staraRezervacija.pacijent.korisnik.ime,
        pacijentPrezime: staraRezervacija.pacijent.korisnik.prezime,
        doktorIme: staraRezervacija.doktor.korisnik.ime,
        doktorPrezime: staraRezervacija.doktor.korisnik.prezime,
        doktorSpecijalizacija: staraRezervacija.doktor.specijalizacija,
        datum: noviTermin.datum,
        vrijeme: noviTermin.vrijeme ?? 0,
        rezervacijaId: idStareRezervacije,
        hitnost: false,
        komentar: "Vaš termin je pomjeren na novi datum.",
      });
    } catch (emailErr) {
      console.error("Email nije poslan:", emailErr);
    }
    //da dode obavijest na waitlisti
    await obradiOtkazivanje(staraRezervacija.idTermina, staraRezervacija.idPacijent);
    res.status(200).json({ poruka: "Termin uspješno pomjeren." });
  } catch (err) {
    next(err);
  }
};

// kreiranje rezervacije od strane doktora
export const kreirajRezervacijuDoktor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idTermina = Number(req.body.idTermina);
    const idPacijent = Number(req.body.idPacijent);
    // posto doktor rezervise kada je on prijavljen uzimam doktorid iz jwt tokena
    const korisnikPayload = (req as any).korisnik;
    if (!korisnikPayload) {
      res.status(401).json({ poruka: "Niste prijavljeni." });
      return;
    }

    const idDoktor = korisnikPayload.doktorId;
    const idTipPregledaRaw = req.body.idTipPregleda;
    const idTipPregleda = idTipPregledaRaw === undefined || idTipPregledaRaw === null
      ? null : Number(idTipPregledaRaw);
    const komentar = typeof req.body.komentar === "string" ? req.body.komentar.trim() : "";
    const hitnost = req.body.hitnost === true || req.body.hitnost === "true";
    const korisnikId = korisnikPayload.id;

    if (!Number.isInteger(idTermina) || idTermina <= 0) {
      res.status(400).json({ poruka: "Nedostaje ispravan idTermina." });
      return;
    }

    if (!Number.isInteger(idPacijent) || idPacijent <= 0) {
      res.status(400).json({ poruka: "Nedostaje ispravan idPacijent." });
      return;
    }

    if (!idDoktor) {
      res.status(403).json({ poruka: "Nemate dozvolu za ovu akciju." });
      return;
    }

    const pacijent = await prisma.pacijent.findUnique({
      where: { id: idPacijent },
      include: { korisnik: true },
    });

    if (!pacijent) {
      res.status(404).json({ poruka: "Pacijent nije pronađen." });
      return;
    }

    const termin = await prisma.termin.findUnique({ where: { id: idTermina } });

    if (!termin) {
      res.status(404).json({ poruka: "Termin nije pronađen." });
      return;
    }

    const idDoktorTermina = termin.idDoktor;

    if (termin.status !== "SLOBODAN") {
      res.status(409).json({ poruka: "Termin više nije slobodan." });
      return;
    }

    const vrijemeTermina = izracunajVrijemeTermina(termin);
    if (vrijemeTermina.getTime() <= Date.now()) {
      res.status(400).json({ poruka: "Nevalidna rezervacija: ne možete rezervisati termin u prošlosti." });
      return;
    }

    const duplikat = await prisma.rezervacije.findFirst({
      where: { idPacijent: pacijent.id, idTermina, datumOtkazivanja: null },
    });

    if (duplikat) {
      res.status(409).json({ poruka: "Rezervacija za ovaj termin već postoji." });
      return;
    }

    const preklapanje = await prisma.rezervacije.findFirst({
      where: {
        idPacijent: pacijent.id,
        datumOtkazivanja: null,
        termin: {
          datum: termin.datum,
          vrijeme: termin.vrijeme,
        },
      },
    });

    if (preklapanje) {
      res.status(409).json({
        poruka: "Pacijent već ima zakazan pregled u isto vrijeme."
      });
      return;
    }

    const lockKey = `termin:lock:${idTermina}`;
    const lock = await redis.get(lockKey);
    if (!lock || lock !== String(korisnikId)) {
      res.status(409).json({ poruka: "Termin nije zaključan. Pokrenite proces ponovo." });
      return;
    }

    const file = (req as any).file;
    let nalazId: number | null = null;

    if (file) {
      const nalaz = await prisma.nalaz.create({
        data: {
          naziv: file.originalname,
          opis: komentar || null,
          dokumentPDF: file.buffer,
        },
      });
      nalazId = nalaz.id;
    }

    let rezervacija;
    try {
      rezervacija = await prisma.$transaction(async (tx) => {
        const nova = await tx.rezervacije.create({
          data: {
            idTermina,
            idPacijent: idPacijent,
            idDoktor: idDoktorTermina,
            komentar: komentar || null,
            hitnost,
            doktorRezervisao: true,
            datumKreiranja: new Date(),
            idTipPregleda,
          },
          include: {
            termin: true,
            pacijent: { include: { korisnik: true }},
            doktor: { include: {korisnik: true }},
          },
        });

        if (komentar) {
          await tx.komentar.create({
            data: {
              idRezervacije: nova.id,
              idKorisnik: korisnikPayload.id,
              tekst: komentar,
              jeDoktor: korisnikJeDoktor(korisnikPayload),
              datumKreiranja: nova.datumKreiranja,
            },
          });
        }

        if (nalazId) {
          await tx.historijaPregleda.create({
            data: {
              idPacijent: idPacijent,
              idDoktor: idDoktorTermina,
              idRezervacija: nova.id,
              idNalaz: nalazId,
              dijagnoza: "Nije unesena",
              terapija: "Nije unesena",
              biljeske: komentar || null,
            },
          });
        }

        await tx.rezervacijaSpecijalista.create({
          data: {
            idSpecijaliste: idDoktorTermina,
            idDoktorOpste: idDoktor,
            idRezervacije: nova.id,
            razlogPregleda: komentar || "Upućivanje od strane doktora",
          },
        });
        await tx.termin.update({ where: { id: idTermina }, data: { status: "ZAKAZAN" } });
        return nova;
      });
    } catch (err) {
      if (nalazId) {
        await prisma.nalaz.delete({ where: { id: nalazId } }).catch(() => {});
      }
      throw err;
    }

    io.emit("termin-azuriran", { doktorId: idDoktorTermina, terminId: idTermina });
    await redis.del(lockKey);

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
    } catch (emailErr) {
      console.error("Email NIJE poslan:", emailErr);
    }
    res.status(201).json(rezervacija);
  } catch (err) {
    next(err);
  }
};
