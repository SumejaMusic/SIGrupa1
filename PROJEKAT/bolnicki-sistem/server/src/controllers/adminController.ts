import { Request, Response } from "express";
import crypto from "crypto";
import { kreirajAuditLog } from "../lib/auditLog.js";
import { Uloga } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { posaljiObavijestIzuzetak, posaljiObavijestDoktorNedostupan } from "../emailService.js";


//const prisma = new PrismaClient();

// ============================================================
//  KORISNICI — CRUD + upravljanje ulogama
// ============================================================

export const getSviKorisnici = async (req: Request, res: Response) => {
  try {
    const {
      stranica = "1",
      limit = "15",
      pretraga,
      uloga,
      zakljucan,
    } = req.query;

    const skip = (Number(stranica) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (pretraga) {
      where.OR = [
        { ime: { contains: String(pretraga), mode: "insensitive" } },
        { prezime: { contains: String(pretraga), mode: "insensitive" } },
        { email: { contains: String(pretraga), mode: "insensitive" } },
      ];
    }

    if (uloga && Object.values(Uloga).includes(uloga as Uloga)) {
      where.uloga = uloga as Uloga;
    }

    if (zakljucan === "true") {
      where.nalogZakljucan = true;
    } else if (zakljucan === "false") {
      where.nalogZakljucan = false;
    }

    const [korisnici, ukupno] = await Promise.all([
      prisma.korisnik.findMany({
        where,
        skip,
        take,
        orderBy: { datumRegistracije: "desc" },
        select: {
          id: true,
          ime: true,
          prezime: true,
          email: true,
          brojTelefona: true,
          uloga: true,
          datumRegistracije: true,
          nalogZakljucan: true,
          emailVerifikovan: true,
          brojNeuspjelihPrijava: true,
        },
      }),
      prisma.korisnik.count({ where }),
    ]);

    res.json({
      korisnici,
      paginacija: {
        ukupno,
        stranica: Number(stranica),
        limit: take,
        ukupnoStranica: Math.ceil(ukupno / take),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri dohvatanju korisnika." });
  }
};

export const getKorisnikById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const korisnik = await prisma.korisnik.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        ime: true,
        prezime: true,
        email: true,
        brojTelefona: true,
        datumRodjenja: true,
        uloga: true,
        datumRegistracije: true,
        nalogZakljucan: true,
        emailVerifikovan: true,
        brojNeuspjelihPrijava: true,
        vrijemeZakljucavanja: true,
        pacijentProfile: {
          select: {
            id: true,
            hronicniBolesnik: true,
          },
        },
        doktorProfile: {
          select: {
            id: true,
            specijalizacija: true,
            brojLicence: true,
            trajanjePregleda: true,
            brojPregleda: true,
            odjel: { select: { id: true, naziv: true } },
            soba: { select: { id: true, naziv: true } },
          },
        },
        osobljeProfile: {
          select: {
            id: true,
            pozicija: true,
            radnoVrijeme: true,
            odjel: { select: { id: true, naziv: true } },
          },
        },
      },
    });

    if (!korisnik) {
      res.status(404).json({ poruka: "Korisnik nije pronađen." });
      return;
    }

    res.json(korisnik);
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri dohvatanju korisnika." });
  }
};

export const updateKorisnik = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).korisnik.id;
    const { ime, prezime, email, brojTelefona, datumRodjenja, profilPodaci } = req.body;

    const postojeci = await prisma.korisnik.findUnique({
      where: { id: Number(id) },
    });

    if (!postojeci) {
      res.status(404).json({ poruka: "Korisnik nije pronađen." });
      return;
    }

    if (email && email !== postojeci.email) {
      const emailZauzet = await prisma.korisnik.findUnique({
        where: { email },
      });
      if (emailZauzet) {
        res.status(409).json({ poruka: "Email je već u upotrebi." });
        return;
      }
    }

    const azurirani = await prisma.$transaction(async (tx) => {
      const result = await tx.korisnik.update({
        where: { id: Number(id) },
        data: {
          ...(ime && { ime }),
          ...(prezime && { prezime }),
          ...(email && { email }),
          ...(brojTelefona !== undefined && { brojTelefona }),
          ...(datumRodjenja !== undefined && { datumRodjenja: datumRodjenja ? new Date(datumRodjenja) : null }),
        },
        select: {
          id: true,
          ime: true,
          prezime: true,
          email: true,
          brojTelefona: true,
          uloga: true,
        },
      });

      if (profilPodaci) {
        if (postojeci.uloga === Uloga.DOKTOR) {
          await tx.doktor.update({
            where: { idKorisnik: Number(id) },
            data: {
              ...(profilPodaci.specijalizacija && { specijalizacija: String(profilPodaci.specijalizacija) }),
              ...(profilPodaci.brojLicence !== undefined && { brojLicence: Number(profilPodaci.brojLicence) }),
              ...(profilPodaci.idOdjela !== undefined && { idOdjela: Number(profilPodaci.idOdjela) }),
              ...(profilPodaci.trajanjePregleda !== undefined && { trajanjePregleda: Number(profilPodaci.trajanjePregleda) }),
            },
          });
        } else if (postojeci.uloga === Uloga.MEDICINSKO_OSOBLJE) {
          await tx.mediciskoOsoblje.update({
            where: { idKorisnik: Number(id) },
            data: {
              ...(profilPodaci.pozicija && { pozicija: String(profilPodaci.pozicija) }),
              ...(profilPodaci.idOdjel !== undefined && { idOdjel: Number(profilPodaci.idOdjel) }),
              ...(profilPodaci.radnoVrijeme !== undefined && { radnoVrijeme: Number(profilPodaci.radnoVrijeme) }),
            },
          });
        } else if (postojeci.uloga === Uloga.PACIJENT) {
          await tx.pacijent.update({
            where: { idKorisnik: Number(id) },
            data: {
              ...(profilPodaci.hronicniBolesnik !== undefined && { hronicniBolesnik: Boolean(profilPodaci.hronicniBolesnik) }),
            },
          });
        }
      }

      await kreirajAuditLog(
        {
          idKorisnika: adminId,
          tipAkcije: "UPDATE",
          izmenjenaTabela: "Korisnik",
          stariPodaci: {
            ime: postojeci.ime,
            prezime: postojeci.prezime,
            email: postojeci.email,
            brojTelefona: postojeci.brojTelefona,
          },
          noviPodaci: { ime, prezime, email, brojTelefona, profilPodaci },
          ipAdresa: req.ip,
        },
        tx
      );

      return result;
    });

    res.json({ poruka: "Korisnik uspješno ažuriran.", korisnik: azurirani });
  } catch (error: any) {
    console.error("updateKorisnik error:", error);
    const poruka = error?.code === "P2002"
      ? `Jedinstvenost narušena: ${error?.meta?.target ?? "nepoznato polje"} već postoji.`
      : error?.code === "P2025"
      ? "Profil korisnika nije pronađen za ažuriranje."
      : error?.message ?? "Greška pri ažuriranju korisnika.";
    res.status(500).json({ poruka });
  }
};

