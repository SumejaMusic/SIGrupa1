import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import XLSX from "xlsx";

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

export const exportStatistikaCSV = async (req: Request, res: Response) => {
  try {
    const { period = "mjesec", datumOd, datumDo } = req.query;

    // ── Isti period logic kao getAnalitika ──
    const danas = new Date();
    danas.setHours(0, 0, 0, 0);

    let pocetakPerioda: Date;
    let krajPerioda: Date;

    if (period === "custom" && datumOd && datumDo) {
      pocetakPerioda = new Date(String(datumOd));
      krajPerioda = new Date(String(datumDo));
      krajPerioda.setHours(23, 59, 59, 999);
    } else if (period === "sedmica") {
      const dow = danas.getDay();
      const diffToMonday = dow === 0 ? -6 : 1 - dow;
      pocetakPerioda = new Date(danas);
      pocetakPerioda.setDate(danas.getDate() + diffToMonday);
      krajPerioda = new Date(pocetakPerioda);
      krajPerioda.setDate(pocetakPerioda.getDate() + 7);
    } else if (period === "danas") {
      pocetakPerioda = danas;
      krajPerioda = new Date(danas);
      krajPerioda.setDate(danas.getDate() + 1);
    } else {
      pocetakPerioda = new Date(danas.getFullYear(), danas.getMonth(), 1);
      krajPerioda = new Date(danas.getFullYear(), danas.getMonth() + 1, 0);
      krajPerioda.setHours(23, 59, 59, 999);
    }

    const termini = await prisma.termin.findMany({
      where: {
        datum: { gte: pocetakPerioda, lte: krajPerioda },
        status: { in: ["SLOBODAN", "ZAKAZAN", "POTVRDJEN", "OTKAZAN"] },
      },
      select: {
        status: true,
        doktor: {
          select: {
            id: true,
            korisnik: { select: { ime: true, prezime: true } },
            odjel: { select: { naziv: true } },
          },
        },
      },
    });

    // ── Agregacija po doktoru ──
    const doktoriMap: Record<number, {
      ime: string; prezime: string; odjel: string;
      slobodni: number; zakazani: number; otkazani: number; ukupno: number;
    }> = {};

    for (const t of termini) {
      const did = t.doktor.id;
      if (!doktoriMap[did]) {
        doktoriMap[did] = {
          ime: t.doktor.korisnik.ime,
          prezime: t.doktor.korisnik.prezime,
          odjel: t.doktor.odjel.naziv,
          slobodni: 0, zakazani: 0, otkazani: 0, ukupno: 0,
        };
      }
      doktoriMap[did].ukupno++;
      if (t.status === "SLOBODAN") doktoriMap[did].slobodni++;
      else if (t.status === "OTKAZAN") doktoriMap[did].otkazani++;
      else doktoriMap[did].zakazani++;
    }

    const podaci = Object.values(doktoriMap)
      .sort((a, b) => b.zakazani - a.zakazani)
      .map((d) => ({
        "Doktor": `Dr. ${d.ime} ${d.prezime}`,
        "Odjel": d.odjel,
        "Ukupno termina": d.ukupno,
        "Zakazanih": d.zakazani,
        "Slobodnih": d.slobodni,
        "Otkazanih": d.otkazani,
        "Iskorištenost (%)": d.ukupno > 0 ? Math.round((d.zakazani / d.ukupno) * 100) : 0,
      }));

    // ── Export kao XLSX ──
    const worksheet = XLSX.utils.json_to_sheet(podaci);
    worksheet["!cols"] = [
      { wch: 28 }, // Doktor
      { wch: 20 }, // Odjel
      { wch: 16 }, // Ukupno
      { wch: 12 }, // Zakazanih
      { wch: 12 }, // Slobodnih
      { wch: 12 }, // Otkazanih
      { wch: 18 }, // Iskorištenost
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Statistika");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const periodLabel = period === "custom"
      ? `${datumOd}_${datumDo}`
      : String(period);

    res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.header("Content-Disposition", `attachment; filename="statistika_${periodLabel}.xlsx"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška pri exportu." });
  }
};