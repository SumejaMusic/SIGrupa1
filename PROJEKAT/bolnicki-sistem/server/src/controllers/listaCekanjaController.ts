import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import {
  prijaviSeNaListuCekanja,
  potvrdiWaitlistTermin,
  odbijWaitlistTermin,
  otkaziCekanje,
} from "../listaCekanjaService.js";
import { redis } from "../lib/redis.js";

// POST /api/lista-cekanja
export const prijavaNaListu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    const pacijent = await prisma.pacijent.findFirst({
      where: { idKorisnik: korisnikPayload.id }
    });

    if (!pacijent) {
      res.status(404).json({ poruka: "Pacijent nije pronađen." });
      return;
    }

    const { doktorId, zeleniDatum, prioritet } = req.body;

    if (!doktorId || !zeleniDatum) {
      res.status(400).json({ poruka: "doktorId i zeleniDatum su obavezni." });
      return;
    }

    const datum = new Date(zeleniDatum);
    datum.setUTCHours(0, 0, 0, 0);

    // Prioritet se određuje isključivo iz baze — pacijent ne bira
const stvarniPrioritet = pacijent.hronicniBolesnik
  ? "HRONICNI_BOLESNIK"
  : "NORMALAN";

const zapis = await prijaviSeNaListuCekanja(
  pacijent.id,
  Number(doktorId),
  datum,
  stvarniPrioritet
);

    res.status(201).json({ poruka: "Uspješno prijavljeni na listu čekanja.", zapis });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    // Prisma unique constraint — već na listi
    if (err.code === "P2002") {
      res.status(409).json({ poruka: "Već ste na listi čekanja za taj dan i doktora." });
      return;
    }
    next(err);
  }
};

// POST /api/lista-cekanja/:id/potvrdi
export const potvrdiTermin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    const pacijent = await prisma.pacijent.findFirst({
      where: { idKorisnik: korisnikPayload.id }
    });

    if (!pacijent) {
      res.status(404).json({ poruka: "Pacijent nije pronađen." });
      return;
    }

    const rezervacija = await potvrdiWaitlistTermin(
      Number(req.params.id),
      pacijent.id
    );

    res.json({ poruka: "Termin uspješno zakazan!", rezervacija });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
};

// POST /api/lista-cekanja/:id/odbij
export const odbijTermin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    const pacijent = await prisma.pacijent.findFirst({
      where: { idKorisnik: korisnikPayload.id }
    });

    if (!pacijent) {
      res.status(404).json({ poruka: "Pacijent nije pronađen." });
      return;
    }

    await odbijWaitlistTermin(Number(req.params.id), pacijent.id);
    res.json({ poruka: "Termin odbijen. Ostajete u listi čekanja." });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
};

// DELETE /api/lista-cekanja/:id
export const otkazivanjeIzListe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    const pacijent = await prisma.pacijent.findFirst({
      where: { idKorisnik: korisnikPayload.id }
    });

    if (!pacijent) {
      res.status(404).json({ poruka: "Pacijent nije pronađen." });
      return;
    }

    await otkaziCekanje(Number(req.params.id), pacijent.id);
    res.json({ poruka: "Uspješno ste se uklonili sa liste čekanja." });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ poruka: err.poruka });
      return;
    }
    next(err);
  }
};

// GET /api/lista-cekanja/moja
export const mojaListaCekanja = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const korisnikPayload = (req as any).korisnik;
    const pacijent = await prisma.pacijent.findFirst({
      where: { idKorisnik: korisnikPayload.id }
    });

    if (!pacijent) {
      res.status(404).json({ poruka: "Pacijent nije pronađen." });
      return;
    }

    const lista = await prisma.listaCekanja.findMany({
      where: {
        idPacijent: pacijent.id,
        status: { in: ["CEKA", "OBAVIJESTEN"] }
      },
      include: {
        doktor: {
          include: { korisnik: { select: { ime: true, prezime: true } } }
        }
      },
      orderBy: { datumZahtjeva: "asc" }
    });

    // Za svaki OBAVIJESTEN zapis dohvati termin iz Redisa
    const listaObogacena = await Promise.all(
      lista.map(async (z) => {
        if (z.status !== "OBAVIJESTEN") return { ...z, termin: null };

        const terminIdStr = await redis.get(`waitlist:offer:${z.id}`);
        if (!terminIdStr) return { ...z, termin: null };

        const termin = await prisma.termin.findUnique({
          where: { id: Number(terminIdStr) },
          select: { vrijeme: true, datum: true }
        });

        return { ...z, termin: termin ?? null };
      })
    );

    res.json(listaObogacena);
  } catch (err) {
    next(err);
  }
};