export const deleteKorisnik = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).korisnik.id;

    if (Number(id) === adminId) {
      res.status(400).json({ poruka: "Ne možete obrisati vlastiti nalog." });
      return;
    }

    const korisnik = await prisma.korisnik.findUnique({
      where: { id: Number(id) },
      select: { id: true, ime: true, prezime: true, email: true, uloga: true },
    });

    if (!korisnik) {
      res.status(404).json({ poruka: "Korisnik nije pronađen." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.korisnik.delete({ where: { id: Number(id) } });

      await kreirajAuditLog(
        {
          idKorisnika: adminId,
          tipAkcije: "DELETE",
          izmenjenaTabela: "Korisnik",
          stariPodaci: korisnik,
          ipAdresa: req.ip,
        },
        tx
      );
    });

    res.json({ poruka: "Korisnik uspješno obrisan." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri brisanju korisnika." });
  }
};

export const promijeniUlogu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).korisnik.id;
    const { novaUloga, dodatniPodaci } = req.body;

    if (Number(id) === adminId) {
      res.status(400).json({ poruka: "Ne možete promijeniti vlastitu ulogu." });
      return;
    }

    if (!novaUloga || !Object.values(Uloga).includes(novaUloga)) {
      res.status(400).json({
        poruka: `Nevažeća uloga. Dozvoljene: ${Object.values(Uloga).join(", ")}`,
      });
      return;
    }

    const korisnik = await prisma.korisnik.findUnique({
      where: { id: Number(id) },
      include: {
        pacijentProfile: true,
        doktorProfile: true,
        osobljeProfile: true,
      },
    });

    if (!korisnik) {
      res.status(404).json({ poruka: "Korisnik nije pronađen." });
      return;
    }

    if (novaUloga === Uloga.DOKTOR && !korisnik.doktorProfile) {
      if (
        !dodatniPodaci?.brojLicence ||
        !dodatniPodaci?.specijalizacija ||
        !dodatniPodaci?.idOdjela
      ) {
        res.status(400).json({
          poruka:
            "Za ulogu doktora potrebni su: brojLicence, specijalizacija, idOdjela.",
        });
        return;
      }
    }

    if (
      novaUloga === Uloga.MEDICINSKO_OSOBLJE &&
      !korisnik.osobljeProfile
    ) {
      if (!dodatniPodaci?.pozicija || !dodatniPodaci?.idOdjel) {
        res.status(400).json({
          poruka: "Za medicinsko osoblje potrebni su: pozicija, idOdjel.",
        });
        return;
      }
    }

    const staraUloga = korisnik.uloga;

    await prisma.$transaction(async (tx) => {
      await tx.korisnik.update({
        where: { id: Number(id) },
        data: { uloga: novaUloga },
      });

      if (novaUloga === Uloga.PACIJENT && !korisnik.pacijentProfile) {
        await tx.pacijent.create({
          data: {
            idKorisnik: Number(id),
            brojKnjizice: dodatniPodaci?.brojKnjizice || "",
            brojKnjiziceHash: dodatniPodaci?.brojKnjiziceHash || "",
          },
        });
      }

      if (novaUloga === Uloga.DOKTOR && !korisnik.doktorProfile) {
        await tx.doktor.create({
          data: {
            idKorisnik: Number(id),
            brojLicence: Number(dodatniPodaci.brojLicence),
            specijalizacija: String(dodatniPodaci.specijalizacija),
            idOdjela: Number(dodatniPodaci.idOdjela),
          },
        });
      }

      if (
        novaUloga === Uloga.MEDICINSKO_OSOBLJE &&
        !korisnik.osobljeProfile
      ) {
        await tx.mediciskoOsoblje.create({
          data: {
            idKorisnik: Number(id),
            pozicija: String(dodatniPodaci.pozicija),
            idOdjel: Number(dodatniPodaci.idOdjel),
            radnoVrijeme: Number(dodatniPodaci.radnoVrijeme) || 8,
          },
        });
      }

      await kreirajAuditLog(
        {
          idKorisnika: adminId,
          tipAkcije: "PROMJENA_ULOGE",
          izmenjenaTabela: "Korisnik",
          stariPodaci: { uloga: staraUloga },
          noviPodaci: { uloga: novaUloga },
          ipAdresa: req.ip,
        },
        tx
      );
    });

    res.json({
      poruka: `Uloga korisnika promijenjena iz ${staraUloga} u ${novaUloga}.`,
    });
  } catch (error: any) {
    console.error("promijeniUlogu error:", error);
    const poruka = error?.code === "P2002"
      ? `Jedinstvenost narušena: ${error?.meta?.target ?? "nepoznato polje"} već postoji.`
      : error?.code === "P2003"
      ? `Strani ključ nevalidan: ${error?.meta?.field_name ?? "nepoznato polje"}.`
      : error?.message ?? "Greška pri promjeni uloge.";
    res.status(500).json({ poruka });
  }
};

