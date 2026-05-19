// src/controllers/osobljeController.ts
//
// HTTP sloj — parsira req, validira format, poziva service, šalje response.
// Sva poslovna logika je u osobljeService.ts.
//
// Konvencija iz postojećeg koda:
//   - (req as any).korisnik = { id, uloga } — postavlja autentifikuj() middleware
//   - Greške sa .status i .poruka se obrađuju inline, ostale idu na next(err)

import { Request, Response, NextFunction } from "express";
import {
  getDnevniTerminiService,
  pretragaTerminaService,
  getDetaljiTerminaService,
  otkaziTerminService,
  kreirajTerminZaPacijentomService,
  dodajNalazService,
  getNalaziPacijentaService,
  getNalazPDFService,
  getOtkazaniTerminiService,
  getHitniTerminiService,
  getZavrseniPregledService,
  postaviHitnostService,
  getAllPacijentiService,
  getAllDoktoriService,
  getAllOdjeliService,
  getAllSobeService,
  getSlobodniTerminiDoktoraService,
} from "../osobljeService.js";

// Helper: dohvata ID prijavljenog korisnika iz req.korisnik (postavljeno od autentifikuj)
// ili iz x-test-korisnik-id headera koji se koristi u testovima (vidi app.ts test middleware)
function getKorisnikId(req: Request): number {
  return (req as any).korisnik?.id ?? Number(req.headers["x-test-korisnik-id"]);
}

// ─── 1. GET /api/osoblje/termini?datum=2026-05-17 ────────────────────────────
// Parsira datum iz query stringa. Ako nije poslan, koristi danas.
// Vraća listu rezervacija za taj dan sa svim uključenim podacima.

export async function getDnevniTermini(req: Request, res: Response, next: NextFunction) {
  try {
    const datumStr = req.query.datum as string | undefined;
    const datum = datumStr ? new Date(datumStr) : new Date();

    if (isNaN(datum.getTime())) {
      res.status(400).json({ poruka: "Neispravan format datuma. Koristite YYYY-MM-DD." });
      return;
    }

    const termini = await getDnevniTerminiService(datum);
    res.status(200).json(termini);
  } catch (err) {
    next(err);
  }
}

// ─── 2. GET /api/osoblje/termini/pretraga?ime=Amina ──────────────────────────
// Minimalno 2 karaktera da izbjegnemo prevelike upite koji vraćaju cijelu bazu.

export async function pretragaTermina(req: Request, res: Response, next: NextFunction) {
  try {
    const ime = (req.query.ime as string | undefined)?.trim();

    if (!ime || ime.length < 2) {
      res.status(400).json({
        poruka: "Parametar 'ime' je obavezan i mora imati najmanje 2 karaktera.",
      });
      return;
    }

    const termini = await pretragaTerminaService(ime);
    res.status(200).json(termini);
  } catch (err) {
    next(err);
  }
}

// ─── 3. GET /api/osoblje/termini/:id ─────────────────────────────────────────
// Detalji jedne rezervacije. Service vraća null ako ne postoji → 404.

export async function getDetaljiTermina(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ poruka: "Neispravan ID rezervacije." });
      return;
    }

    const rezervacija = await getDetaljiTerminaService(id);

    if (!rezervacija) {
      res.status(404).json({ poruka: "Rezervacija nije pronađena." });
      return;
    }

    res.status(200).json(rezervacija);
  } catch (err) {
    next(err);
  }
}

// ─── 4. PATCH /api/osoblje/termini/:id/otkazi ────────────────────────────────
// ACC kriterij: sistem ne smije dozvoliti slučajno otkazivanje jednim klikom.
// Frontend prikazuje confirm dijalog → šalje { potvrda: true }.
// Backend provjerava to polje — bez njega vraća 400.

export async function otkaziTermin(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ poruka: "Neispravan ID rezervacije." });
      return;
    }

    // Eksplicitna potvrda sprečava slučajno otkazivanje
    if (req.body.potvrda !== true) {
      res.status(400).json({
        poruka: "Otkazivanje nije potvrđeno. Pošaljite { potvrda: true } u tijelu zahtjeva.",
      });
      return;
    }

    const rezultat = await otkaziTerminService(id);
    res.status(200).json(rezultat);
  } catch (err: any) {
    // Greške iz service-a sa .status i .poruka vraćamo direktno
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
}

