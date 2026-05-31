import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Parser } from "json2csv";

// ── Registrovani korisnici po ulogama ──────────────────────────
export const getKorisniciPoUlogama = async (req: Request, res: Response) => {
  try {
    const stats = await prisma.korisnik.groupBy({
      by: ["uloga"],
      _count: { uloga: true },
    });

    // Formatiramo da bude čitljivije
    const rezultat = stats.map((s) => ({
      uloga: s.uloga,
      broj: s._count.uloga,
    }));

    res.json(rezultat);
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

// ── Zakazani termini po doktoru + slobodni termini ─────────────
export const getTerminiStats = async (req: Request, res: Response) => {
  try {
    const slobodni = await prisma.termin.count({
      where: { status: "SLOBODAN" },
    });

    // Svi termini grupisani po doktoru (sve statuse)
    const sviPoDoktoru = await prisma.termin.groupBy({
      by: ["idDoktor"],
      _count: { id: true },
    });

    const zakazaniPoDoktoru = await prisma.termin.groupBy({
      by: ["idDoktor"],
      _count: { id: true },
      where: { status: { in: ["ZAKAZAN", "POTVRDJEN"] } },
    });

    const slobodniPoDoktoru = await prisma.termin.groupBy({
      by: ["idDoktor"],
      _count: { id: true },
      where: { status: "SLOBODAN" },
    });

    // Dohvati sve doktore koji imaju termine
    const sviDoktoriIds = [...new Set(sviPoDoktoru.map((z) => z.idDoktor))];
    const doktori = await prisma.doktor.findMany({
      where: { id: { in: sviDoktoriIds } },
      select: {
        id: true,
        korisnik: { select: { ime: true, prezime: true } },
        odjel: { select: { naziv: true } },
      },
    });

    const doktoriMap = Object.fromEntries(doktori.map((d) => [d.id, d]));
    const zakazaniMap = Object.fromEntries(zakazaniPoDoktoru.map((z) => [z.idDoktor, z._count.id]));
    const slobodniMap = Object.fromEntries(slobodniPoDoktoru.map((z) => [z.idDoktor, z._count.id]));
    const ukupnoMap = Object.fromEntries(sviPoDoktoru.map((z) => [z.idDoktor, z._count.id]));

    const rezultat = sviDoktoriIds.map((id) => ({
      doktorId: id,
      ime: doktoriMap[id]?.korisnik.ime ?? "?",
      prezime: doktoriMap[id]?.korisnik.prezime ?? "?",
      odjel: doktoriMap[id]?.odjel.naziv ?? "?",
      ukupno: ukupnoMap[id] ?? 0,
      brojZakazanih: zakazaniMap[id] ?? 0,
      brojSlobodnih: slobodniMap[id] ?? 0,
    })).sort((a, b) => b.brojZakazanih - a.brojZakazanih);

    res.json({ slobodni, zakazaniPoDoktoru: rezultat });
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

// ── Export termina u CSV za odabrani period ────────────────────
export const exportTerminiCSV = async (req: Request, res: Response) => {
  try {
    const { od, do: do_ } = req.query;

    if (!od || !do_) {
      res.status(400).json({ poruka: "Parametri 'od' i 'do' su obavezni." });
      return;
    }

    const termini = await prisma.rezervacije.findMany({
      where: {
        datumKreiranja: {
          gte: new Date(String(od)),
          lte: new Date(String(do_)),
        },
        datumOtkazivanja: null,
      },
      select: {
        id: true,
        datumKreiranja: true,
        hitnost: true,
        zavrseno: true,
        termin: { select: { datum: true, vrijeme: true, status: true } },
        pacijent: {
          select: { korisnik: { select: { ime: true, prezime: true } } },
        },
        doktor: {
          select: {
            korisnik: { select: { ime: true, prezime: true } },
            odjel: { select: { naziv: true } },
          },
        },
      },
    });

    const podaci = termini.map((r) => ({
      ID: r.id,
      Datum_termina: r.termin.datum.toISOString().split("T")[0],
      Vrijemie_termina: r.termin.vrijeme,
      Status_termina: r.termin.status,
      Pacijent: `${r.pacijent.korisnik.ime} ${r.pacijent.korisnik.prezime}`,
      Doktor: `${r.doktor.korisnik.ime} ${r.doktor.korisnik.prezime}`,
      Odjel: r.doktor.odjel.naziv,
      Hitnost: r.hitnost ? "Da" : "Ne",
      Zavrseno: r.zavrseno ? "Da" : "Ne",
      Datum_kreiranja: r.datumKreiranja.toISOString().split("T")[0],
    }));

    const parser = new Parser();
    const csv = parser.parse(podaci);

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header(
      "Content-Disposition",
      `attachment; filename="termini_${od}_${do_}.csv"`
    );
    res.send("\uFEFF" + csv); // BOM za Excel da čita UTF-8
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška pri exportu." });
  }
};