// ============================================================
//  BLOKIRANJE / DEBLOKIRANJE NALOGA
// ============================================================

export const blokirajNalog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).korisnik.id;

    if (Number(id) === adminId) {
      res.status(400).json({ poruka: "Ne možete blokirati vlastiti nalog." });
      return;
    }

    const korisnik = await prisma.korisnik.findUnique({
      where: { id: Number(id) },
    });

    if (!korisnik) {
      res.status(404).json({ poruka: "Korisnik nije pronađen." });
      return;
    }

    if (korisnik.nalogZakljucan) {
      res.status(400).json({ poruka: "Nalog je već blokiran." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.korisnik.update({
        where: { id: Number(id) },
        data: {
          nalogZakljucan: true,
          vrijemeZakljucavanja: new Date(),
        },
      });

      await kreirajAuditLog(
        {
          idKorisnika: adminId,
          tipAkcije: "BLOKIRANJE_NALOGA",
          izmenjenaTabela: "Korisnik",
          stariPodaci: { nalogZakljucan: false },
          noviPodaci: { nalogZakljucan: true },
          ipAdresa: req.ip,
        },
        tx
      );
    });

    res.json({ poruka: "Nalog je uspješno blokiran." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri blokiranju naloga." });
  }
};

export const odblokirajNalog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).korisnik.id;

    const korisnik = await prisma.korisnik.findUnique({
      where: { id: Number(id) },
    });

    if (!korisnik) {
      res.status(404).json({ poruka: "Korisnik nije pronađen." });
      return;
    }

    if (!korisnik.nalogZakljucan) {
      res.status(400).json({ poruka: "Nalog nije blokiran." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.korisnik.update({
        where: { id: Number(id) },
        data: {
          nalogZakljucan: false,
          vrijemeZakljucavanja: null,
          brojNeuspjelihPrijava: 0,
          zadnjiNeuspjeliPokusaj: null,
        },
      });

      await kreirajAuditLog(
        {
          idKorisnika: adminId,
          tipAkcije: "DEBLOKIRANJE_NALOGA",
          izmenjenaTabela: "Korisnik",
          stariPodaci: { nalogZakljucan: true },
          noviPodaci: { nalogZakljucan: false },
          ipAdresa: req.ip,
        },
        tx
      );
    });

    res.json({ poruka: "Nalog je uspješno odblokiran." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri deblokiranju naloga." });
  }
};

// ============================================================
//  RASPORED DOKTORA — upravljanje radnim vremenom
// ============================================================

export const getRasporedi = async (req: Request, res: Response) => {
  try {
    const { idDoktor, aktivan } = req.query;

    const where: any = {};
    if (idDoktor) where.idDoktor = Number(idDoktor);
    if (aktivan !== undefined) where.aktivan = aktivan === "true";

    const rasporedi = await prisma.rasporedDoktora.findMany({
      where,
      orderBy: [{ idDoktor: "asc" }, { danUSedmici: "asc" }],
      include: {
        doktor: {
          include: {
            korisnik: { select: { ime: true, prezime: true } },
            odjel: { select: { naziv: true } },
          },
        },
      },
    });

    res.json(rasporedi);
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri dohvatanju rasporeda." });
  }
};

// ── upsert: create or update template for doctor+day ──────────
export const createRaspored = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).korisnik.id;
    const { idDoktor, danUSedmici, vrijemeOd, vrijemeDo } = req.body;

    if (!idDoktor || !danUSedmici || !vrijemeOd || !vrijemeDo) {
      res.status(400).json({ poruka: "Obavezna polja: idDoktor, danUSedmici, vrijemeOd, vrijemeDo." });
      return;
    }

    const doktor = await prisma.doktor.findUnique({ where: { id: Number(idDoktor) } });
    if (!doktor) { res.status(404).json({ poruka: "Doktor nije pronađen." }); return; }

    const vrijemeOdDate = new Date(`1970-01-01T${vrijemeOd}:00.000Z`);
    const vrijemeDoDate = new Date(`1970-01-01T${vrijemeDo}:00.000Z`);

    const raspored = await (prisma as any).rasporedDoktora.upsert({
      where: { idDoktor_danUSedmici: { idDoktor: Number(idDoktor), danUSedmici } },
      update: { vrijemeOd: vrijemeOdDate, vrijemeDo: vrijemeDoDate, aktivan: true },
      create: { idDoktor: Number(idDoktor), danUSedmici, vrijemeOd: vrijemeOdDate, vrijemeDo: vrijemeDoDate },
      include: {
        doktor: {
          include: {
            korisnik: { select: { ime: true, prezime: true } },
            odjel: { select: { naziv: true } },
          },
        },
      },
    });

    kreirajAuditLog({
      idKorisnika: adminId, tipAkcije: "UPSERT", izmenjenaTabela: "RasporedDoktora",
      noviPodaci: { id: raspored.id, idDoktor: raspored.idDoktor, danUSedmici },
      ipAdresa: req.ip,
    }).catch((e) => console.error("Audit log greška:", e));

    res.status(201).json({ poruka: "Raspored uspješno sačuvan.", raspored });
  } catch (error: any) {
    console.error("createRaspored greška:", error);
    res.status(500).json({ poruka: error?.message ?? "Greška pri kreiranju rasporeda." });
  }
};

