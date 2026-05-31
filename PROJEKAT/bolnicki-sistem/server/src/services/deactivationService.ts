import { prisma } from "../lib/prisma.js";
import { kreirajAuditLog } from "../lib/auditLog.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  posaljiPotvrdZahtjevaDeaktivacije,
  posaljiOdlukuDeaktivacije,
  posaljiObavijestOtkazTerminaDeaktivacija,
} from "../emailService.js";

// ══════════════════════════════════════════════════════════════
//  KREIRANJE ZAHTJEVA ZA DEAKTIVACIJU (pacijent)
// ══════════════════════════════════════════════════════════════
export const kreirajZahtjevDeaktivacije = async (
  idKorisnika: number,
  razlog?: string,
  ipAdresa?: string
) => {
  // Provjera da li već postoji aktivan zahtjev
  const postojeci = await prisma.zahtjevDeaktivacije.findFirst({
    where: { idKorisnika, status: "NA_CEKANJU" },
  });

  if (postojeci) {
    throw {
      status: 409,
      poruka: "Već imate aktivan zahtjev za deaktivaciju koji čeka obradu.",
    };
  }

  const korisnik = await prisma.korisnik.findUnique({
    where: { id: idKorisnika },
    select: { id: true, ime: true, email: true, uloga: true },
  });

  if (!korisnik) {
    throw { status: 404, poruka: "Korisnik nije pronađen." };
  }

  if (korisnik.uloga !== "PACIJENT") {
    throw {
      status: 403,
      poruka: "Samo pacijenti mogu zatražiti deaktivaciju naloga.",
    };
  }

  const zahtjev = await prisma.$transaction(async (tx) => {
    const noviZahtjev = await tx.zahtjevDeaktivacije.create({
      data: {
        idKorisnika,
        razlogKorisnika: razlog || null,
      },
    });

    await kreirajAuditLog(
      {
        idKorisnika,
        tipAkcije: "ZAHTJEV_DEAKTIVACIJE_KREIRAN",
        izmenjenaTabela: "ZahtjevDeaktivacije",
        noviPodaci: { zahtjevId: noviZahtjev.id, razlog },
        ipAdresa,
      },
      tx
    );

    return noviZahtjev;
  });

  // Slanje email potvrde (fire and forget)
  try {
    await posaljiPotvrdZahtjevaDeaktivacije(korisnik.email, korisnik.ime);
  } catch (err) {
    console.error("Greška pri slanju email potvrde zahtjeva deaktivacije:", err);
  }

  return zahtjev;
};

// ══════════════════════════════════════════════════════════════
//  DOHVAT STATUSA ZAHTJEVA (pacijent — za prikaz na profilu)
// ══════════════════════════════════════════════════════════════
export const dohvatiStatusZahtjeva = async (idKorisnika: number) => {
  const zahtjev = await prisma.zahtjevDeaktivacije.findFirst({
    where: { idKorisnika },
    orderBy: { kreiranAt: "desc" },
    select: {
      id: true,
      status: true,
      razlogKorisnika: true,
      adminObrazlozenje: true,
      kreiranAt: true,
      obradenAt: true,
    },
  });

  return zahtjev;
};

// ══════════════════════════════════════════════════════════════
//  DOHVAT ZAHTJEVA (admin — lista svih zahtjeva)
// ══════════════════════════════════════════════════════════════
export const dohvatiZahtjeveDeaktivacije = async (filter?: {
  status?: string;
  stranica?: number;
  limit?: number;
}) => {
  const stranica = filter?.stranica || 1;
  const limit = filter?.limit || 10;
  const skip = (stranica - 1) * limit;

  const where: any = {};
  if (filter?.status) {
    where.status = filter.status;
  }

  const [zahtjevi, ukupno] = await Promise.all([
    prisma.zahtjevDeaktivacije.findMany({
      where,
      skip,
      take: limit,
      orderBy: { kreiranAt: "desc" },
      include: {
        korisnik: {
          select: {
            id: true,
            ime: true,
            prezime: true,
            email: true,
            datumRegistracije: true,
          },
        },
      },
    }),
    prisma.zahtjevDeaktivacije.count({ where }),
  ]);

  return {
    zahtjevi,
    paginacija: {
      ukupno,
      stranica,
      limit,
      ukupnoStranica: Math.ceil(ukupno / limit),
    },
  };
};