// ─── 5. POST /api/osoblje/termini ─────────────────────────────────────────────
// Body: { idDoktor, idPacijent, datum, vrijemeMinute, idTipPregleda?, komentar?, hitnost? }
// idPacijent = idKorisnik pacijenta (osoblje pronalazi pacijenta po ovom ID-u)
// vrijemeMinute = minuti od ponoći (9:00 = 540, 14:30 = 870)

export async function kreirajTerminZaPacijenta(req: Request, res: Response, next: NextFunction) {
  try {
    const { idTermina, idDoktor, idPacijent, idTipPregleda, komentar, hitnost } = req.body;

    if (!idTermina || !idDoktor || !idPacijent) {
      res.status(400).json({
        poruka: "Obavezna polja: idTermina, idDoktor, idPacijent.",
      });
      return;
    }

    const rezervacija = await kreirajTerminZaPacijentomService({
      idTermina: Number(idTermina),
      idDoktor: Number(idDoktor),
      idPacijent: Number(idPacijent),
      idTipPregleda: idTipPregleda ? Number(idTipPregleda) : undefined,
      komentar,
      hitnost: Boolean(hitnost),
    });

    res.status(201).json(rezervacija);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
}

// ─── 6. POST /api/osoblje/nalazi/:idHistorije ─────────────────────────────────
// Body: { naziv, opis?, fajl (base64 string), mimeType }
// Klijent čita fajl, konvertuje u base64 i šalje kao JSON.
// mimeType mora biti "application/pdf" — service baca 400 ako nije.

export async function dodajNalaz(req: Request, res: Response, next: NextFunction) {
  try {
    const idHistorije = Number(req.params.idHistorije);
    if (isNaN(idHistorije)) {
      res.status(400).json({ poruka: "Neispravan ID historije pregleda." });
      return;
    }

    const { naziv, opis, fajl, mimeType } = req.body;

    if (!naziv || !fajl || !mimeType) {
      res.status(400).json({
        poruka: "Obavezna polja: naziv, fajl (base64 string), mimeType.",
      });
      return;
    }

    const nalaz = await dodajNalazService(idHistorije, naziv, opis, fajl, mimeType);
    res.status(201).json(nalaz);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
}

// ─── 7. GET /api/osoblje/nalazi/pacijent/:idPacijenta ─────────────────────────
// Vraća listu metadata nalaza. PDF je dostupan kroz zasebnu rutu.

export async function getNalaziPacijenta(req: Request, res: Response, next: NextFunction) {
  try {
    const idPacijenta = Number(req.params.idPacijenta);
    if (isNaN(idPacijenta)) {
      res.status(400).json({ poruka: "Neispravan ID pacijenta." });
      return;
    }

    const nalazi = await getNalaziPacijentaService(idPacijenta);
    res.status(200).json(nalazi);
  } catch (err) {
    next(err);
  }
}

// ─── 8. GET /api/osoblje/nalazi/:id/pdf ──────────────────────────────────────
// Content-Disposition: inline → preglednik otvara PDF u novom tabu
// umjesto da ga skida (ACC kriterij: "otvori u novom tabu preglednika").

export async function getNalazPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ poruka: "Neispravan ID nalaza." });
      return;
    }

    const nalaz = await getNalazPDFService(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${nalaz.naziv}.pdf"`);
    // dokumentPDF je Prisma Bytes = Buffer u Node.js — send() prihvata Buffer direktno
    res.send(nalaz.dokumentPDF);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
}

// ─── 9. GET /api/osoblje/termini/otkazani?datum=2026-05-17 ────────────────────
// datum je opcionalan — bez njega vraća sve otkazane termine (svi datumi).

