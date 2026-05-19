import { Request, Response } from "express";
//import { PrismaClient, Uloga } from "@prisma/client";
import { kreirajAuditLog } from "../lib/auditLog.js";
import { Uloga } from "@prisma/client";
import { prisma } from "../lib/prisma.js";


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
    const { ime, prezime, email, brojTelefona } = req.body;

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
          noviPodaci: { ime, prezime, email, brojTelefona },
          ipAdresa: req.ip,
        },
        tx
      );

      return result;
    });

    res.json({ poruka: "Korisnik uspješno ažuriran.", korisnik: azurirani });
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri ažuriranju korisnika." });
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
            brojLicence: dodatniPodaci.brojLicence,
            specijalizacija: dodatniPodaci.specijalizacija,
            idOdjela: dodatniPodaci.idOdjela,
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
            pozicija: dodatniPodaci.pozicija,
            idOdjel: dodatniPodaci.idOdjel,
            radnoVrijeme: dodatniPodaci.radnoVrijeme || 8,
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri promjeni uloge." });
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

export const createRaspored = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).korisnik.id;
    const { idDoktor, danUSedmici, vrijemeOd, vrijemeDo, datumOd, datumDo } =
      req.body;

    if (!idDoktor || !danUSedmici || !vrijemeOd || !vrijemeDo || !datumOd) {
      res.status(400).json({
        poruka:
          "Obavezna polja: idDoktor, danUSedmici, vrijemeOd, vrijemeDo, datumOd.",
      });
      return;
    }

    const doktor = await prisma.doktor.findUnique({
      where: { id: Number(idDoktor) },
    });

    if (!doktor) {
      res.status(404).json({ poruka: "Doktor nije pronađen." });
      return;
    }

    const preklapanje = await prisma.rasporedDoktora.findFirst({
      where: {
        idDoktor: Number(idDoktor),
        danUSedmici,
        aktivan: true,
        OR: [{ datumDo: null }, { datumDo: { gte: new Date(datumOd) } }],
      },
    });

    if (preklapanje) {
      res.status(409).json({
        poruka: "Doktor već ima aktivan raspored za taj dan.",
      });
      return;
    }

    const raspored = await prisma.$transaction(async (tx) => {
      const result = await tx.rasporedDoktora.create({
        data: {
          idDoktor: Number(idDoktor),
          danUSedmici,
          vrijemeOd: new Date(`1970-01-01T${vrijemeOd}:00.000Z`),
          vrijemeDo: new Date(`1970-01-01T${vrijemeDo}:00.000Z`),
          datumOd: new Date(datumOd),
          datumDo: datumDo ? new Date(datumDo) : null,
        },
        include: {
          doktor: {
            include: {
              korisnik: { select: { ime: true, prezime: true } },
            },
          },
        },
      });

      await kreirajAuditLog(
        {
          idKorisnika: adminId,
          tipAkcije: "CREATE",
          izmenjenaTabela: "RasporedDoktora",
          noviPodaci: result,
          ipAdresa: req.ip,
        },
        tx
      );

      return result;
    });

    res.status(201).json({
      poruka: "Raspored uspješno kreiran.",
      raspored,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri kreiranju rasporeda." });
  }
};

export const updateRaspored = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).korisnik.id;
    const { danUSedmici, vrijemeOd, vrijemeDo, datumOd, datumDo, aktivan } =
      req.body;

    const postojeci = await prisma.rasporedDoktora.findUnique({
      where: { id: Number(id) },
    });

    if (!postojeci) {
      res.status(404).json({ poruka: "Raspored nije pronađen." });
      return;
    }

    const azurirani = await prisma.$transaction(async (tx) => {
      const result = await tx.rasporedDoktora.update({
        where: { id: Number(id) },
        data: {
          ...(danUSedmici && { danUSedmici }),
          ...(vrijemeOd && {
            vrijemeOd: new Date(`1970-01-01T${vrijemeOd}:00.000Z`),
          }),
          ...(vrijemeDo && {
            vrijemeDo: new Date(`1970-01-01T${vrijemeDo}:00.000Z`),
          }),
          ...(datumOd && { datumOd: new Date(datumOd) }),
          ...(datumDo !== undefined && {
            datumDo: datumDo ? new Date(datumDo) : null,
          }),
          ...(aktivan !== undefined && { aktivan }),
        },
      });

      await kreirajAuditLog(
        {
          idKorisnika: adminId,
          tipAkcije: "UPDATE",
          izmenjenaTabela: "RasporedDoktora",
          stariPodaci: postojeci,
          noviPodaci: result,
          ipAdresa: req.ip,
        },
        tx
      );

      return result;
    });

    res.json({ poruka: "Raspored uspješno ažuriran.", raspored: azurirani });
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri ažuriranju rasporeda." });
  }
};

export const deleteRaspored = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).korisnik.id;

    const postojeci = await prisma.rasporedDoktora.findUnique({
      where: { id: Number(id) },
    });

    if (!postojeci) {
      res.status(404).json({ poruka: "Raspored nije pronađen." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.rasporedDoktora.update({
        where: { id: Number(id) },
        data: { aktivan: false },
      });

      await kreirajAuditLog(
        {
          idKorisnika: adminId,
          tipAkcije: "DELETE",
          izmenjenaTabela: "RasporedDoktora",
          stariPodaci: postojeci,
          ipAdresa: req.ip,
        },
        tx
      );
    });

    res.json({ poruka: "Raspored uspješno deaktiviran." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ poruka: "Greška pri brisanju rasporeda." });
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