// ══════════════════════════════════════════════════════════════
//  OBRADA ZAHTJEVA (admin — odobri ili odbij)
// ══════════════════════════════════════════════════════════════
export const obradiZahtjevDeaktivacije = async (
  idZahtjeva: number,
  odluka: "ODOBRENO" | "ODBIJENO",
  adminId: number,
  obrazlozenje?: string,
  ipAdresa?: string
) => {
  const zahtjev = await prisma.zahtjevDeaktivacije.findUnique({
    where: { id: idZahtjeva },
    include: {
      korisnik: {
        select: { id: true, ime: true, email: true },
      },
    },
  });

  if (!zahtjev) {
    throw { status: 404, poruka: "Zahtjev nije pronađen." };
  }

  if (zahtjev.status !== "NA_CEKANJU") {
    throw { status: 400, poruka: "Ovaj zahtjev je već obrađen." };
  }

  if (odluka === "ODOBRENO") {
    // Anonimizacija + ažuriranje zahtjeva u jednoj transakciji
    await prisma.$transaction(async (tx) => {
      await tx.zahtjevDeaktivacije.update({
        where: { id: idZahtjeva },
        data: {
          status: "ODOBRENO",
          idAdmina: adminId,
          adminObrazlozenje: obrazlozenje || null,
          obradenAt: new Date(),
        },
      });

      await anonimizujKorisnika(zahtjev.idKorisnika, tx);

      await kreirajAuditLog(
        {
          idKorisnika: adminId,
          tipAkcije: "ZAHTJEV_DEAKTIVACIJE_ODOBREN",
          izmenjenaTabela: "ZahtjevDeaktivacije",
          noviPodaci: {
            zahtjevId: idZahtjeva,
            korisnikId: zahtjev.idKorisnika,
          },
          ipAdresa,
        },
        tx
      );
    });

    // Email obavijest korisniku (fire and forget)
    try {
      await posaljiOdlukuDeaktivacije(
        zahtjev.korisnik.email,
        zahtjev.korisnik.ime,
        true
      );
    } catch (err) {
      console.error("Greška pri slanju email obavijesti o odobrenju:", err);
    }

    return { poruka: "Zahtjev odobren. Nalog je deaktiviran i podaci su anonimizirani." };
  } else {
    // ODBIJENO
    await prisma.$transaction(async (tx) => {
      await tx.zahtjevDeaktivacije.update({
        where: { id: idZahtjeva },
        data: {
          status: "ODBIJENO",
          idAdmina: adminId,
          adminObrazlozenje: obrazlozenje || null,
          obradenAt: new Date(),
        },
      });

      await kreirajAuditLog(
        {
          idKorisnika: adminId,
          tipAkcije: "ZAHTJEV_DEAKTIVACIJE_ODBIJEN",
          izmenjenaTabela: "ZahtjevDeaktivacije",
          noviPodaci: {
            zahtjevId: idZahtjeva,
            korisnikId: zahtjev.idKorisnika,
            obrazlozenje,
          },
          ipAdresa,
        },
        tx
      );
    });

    // Email obavijest korisniku
    try {
      await posaljiOdlukuDeaktivacije(
        zahtjev.korisnik.email,
        zahtjev.korisnik.ime,
        false,
        obrazlozenje
      );
    } catch (err) {
      console.error("Greška pri slanju email obavijesti o odbijanju:", err);
    }

    return { poruka: "Zahtjev je odbijen." };
  }
};