// ── update hours of existing template ─────────────────────────
export const updateRaspored = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vrijemeOd, vrijemeDo, aktivan } = req.body;

    const azurirani = await prisma.rasporedDoktora.update({
      where: { id: Number(id) },
      data: {
        ...(vrijemeOd && { vrijemeOd: new Date(`1970-01-01T${vrijemeOd}:00.000Z`) }),
        ...(vrijemeDo && { vrijemeDo: new Date(`1970-01-01T${vrijemeDo}:00.000Z`) }),
        ...(aktivan !== undefined && { aktivan }),
      },
    });

    res.json({ poruka: "Raspored uspješno ažuriran.", raspored: azurirani });
  } catch (error: any) {
    console.error("updateRaspored greška:", error);
    res.status(500).json({ poruka: error?.message ?? "Greška pri ažuriranju rasporeda." });
  }
};

// ── soft-delete template ───────────────────────────────────────
export const deleteRaspored = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.rasporedDoktora.update({ where: { id: Number(id) }, data: { aktivan: false } });

    res.json({ poruka: "Raspored uspješno deaktiviran." });
  } catch (error: any) {
    console.error("deleteRaspored greška:", error);
    res.status(500).json({ poruka: error?.message ?? "Greška pri brisanju rasporeda." });
  }
};

