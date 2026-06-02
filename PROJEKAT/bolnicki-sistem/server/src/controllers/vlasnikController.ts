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
function formatujDatumVrijeme(iso: Date | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;

  // +2h korekcija za lokalnu zonu
  const lok = new Date(d.getTime() + 2 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    `${pad(lok.getUTCDate())}.${pad(lok.getUTCMonth() + 1)}.${lok.getUTCFullYear()} ` +
    `u ${pad(lok.getUTCHours())}:${pad(lok.getUTCMinutes())}`
  );
}
export const getTerminiDetalji = async (req: Request, res: Response) => {
  try {
    const {
      stranica = "1",
      limit    = "20",
      status,
      datumOd,
      datumDo,
    } = req.query;

    const skip = (Number(stranica) - 1) * Number(limit);
    const take = Number(limit);

    // ── Gdje klauzula ────────────────────────────────────────
    const where: any = {};

    // Filtriranje po statusu
   if (status && String(status).trim()) {
  const statusi = String(status).split(",").map((s) => s.trim()).filter(Boolean);

  if (statusi.includes("OTKAZAN")) {
    // Otkazani = imaju rezervaciju sa datumOtkazivanja
    where.rezervacije = {
      some: { datumOtkazivanja: { not: null } }
    };
  } else if (statusi.includes("SLOBODAN")) {
    // Slobodni = status SLOBODAN I nemaju nijednu rezervaciju
    where.status = "SLOBODAN";
    where.rezervacije = { none: {} };
  } else {
    // Zakazani/Potvrđeni = status je ZAKAZAN ili POTVRDJEN I nemaju otkazanu rezervaciju
    where.status = statusi.length === 1 ? statusi[0] : { in: statusi };
    where.rezervacije = {
      none: { datumOtkazivanja: { not: null } }
    };
  }
}

    if (datumOd || datumDo) {
      where.datum = {};
      if (datumOd) where.datum.gte = new Date(String(datumOd));
      if (datumDo) where.datum.lte = new Date(String(datumDo));
    }

    // ── Upit u bazu ──────────────────────────────────────────
    const [termini, ukupno] = await Promise.all([
      prisma.termin.findMany({
        where,
        skip,
        take,
       orderBy: [{ datum: "desc" }, { vrijeme: "desc" }],
        //orderBy: [{ datum: "desc" }],
        select: {
          id:      true,
          datum:   true,
          vrijeme: true, // minute od ponoći
          status:  true,
          doktor: {
            select: {
              korisnik: { select: { ime: true, prezime: true } },
              odjel:    { select: { naziv: true } },
              soba:     { select: { naziv: true } },
            },
          },
          rezervacije: {
            orderBy: { datumKreiranja: "desc" }, // Najnovije akcije na vrhu
            take: 5,
            select: {
              id:               true,
              datumKreiranja:   true,
              datumOtkazivanja: true,
              zavrseno:         true,
              pacijent: {
                select: {
                  korisnik: {
                    select: { ime: true, prezime: true, email: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.termin.count({ where }),
    ]);

    // ── Transformacija i Popravka Vremena (+2 sata) ───────────
    const rezultat = termini.map((t) => {
      // Tražimo bilo koju rezervaciju koja u sebi ima popunjen datum otkazivanja
      const otkazanaRez = t.rezervacije.find((r) => r.datumOtkazivanja != null) ?? null;
      // Aktivna rezervacija je ona koja nije otkazana
      const aktivnaRez = t.rezervacije.find((r) => r.datumOtkazivanja == null) ?? null;

      // Određivanje stvarnog statusa: Ako postoji otkazana rezervacija, primarni status za ovaj pregled postaje OTKAZAN
      const stvarniStatus = 
  t.status === "SLOBODAN" && !otkazanaRez ? "SLOBODAN" 
  : otkazanaRez ? "OTKAZAN" 
  : t.status;

      // Prikazujemo detalje klijenta (prednost ima aktivni klijent, ako nema, prikazujemo onog ko je otkazao)
      const relevantnaRez = aktivnaRez ?? otkazanaRez;

      // --- Popravka kašnjenja od 2 sata (Konverzija minuta u HH:MM za našu zonu) ---
      // Ako UTC kasni 2 sata, dodajemo 120 minuta na minute iz baze
      let lokalneMinute = t.vrijeme + 120; 
      if (lokalneMinute >= 1440) lokalneMinute -= 1440; // Reset ako pređe ponoć

      const sati = Math.floor(lokalneMinute / 60);
      const minuti = lokalneMinute % 60;
      const formatiranoVrijeme = `${String(sati).padStart(2, "0")}:${String(minuti).padStart(2, "0")}`;

      // --- Formatiranje datuma u DD.MM.YYYY ---
      const d = new Date(t.datum);
      const dan = String(d.getDate()).padStart(2, "0");
      const mjesec = String(d.getMonth() + 1).padStart(2, "0");
      const godina = d.getFullYear();
      const formatiranDatum = `${dan}.${mjesec}.${godina}.`;

      return {
        terminId:       t.id,
        datum:          formatiranDatum,   // Vraća "01.06.2026."
        vrijemePrikaz:  formatiranoVrijeme, // Vraća "14:30" (naše lokalno vrijeme)
        status:         stvarniStatus,     // Garantovano "OTKAZAN" u filteru ako je otkazano
        doktorIme:      t.doktor.korisnik.ime,
        doktorPrezime:  t.doktor.korisnik.prezime,
        odjel:          t.doktor.odjel.naziv,
        soba:           t.doktor.soba?.naziv ?? null,

        // Podaci o zakazivanju
        rezervacijaId:  relevantnaRez?.id ?? null,
        zakazaoIme:     relevantnaRez?.pacijent.korisnik.ime     ?? null,
        zakazaoPrezime: relevantnaRez?.pacijent.korisnik.prezime ?? null,
        zakazaoEmail:   relevantnaRez?.pacijent.korisnik.email   ?? null,
        datumKreiranja: formatujDatumVrijeme(relevantnaRez?.datumKreiranja ?? null),
datumOtkazivanja: formatujDatumVrijeme(otkazanaRez?.datumOtkazivanja ?? null),
        otkazaoIme:        otkazanaRez?.pacijent.korisnik.ime     ?? null,
        otkazaoPrezime:    otkazanaRez?.pacijent.korisnik.prezime ?? null,
      };
    });

    res.json({
      termini: rezultat,
      paginacija: {
        ukupno,
        stranica: Number(stranica),
        limit:    take,
        ukupnoStranica: Math.ceil(ukupno / take),
      },
    });
  } catch (error: any) {
    console.error("getTerminiDetalji greška:", error);
    res.status(500).json({ poruka: error?.message ?? "Greška pri dohvatanju detalja termina." });
  }
};
// ============================================================
//  DODATI U ROUTES FAJL (npr. vlasnikRoutes.ts):
// ============================================================
//
//  import { getTerminiDetalji } from "../controllers/adminController.js";
//
//  router.get("/termini-detalji", getTerminiDetalji);
//
// ============================================================






// ============================================================
//  GET /api/vlasnik/sale-occupancy
//  Vraca sve sobe sa brojem rezervacija i doktorima koji ih koriste.
//
//  NAPOMENA: Broji rezervacije na dva načina:
//    1. Direktno: Rezervacije.idSobe = soba.id
//    2. Kroz doktore: termini doktora koji imaju idSobe = soba.id,
//       za slučaj da idSobe nije uvijek popunjen na rezervaciji.
//
//  "Aktivnih" = termin.status === "ZAKAZAN" (jedini pouzdani signal)
// ============================================================
export const getSaleOccupancy = async (req: Request, res: Response) => {
  try {
    const sobe = await prisma.soba.findMany({
      orderBy: [{ sprat: "asc" }, { naziv: "asc" }],
      include: {
        doktori: {
          select: {
            id: true,
            korisnik: { select: { ime: true, prezime: true } },
            odjel:    { select: { naziv: true } },
            termini: {
              select: {
                id: true,
                status: true,
                rezervacije: {
                  select: {
                    id: true,
                    zavrseno: true,
                    datumOtkazivanja: true,
                  },
                },
              },
            },
          },
        },
        rezervacije: {
          select: {
            id: true,
            zavrseno: true,
            datumOtkazivanja: true,
            termin: { select: { status: true } },
          },
        },
      },
    });

    const rezultat = sobe.map((s) => {
      // 1. Mapiramo direktne rezervacije u jedinstven format
      const direktne = s.rezervacije.map((r) => ({
        id: r.id,
        zavrseno: r.zavrseno,
        datumOtkazivanja: r.datumOtkazivanja,
        statusTermina: r.termin?.status ?? "NEPOZNATO",
      }));

      // Set za praćenje duplikata po ID-u
      const mapiraneRezervacije = new Map<number, typeof direktne[0]>();
      direktne.forEach(r => mapiraneRezervacije.set(r.id, r));

      // 2. Dodajemo indirektne rezervacije preko doktora (ako već nisu dodate)
      s.doktori.forEach((d) => {
        d.termini.forEach((t) => {
          t.rezervacije.forEach((r) => {
            if (!mapiraneRezervacije.has(r.id)) {
              mapiraneRezervacije.set(r.id, {
                id: r.id,
                zavrseno: r.zavrseno,
                datumOtkazivanja: r.datumOtkazivanja,
                statusTermina: t.status, // Uzimamo status sa termina
              });
            }
          });
        });
      });

      // Pretvaramo mapu nazad u čist niz jedinstvenih rezervacija
      const sveRez = Array.from(mapiraneRezervacije.values());

      // 3. Računanje statistike (Precizno filtriranje)
      
      // Otkazane: imaju datum otkazivanja ILI im je termin u statusu OTKAZAN
      const otkazanih = sveRez.filter(
        (r) => r.datumOtkazivanja != null || r.statusTermina === "OTKAZAN"
      ).length;

      // Završene: završeno je true, a nisu otkazane
      const zavrsenih = sveRez.filter(
        (r) => r.zavrseno && r.datumOtkazivanja == null && r.statusTermina !== "OTKAZAN"
      ).length;

      // Aktivne: Nisu završene, nisu otkazane, a status je ZAKAZAN ili POTVRDJEN (kako frontend traži!)
      const aktivnih = sveRez.filter(
        (r) =>
          !r.zavrseno &&
          r.datumOtkazivanja == null &&
          (r.statusTermina === "ZAKAZAN" || r.statusTermina === "POTVRDJEN")
      ).length;

      // Ukupno je zbir aktivnih + završenih + otkazanih (Garantuje matematičku tačnost na UI)
      const ukupnoRezervacija = aktivnih + zavrsenih + otkazanih;

      return {
        sobaId:     s.id,
        naziv:      s.naziv,
        tip:        s.tip,
        sprat:      s.sprat,
        kapacitet:  s.kapacitet,
        statusSobe: s.statusSobe,
        doktori: s.doktori.map((d) => ({
          ime:     d.korisnik.ime,
          prezime: d.korisnik.prezime,
          odjel:   d.odjel.naziv,
        })),
        ukupnoRezervacija,
        aktivnih,
        zavrsenih,
        otkazanih,
      };
    });

    res.json(rezultat);
  } catch (error: any) {
    console.error("getSaleOccupancy greška:", error);
    res.status(500).json({ poruka: error?.message ?? "Greška pri dohvatanju soba." });
  }
};

// ============================================================
//  DODATI U vlasnikRoutes.ts:
//
//  import { getSaleOccupancy } from "../controllers/vlasnikController.js";
//  router.get("/sale-occupancy", getSaleOccupancy);
// ============================================================

export const sakrijiRecenziju = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recenzija = await prisma.recenzija.findUnique({
      where: { id: Number(id) },
    });

    if (!recenzija) {
      return res.status(404).json({ poruka: "Recenzija nije pronađena." });
    }

    if (recenzija.sakriven) {
      return res.status(400).json({ poruka: "Recenzija je već sakrivena." });
    }

    await prisma.recenzija.update({
      where: { id: Number(id) },
      data: {
        sakriven: true,
        sakrivenAt: new Date(),
        komentar: null, // briše tekst, ocjena ostaje
      },
    });

    res.json({ poruka: "Recenzija uspješno sakrivena." });
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};
export const getRecenzije = async (req: Request, res: Response) => {
  try {
    const { stranica = "1", limit = "20", samo_sa_komentarom } = req.query;
    const skip = (Number(stranica) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (samo_sa_komentarom === "true") {
      where.komentar = { not: null };
    }

    const [recenzije, ukupno] = await Promise.all([
      prisma.recenzija.findMany({
        where,
        skip,
        take,
        orderBy: { kreiranoAt: "desc" },
        select: {
          id: true,
          ocjena: true,
          komentar: true,
          sakriven: true,
          sakrivenAt: true,
          kreiranoAt: true,
          rezervacija: {
            select: {
              pacijent: {
                select: {
                  korisnik: { select: { ime: true, prezime: true } },
                },
              },
              doktor: {
                select: {
                  korisnik: { select: { ime: true, prezime: true } },
                  odjel: { select: { naziv: true } },
                },
              },
            },
          },
        },
      }),
      prisma.recenzija.count({ where }),
    ]);

    res.json({
      recenzije,
      paginacija: {
        ukupno,
        stranica: Number(stranica),
        limit: take,
        ukupnoStranica: Math.ceil(ukupno / take),
      },
    });
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};