// ══════════════════════════════════════════════════════════════
//  ANONIMIZACIJA KORISNIKA
// ══════════════════════════════════════════════════════════════
const anonimizujKorisnika = async (
  korisnikId: number,
  tx: any
) => {
  const korisnik = await tx.korisnik.findUnique({
    where: { id: korisnikId },
    include: {
      pacijentProfile: true,
    },
  });

  if (!korisnik) {
    throw { status: 404, poruka: "Korisnik za anonimizaciju nije pronađen." };
  }

  // 1. Otkaži aktivne termine/rezervacije
  const sada = new Date();

  if (korisnik.pacijentProfile) {
    const aktivneRezervacije = await tx.rezervacije.findMany({
      where: {
        idPacijent: korisnik.pacijentProfile.id,
        datumOtkazivanja: null,
        zavrseno: false,
        termin: {
          datum: { gte: sada },
        },
      },
      include: {
        termin: {
          include: {
            doktor: {
              include: {
                korisnik: { select: { ime: true, prezime: true } },
              },
            },
          },
        },
      },
    });

    if (aktivneRezervacije.length > 0) {
      // Otkaži sve aktivne rezervacije
      const terminInfo: { datum: Date; vrijeme: number; doktorIme: string; doktorPrezime: string }[] = [];

      for (const rez of aktivneRezervacije) {
        await tx.rezervacije.update({
          where: { id: rez.id },
          data: { datumOtkazivanja: sada },
        });

        await tx.termin.update({
          where: { id: rez.idTermina },
          data: { status: "SLOBODAN", pacijentId: null },
        });

        terminInfo.push({
          datum: rez.termin.datum,
          vrijeme: rez.termin.vrijeme,
          doktorIme: rez.termin.doktor.korisnik.ime,
          doktorPrezime: rez.termin.doktor.korisnik.prezime,
        });
      }

      // Email obavijest o otkazanim terminima (fire and forget)
      try {
        await posaljiObavijestOtkazTerminaDeaktivacija(
          korisnik.email,
          korisnik.ime,
          terminInfo
        );
      } catch (err) {
        console.error("Greška pri slanju obavijesti o otkazanim terminima:", err);
      }
    }
  }

  // 2. Anonimizuj PII polja na korisniku
  const uniqueSuffix = `${korisnikId}_${Date.now()}`;
  const randomPassword = await bcrypt.hash(crypto.randomUUID(), 12);

  await tx.korisnik.update({
    where: { id: korisnikId },
    data: {
      ime: "DEAKTIVIRANI_KORISNIK",
      prezime: `ID_${korisnikId}`,
      email: `deaktivirani_${korisnikId}@anon.local`,
      brojTelefona: null,
      jmbg: "ANONIMIZIRANO",
      jmbgHash: `ANON_${uniqueSuffix}`,
      pristupnaSifra: randomPassword,
      nalogZakljucan: true,
      emailVerifikovan: false,
    },
  });

  // 3. Anonimizuj pacijent profil (ali zadrži vezu za medicinske podatke)
  if (korisnik.pacijentProfile) {
    await tx.pacijent.update({
      where: { id: korisnik.pacijentProfile.id },
      data: {
        brojKnjizice: "ANONIMIZIRANO",
        brojKnjiziceHash: `ANON_KNJIZICA_${uniqueSuffix}`,
      },
    });
  }

  // 4. Audit log za anonimizaciju
  await kreirajAuditLog(
    {
      idKorisnika: korisnikId,
      tipAkcije: "KORISNIK_ANONIMIZIRAN",
      izmenjenaTabela: "Korisnik",
      stariPodaci: {
        ime: korisnik.ime,
        prezime: korisnik.prezime,
        email: korisnik.email,
      },
      noviPodaci: {
        ime: "DEAKTIVIRANI_KORISNIK",
        prezime: `ID_${korisnikId}`,
        email: `deaktivirani_${korisnikId}@anon.local`,
      },
    },
    tx
  );
};