// ── exceptions ────────────────────────────────────────────────
export const getIzuzeci = async (req: Request, res: Response) => {
  try {
    const { idDoktor, od, do: doParam } = req.query;
    const where: any = {};
    if (idDoktor) where.idDoktor = Number(idDoktor);
    if (od || doParam) {
      where.datum = {};
      if (od) where.datum.gte = new Date(od as string);
      if (doParam) where.datum.lte = new Date(doParam as string);
    }

    const izuzeci = await (prisma as any).izuzetakRasporeda.findMany({
      where,
      include: { doktor: { include: { korisnik: { select: { ime: true, prezime: true } } } } },
      orderBy: { datum: "asc" },
    });

    res.json(izuzeci);
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

export const createIzuzetak = async (req: Request, res: Response) => {
  try {
    const { idDoktor, datum, vrijemeOd, vrijemeDo, razlog, napomena } = req.body;

    if (!idDoktor || !datum || !razlog) {
      res.status(400).json({ poruka: "Obavezna polja: idDoktor, datum, razlog." });
      return;
    }

    const izuzetak = await (prisma as any).izuzetakRasporeda.upsert({
      where: { idDoktor_datum: { idDoktor: Number(idDoktor), datum: new Date(datum) } },
      update: {
        vrijemeOd: vrijemeOd ? new Date(`1970-01-01T${vrijemeOd}:00.000Z`) : null,
        vrijemeDo: vrijemeDo ? new Date(`1970-01-01T${vrijemeDo}:00.000Z`) : null,
        razlog, napomena: napomena || null,
      },
      create: {
        idDoktor: Number(idDoktor), datum: new Date(datum),
        vrijemeOd: vrijemeOd ? new Date(`1970-01-01T${vrijemeOd}:00.000Z`) : null,
        vrijemeDo: vrijemeDo ? new Date(`1970-01-01T${vrijemeDo}:00.000Z`) : null,
        razlog, napomena: napomena || null,
      },
    });

    // Send email notification for sick leave / conference
    if (razlog === "BOLOVANJE" || razlog === "KONFERENCIJA") {
      posaljiObavijestIzuzetak(Number(idDoktor), new Date(datum), razlog, napomena)
        .catch((e) => console.error("Email greška:", e));
    }

    res.status(201).json({ poruka: "Izuzetak uspješno kreiran.", izuzetak });
  } catch (error: any) {
    console.error("createIzuzetak greška:", error);
    res.status(500).json({ poruka: error?.message ?? "Greška pri kreiranju izuzetka." });
  }
};

export const deleteIzuzetak = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await (prisma as any).izuzetakRasporeda.delete({ where: { id: Number(id) } });
    res.json({ poruka: "Izuzetak uspješno uklonjen." });
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

// ── generate Termin records for next 2 months from templates ──
export const osvjeziTermine = async (req: Request, res: Response) => {
  try {
    const dani: number = Number(req.body?.dani) > 0 ? Number(req.body.dani) : 60;

    const templates = await prisma.rasporedDoktora.findMany({
      where: { aktivan: true },
      include: { doktor: { select: { id: true, trajanjePregleda: true } } },
    });

    const DAN_MAP: Record<string, number> = {
      PONEDJELJAK: 1, UTORAK: 2, SRIJEDA: 3, CETVRTAK: 4,
      PETAK: 5, SUBOTA: 6, NEDJELJA: 0,
    };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const endDate = new Date(today); endDate.setDate(endDate.getDate() + dani);

    let kreirano = 0;

    for (const tmpl of templates) {
      const targetDay = DAN_MAP[tmpl.danUSedmici];
      const trajanje = tmpl.doktor.trajanjePregleda;

      // Collect all dates matching this weekday in range
      const datesInRange: Date[] = [];
      const cur = new Date(today);
      while (cur <= endDate) {
        if (cur.getDay() === targetDay) datesInRange.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }

      for (const datum of datesInRange) {
        // Fetch exception for this doctor+date
        const izuzetak = await (prisma as any).izuzetakRasporeda.findUnique({
          where: { idDoktor_datum: { idDoktor: tmpl.idDoktor, datum } },
        });

        let startMin: number, endMin: number;
        if (izuzetak) {
          if (!izuzetak.vrijemeOd) continue; // not working
          startMin = izuzetak.vrijemeOd.getUTCHours() * 60 + izuzetak.vrijemeOd.getUTCMinutes();
          endMin   = izuzetak.vrijemeDo.getUTCHours() * 60 + izuzetak.vrijemeDo.getUTCMinutes();
        } else {
          startMin = tmpl.vrijemeOd.getUTCHours() * 60 + tmpl.vrijemeOd.getUTCMinutes();
          endMin   = tmpl.vrijemeDo.getUTCHours() * 60 + tmpl.vrijemeDo.getUTCMinutes();
        }

        // Get existing termini for this doctor+date to avoid duplicates
        const postojeciTermini = await prisma.termin.findMany({
          where: { idDoktor: tmpl.idDoktor, datum },
          select: { vrijeme: true },
        });
        const postojecaVremena = new Set(postojeciTermini.map((t) => t.vrijeme));

        for (let t = startMin; t + trajanje <= endMin; t += trajanje) {
          if (!postojecaVremena.has(t)) {
            await prisma.termin.create({
              data: { idDoktor: tmpl.idDoktor, datum, vrijeme: t, status: "SLOBODAN" },
            });
            kreirano++;
          }
        }
      }
    }

    res.json({ poruka: `Generisano ${kreirano} novih termina za naredna 2 mjeseca.` });
  } catch (error: any) {
    console.error("osvjeziTermine greška:", error);
    res.status(500).json({ poruka: error?.message ?? "Greška pri generisanju termina." });
  }
};

// ============================================================
//  ODJELI — CRUD (admin)
// ============================================================

export const getAdminOdjeli = async (req: Request, res: Response) => {
  try {
    const odjeli = await prisma.odjel.findMany({
      include: {
        doktori: { include: { korisnik: { select: { ime: true, prezime: true } } } },
        osoblje: { select: { id: true, pozicija: true, korisnik: { select: { ime: true, prezime: true } } } },
      },
      orderBy: { id: "asc" },
    });
    res.json(odjeli);
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

export const createAdminOdjel = async (req: Request, res: Response) => {
  try {
    const { naziv, opis } = req.body;
    if (!naziv?.trim()) {
      res.status(400).json({ poruka: "Naziv odjela je obavezan." });
      return;
    }
    const postoji = await prisma.odjel.findFirst({
      where: { naziv: { equals: naziv.trim(), mode: "insensitive" } },
    });
    if (postoji) {
      res.status(409).json({ poruka: "Odjel s tim nazivom već postoji." });
      return;
    }
    // Reset sequence in case seed inserted rows with explicit IDs
    await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Odjel"', 'id'), COALESCE((SELECT MAX(id) FROM "Odjel"), 1))`;
    const odjel = await prisma.odjel.create({
      data: { naziv: naziv.trim(), opis: opis?.trim() || null },
    });
    res.status(201).json({ poruka: "Odjel uspješno kreiran.", odjel });
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

export const premjestiDoktoraUOdjel = async (req: Request, res: Response) => {
  try {
    const { id, idDoktora } = req.params;
    const doktor = await prisma.doktor.findUnique({ where: { id: Number(idDoktora) } });
    if (!doktor) {
      res.status(404).json({ poruka: "Doktor nije pronađen." });
      return;
    }
    await prisma.doktor.update({
      where: { id: Number(idDoktora) },
      data: { idOdjela: Number(id) },
    });
    res.json({ poruka: "Doktor uspješno premješten u odjel." });
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

export const ukloniDoktoraIzOdjela = async (req: Request, res: Response) => {
  try {
    const { idDoktora } = req.params;
    const doktor = await prisma.doktor.findUnique({
      where: { id: Number(idDoktora) },
      include: {
        korisnik: { include: { pacijentProfile: true } },
        // Fetch only scheduled termini for email notification data
        termini: {
          where: { status: { in: ["ZAKAZAN", "POTVRDJEN"] } },
          include: {
            rezervacije: {
              where: { zavrseno: false, datumOtkazivanja: null },
              include: { pacijent: { include: { korisnik: { select: { ime: true, prezime: true } } } } },
            },
          },
        },
      },
    });

    if (!doktor) {
      res.status(404).json({ poruka: "Doktor nije pronađen." });
      return;
    }

    // Collect notification data before the transaction deletes everything
    const notifTermini: { datum: Date; vrijeme: number; pacijentIme: string; pacijentPrezime: string }[] = [];
    for (const t of doktor.termini) {
      for (const r of t.rezervacije) {
        notifTermini.push({
          datum: t.datum,
          vrijeme: t.vrijeme,
          pacijentIme: r.pacijent.korisnik.ime,
          pacijentPrezime: r.pacijent.korisnik.prezime,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      // ── 1. Collect all termin IDs for this doctor ──────────────
      const allTerminiIds = (await tx.termin.findMany({
        where: { idDoktor: doktor.id },
        select: { id: true },
      })).map(t => t.id);

      // ── 2. Collect all rezervacije IDs (via termini + direct) ──
      const rezViaTermini = allTerminiIds.length > 0
        ? (await tx.rezervacije.findMany({ where: { idTermina: { in: allTerminiIds } }, select: { id: true } })).map(r => r.id)
        : [];
      const rezDirekt = (await tx.rezervacije.findMany({ where: { idDoktor: doktor.id }, select: { id: true } })).map(r => r.id);
      const sveRezIds = [...new Set([...rezViaTermini, ...rezDirekt])];

      if (sveRezIds.length > 0) {
        // Find historijaPregleda IDs for these rezervacije
        const historijaIds = (await tx.historijaPregleda.findMany({
          where: { idRezervacija: { in: sveRezIds } },
          select: { id: true },
        })).map(h => h.id);

        if (historijaIds.length > 0) {
          await tx.recept.deleteMany({ where: { idHistorijaPregleda: { in: historijaIds } } });
        }
        await tx.historijaPregleda.deleteMany({ where: { idRezervacija: { in: sveRezIds } } });
        await tx.podsjetnik.deleteMany({ where: { idRezervacije: { in: sveRezIds } } });
        await tx.rezervacijaSpecijalista.deleteMany({ where: { idRezervacije: { in: sveRezIds } } });
        await (tx as any).komentar.deleteMany({ where: { idRezervacije: { in: sveRezIds } } });
        await tx.rezervacije.deleteMany({ where: { id: { in: sveRezIds } } });
      }

      // Delete any RezervacijaSpecijalista where this doktor was referent (not yet covered above)
      await tx.rezervacijaSpecijalista.deleteMany({
        where: { OR: [{ idSpecijaliste: doktor.id }, { idDoktorOpste: doktor.id }] },
      });

      // Delete any remaining recepti / historijaPregleda directly tied to this doktor
      await tx.recept.deleteMany({ where: { idDoktor: doktor.id } });
      await tx.historijaPregleda.deleteMany({ where: { idDoktor: doktor.id } });

      // ── 3. Delete termini ───────────────────────────────────────
      if (allTerminiIds.length > 0) {
        await tx.termin.deleteMany({ where: { id: { in: allTerminiIds } } });
      }

      // ── 4. Delete supporting doctor data ───────────────────────
      await tx.listaCekanja.deleteMany({ where: { idDoktor: doktor.id } });
      await (tx as any).izuzetakRasporeda.deleteMany({ where: { idDoktor: doktor.id } });
      await tx.rasporedDoktora.deleteMany({ where: { idDoktor: doktor.id } });

      // ── 5. Delete Doktor record (fixes "still in list" bug) ────
      await tx.doktor.delete({ where: { id: doktor.id } });

      // ── 6. Demote to PACIJENT ───────────────────────────────────
      await tx.korisnik.update({ where: { id: doktor.idKorisnik }, data: { uloga: Uloga.PACIJENT } });
      if (!doktor.korisnik.pacijentProfile) {
        await tx.pacijent.create({
          data: {
            idKorisnik: doktor.idKorisnik,
            brojKnjizice: "",
            brojKnjiziceHash: crypto.randomBytes(16).toString("hex"),
          },
        });
      }
    });

    // Send notification email after successful transaction (fire-and-forget)
    if (notifTermini.length > 0) {
      posaljiObavijestDoktorNedostupan(doktor.korisnik.ime, doktor.korisnik.prezime, notifTermini)
        .catch(e => console.error("Email greška (doktor nedostupan):", e));
    }

    res.json({
      poruka: `${doktor.korisnik.ime} ${doktor.korisnik.prezime} je uklonjen/a. Svi termini su obrisani${notifTermini.length > 0 ? ` i ${notifTermini.length} pacijenata je obaviješteno` : ""}.`,
    });
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

export const deleteAdminOdjel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const odjel = await prisma.odjel.findUnique({
      where: { id: Number(id) },
      include: {
        doktori: { select: { id: true } },
        osoblje: { select: { id: true } },
      },
    });
    if (!odjel) {
      res.status(404).json({ poruka: "Odjel nije pronađen." });
      return;
    }
    const ukupno = odjel.doktori.length + odjel.osoblje.length;
    if (ukupno > 0) {
      res.status(400).json({
        poruka: `Nije moguće obrisati odjel koji ima ${odjel.doktori.length} doktora i ${odjel.osoblje.length} članova osoblja. Prvo premjestite sve članove.`,
      });
      return;
    }
    await prisma.odjel.delete({ where: { id: Number(id) } });
    res.json({ poruka: "Odjel uspješno obrisan." });
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška pri brisanju odjela." });
  }
};

// ============================================================
//  ANALITIKA — agregirana statistika bukiranja
// ============================================================

export const getAnalitika = async (req: Request, res: Response) => {
  try {
    const danas = new Date();
    danas.setHours(0, 0, 0, 0);

    const sutra = new Date(danas);
    sutra.setDate(danas.getDate() + 1);

    // Start of week (Monday)
    const dow = danas.getDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const pocetakSedmice = new Date(danas);
    pocetakSedmice.setDate(danas.getDate() + diffToMonday);
    const krajSedmice = new Date(pocetakSedmice);
    krajSedmice.setDate(pocetakSedmice.getDate() + 7);

    // Current month range
    const pocetakMjeseca = new Date(danas.getFullYear(), danas.getMonth(), 1);
    const krajMjeseca = new Date(danas.getFullYear(), danas.getMonth() + 1, 0);
    krajMjeseca.setHours(23, 59, 59, 999);

    const [terminDanas, terminSedmica, ukupnoMjesec, otkazaniMjesec, propusteniMjesec] =
      await Promise.all([
        prisma.termin.count({
          where: { datum: { gte: danas, lt: sutra }, status: { not: "SLOBODAN" } },
        }),
        prisma.termin.count({
          where: { datum: { gte: pocetakSedmice, lt: krajSedmice }, status: { not: "SLOBODAN" } },
        }),
        prisma.termin.count({
          where: { datum: { gte: pocetakMjeseca, lte: krajMjeseca }, status: { not: "SLOBODAN" } },
        }),
        prisma.termin.count({
          where: { datum: { gte: pocetakMjeseca, lte: krajMjeseca }, status: "OTKAZAN" },
        }),
        // Missed = booked/confirmed slots whose date has already passed
        prisma.termin.count({
          where: {
            datum: { gte: pocetakMjeseca, lt: danas },
            status: { in: ["ZAKAZAN", "POTVRDJEN"] },
          },
        }),
      ]);

    // Average waiting time (days) for urgent bookings
    const hitneRez = await prisma.rezervacije.findMany({
      where: { hitnost: true, datumOtkazivanja: null },
      select: { datumKreiranja: true, termin: { select: { datum: true } } },
      take: 200,
      orderBy: { datumKreiranja: "desc" },
    });

    const prosjecnoVrijemeCekanja =
      hitneRez.length > 0
        ? Math.round(
            (hitneRez.reduce((acc, r) => {
              const diff =
                (new Date(r.termin.datum).getTime() - new Date(r.datumKreiranja).getTime()) /
                (1000 * 60 * 60 * 24);
              return acc + Math.max(0, diff);
            }, 0) /
              hitneRez.length) *
              10
          ) / 10
        : null;

    // Per-doctor aggregation for current month
    const terminiMjesec = await prisma.termin.findMany({
      where: {
        datum: { gte: pocetakMjeseca, lte: krajMjeseca },
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

    const odjeliMap: Record<
      string,
      { naziv: string; slobodni: number; zakazani: number; otkazani: number; ukupno: number }
    > = {};
    const doktoriMap: Record<
      number,
      { ime: string; prezime: string; odjel: string; slobodni: number; zakazani: number; otkazani: number; ukupno: number }
    > = {};

    for (const t of terminiMjesec) {
      const odjelNaziv = t.doktor.odjel.naziv;
      const did = t.doktor.id;

      if (!odjeliMap[odjelNaziv])
        odjeliMap[odjelNaziv] = { naziv: odjelNaziv, slobodni: 0, zakazani: 0, otkazani: 0, ukupno: 0 };
      if (!doktoriMap[did])
        doktoriMap[did] = {
          ime: t.doktor.korisnik.ime,
          prezime: t.doktor.korisnik.prezime,
          odjel: odjelNaziv,
          slobodni: 0, zakazani: 0, otkazani: 0, ukupno: 0,
        };

      odjeliMap[odjelNaziv].ukupno++;
      doktoriMap[did].ukupno++;

      if (t.status === "SLOBODAN") {
        odjeliMap[odjelNaziv].slobodni++;
        doktoriMap[did].slobodni++;
      } else if (t.status === "OTKAZAN") {
        odjeliMap[odjelNaziv].otkazani++;
        doktoriMap[did].otkazani++;
      } else {
        odjeliMap[odjelNaziv].zakazani++;
        doktoriMap[did].zakazani++;
      }
    }

    const poOdjelu = Object.values(odjeliMap).sort((a, b) => b.zakazani - a.zakazani);
    const poDoktoru = Object.values(doktoriMap).sort((a, b) => b.zakazani - a.zakazani);

    res.json({
      terminDanas,
      terminSedmica,
      ukupnoMjesec,
      otkazaniMjesec,
      propusteniMjesec,
      procenatOtkazanih:
        ukupnoMjesec > 0
          ? Math.round(((otkazaniMjesec + propusteniMjesec) / ukupnoMjesec) * 100)
          : 0,
      prosjecnoVrijemeCekanja,
      poOdjelu,
      poDoktoru,
    });
  } catch (error: any) {
    console.error("getAnalitika greška:", error);
    res.status(500).json({ poruka: error?.message ?? "Greška pri dohvatanju analitike." });
  }
};

// ============================================================
//  TERMINI — pregled svih termina
// ============================================================

// ============================================================
//  RASPORED OSOBLJA — tjedni šabloni medicinskog osoblja
// ============================================================

export const getSviOsobljeListа = async (req: Request, res: Response) => {
  try {
    const osoblje = await prisma.mediciskoOsoblje.findMany({
      include: {
        korisnik: { select: { ime: true, prezime: true } },
        odjel: { select: { naziv: true } },
      },
      orderBy: { id: "asc" },
    });
    res.json(osoblje);
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

export const getRasporediOsoblja = async (req: Request, res: Response) => {
  try {
    const { aktivan } = req.query;
    const where: any = {};
    if (aktivan !== undefined) where.aktivan = aktivan === "true";

    const rasporedi = await (prisma as any).rasporedOsoblja.findMany({
      where,
      orderBy: [{ idOsoblje: "asc" }, { danUSedmici: "asc" }],
      include: {
        osoblje: {
          include: {
            korisnik: { select: { ime: true, prezime: true } },
            odjel: { select: { naziv: true } },
          },
        },
      },
    });
    res.json(rasporedi);
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

export const createRasporedOsoblja = async (req: Request, res: Response) => {
  try {
    const { idOsoblje, danUSedmici, vrijemeOd, vrijemeDo } = req.body;
    if (!idOsoblje || !danUSedmici || !vrijemeOd || !vrijemeDo) {
      res.status(400).json({ poruka: "Obavezna polja: idOsoblje, danUSedmici, vrijemeOd, vrijemeDo." });
      return;
    }
    const vrijemeOdDate = new Date(`1970-01-01T${vrijemeOd}:00.000Z`);
    const vrijemeDoDate = new Date(`1970-01-01T${vrijemeDo}:00.000Z`);

    const raspored = await (prisma as any).rasporedOsoblja.upsert({
      where: { idOsoblje_danUSedmici: { idOsoblje: Number(idOsoblje), danUSedmici } },
      update: { vrijemeOd: vrijemeOdDate, vrijemeDo: vrijemeDoDate, aktivan: true },
      create: { idOsoblje: Number(idOsoblje), danUSedmici, vrijemeOd: vrijemeOdDate, vrijemeDo: vrijemeDoDate },
      include: {
        osoblje: {
          include: {
            korisnik: { select: { ime: true, prezime: true } },
            odjel: { select: { naziv: true } },
          },
        },
      },
    });
    res.status(201).json({ poruka: "Raspored osoblja uspješno sačuvan.", raspored });
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

export const updateRasporedOsoblja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vrijemeOd, vrijemeDo } = req.body;
    const azurirani = await (prisma as any).rasporedOsoblja.update({
      where: { id: Number(id) },
      data: {
        ...(vrijemeOd && { vrijemeOd: new Date(`1970-01-01T${vrijemeOd}:00.000Z`) }),
        ...(vrijemeDo && { vrijemeDo: new Date(`1970-01-01T${vrijemeDo}:00.000Z`) }),
      },
    });
    res.json({ poruka: "Raspored osoblja uspješno ažuriran.", raspored: azurirani });
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

export const deleteRasporedOsoblja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await (prisma as any).rasporedOsoblja.update({ where: { id: Number(id) }, data: { aktivan: false } });
    res.json({ poruka: "Raspored osoblja uspješno deaktiviran." });
  } catch (error: any) {
    res.status(500).json({ poruka: error?.message ?? "Greška." });
  }
};

// ============================================================
//  TERMINI — pregled svih termina
// ============================================================

export const getSviTermini = async (req: Request, res: Response) => {
  try {
    const {
      stranica = "1",
      limit = "20",
      status,
      idDoktor,
      datumOd,
      datumDo,
    } = req.query;

    const skip = (Number(stranica) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (status) where.status = status;
    if (idDoktor) where.idDoktor = Number(idDoktor);

    if (datumOd || datumDo) {
      where.datum = {};
      if (datumOd) where.datum.gte = new Date(String(datumOd));
      if (datumDo) where.datum.lte = new Date(String(datumDo));
    }

    const [termini, ukupno] = await Promise.all([
      prisma.termin.findMany({
        where,
        skip,
        take,
        orderBy: { datum: "desc" },
        include: {
          doktor: {
            include: {
              korisnik: { select: { ime: true, prezime: true } },
              odjel: { select: { naziv: true } },
            },
          },
          pacijent: {
            include: {
              korisnik: { select: { ime: true, prezime: true } },
            },
          },
          rezervacije: {
            select: {
              id: true,
              komentar: true,
              hitnost: true,
              datumKreiranja: true,
              datumOtkazivanja: true,
              zavrseno: true,
            },
          },
        },
      }),
      prisma.termin.count({ where }),
    ]);

    res.json({
      termini,
      paginacija: {
        ukupno,
        stranica: Number(stranica),
        limit: take,
        ukupnoStranica: Math.ceil(ukupno / take),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri dohvatanju termina." });
  }
};