export async function getOtkazaniTermini(req: Request, res: Response, next: NextFunction) {
  try {
    const datumStr = req.query.datum as string | undefined; // Očekujemo npr. "17-05-2026"
    let datum: Date | undefined;

    if (datumStr) {
      // 1. Provjera formata pomoću Regularnog Izraza (Regex) za DD-MM-YYYY
      const regexFormat = /^\d{2}-\d{2}-\d{4}$/;
      if (!regexFormat.test(datumStr)) {
        res.status(400).json({ poruka: "Neispravan format datuma. Koristite DD-MM-YYYY." });
        return;
      }

      // 2. Rastavljanje stringa na dijelove: "17", "05", "2026"
      const [dan, mjesec, godina] = datumStr.split("-").map(Number);

      // 3. Kreiranje validnog JavaScript Date objekta
      // PAŽNJA: Mjeseci u JS-u idu od 0 do 11 (Januar je 0, Maj je 4), zato oduzimamo 1!
      datum = new Date(godina, mjesec - 1, dan);

      // 4. Konačna sigurnosna provjera da li je to stvarni datum (npr. da neko ne pošalje 32-02-2026)
      if (isNaN(datum.getTime())) {
        res.status(400).json({ poruka: "Uneseni datum ne postoji u kalendaru." });
        return;
      }
    }

    const termini = await getOtkazaniTerminiService(datum);
    res.status(200).json(termini);
  } catch (err) {
    next(err);
  }
}

// ─── 10. GET /api/osoblje/termini/hitni ───────────────────────────────────────
// Vraća sve aktivne hitne rezervacije, sortirane po datumu termina.

export async function getHitniTermini(req: Request, res: Response, next: NextFunction) {
  try {
    const termini = await getHitniTerminiService();
    res.status(200).json(termini);
  } catch (err) {
    next(err);
  }
}

// ─── 11. GET /api/osoblje/termini/zavrseni?idPacijenta=5 ─────────────────────
// idPacijenta je opcionalan — bez njega vraća sve završene preglede.

export async function getZavrseniPregledi(req: Request, res: Response, next: NextFunction) {
  try {
    const idPacijentaStr = req.query.idPacijenta as string | undefined;
    let idPacijenta: number | undefined;

    if (idPacijentaStr !== undefined) {
      idPacijenta = Number(idPacijentaStr);
      if (isNaN(idPacijenta)) {
        res.status(400).json({ poruka: "Neispravan ID pacijenta." });
        return;
      }
    }

    const pregledi = await getZavrseniPregledService(idPacijenta);
    res.status(200).json(pregledi);
  } catch (err) {
    next(err);
  }
}

// ─── 12. PATCH /api/osoblje/termini/:id/hitnost ───────────────────────────────
// Body: { hitnost: true | false }
// Naknadna promjena hitnosti rezervacije — ne smije biti otkazana ili završena.

export async function postaviHitnost(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ poruka: "Neispravan ID rezervacije." });
      return;
    }

    if (typeof req.body.hitnost !== "boolean") {
      res.status(400).json({
        poruka: "Polje 'hitnost' je obavezno i mora biti boolean (true ili false).",
      });
      return;
    }

    const rezervacija = await postaviHitnostService(id, req.body.hitnost);
    res.status(200).json(rezervacija);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
}
export async function getAllPacijenti(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await getAllPacijentiService());
  } catch (err) { next(err); }
}

export async function getAllDoktori(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await getAllDoktoriService());
  } catch (err) { next(err); }
}

export async function getAllOdjeli(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await getAllOdjeliService());
  } catch (err) { next(err); }
}

export async function getAllSobe(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await getAllSobeService());
  } catch (err) { next(err); }
}
import { getAllTerminiService } from "../osobljeService.js"; // dodaj u postojeći import
import { prisma } from "../lib/prisma.js";

export async function getAllTermini(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await getAllTerminiService());
  } catch (err) { next(err); }
}
export async function getSlobodniTerminiDoktora(req: Request, res: Response, next: NextFunction) {
  try {
    const idDoktor = Number(req.params.idDoktor);
    const datum = req.query.datum as string;
    if (!datum) {
      res.status(400).json({ poruka: "Parametar 'datum' je obavezan." });
      return;
    }
    const termini = await getSlobodniTerminiDoktoraService(idDoktor, datum);
    res.status(200).json(termini);
  } catch (err) { next(err); }
}