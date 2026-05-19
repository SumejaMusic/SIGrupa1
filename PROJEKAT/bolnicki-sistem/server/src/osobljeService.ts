// src/services/osobljeService.ts
//
// Sva poslovna logika za medicinski panel.
// Kontroler je tanak sloj (HTTP) — service sadrži sve provjere i Prisma upite.

import { prisma } from "./lib/prisma.js";
//import { posaljiOtkazivanjeMail } from "./emailService.js";

// ─── Pomoćna funkcija ─────────────────────────────────────────────────────────
// Normalizuje datum iz Prisma Date objekta u čisti "YYYY-MM-DD" string.
// toISOString() uvijek vraća UTC, pa substring(0,10) daje tačan datum bez
// timezone offseta (npr. "2026-05-20T22:00:00Z" → "2026-05-20").
const normalizujDatum = (datum: Date): string => datum.toISOString().substring(0, 10);

// Primjenjuje normalizaciju na termin objekat
const normalizujTermin = (termin: any) => ({
  ...termin,
  datum: normalizujDatum(termin.datum),
});

// Primjenjuje normalizaciju na rezervaciju (koja sadrži termin)
const normalizujRezervaciju = (r: any) => ({
  ...r,
  termin: normalizujTermin(r.termin),
});

// ─── Tipovi ───────────────────────────────────────────────────────────────────

export interface KreirajTerminInput {
  idTermina:      number;
  idDoktor:      number;
  idPacijent:    number;
  idTipPregleda?: number;
  komentar?:     string;
  hitnost?:      boolean;
}

// ─── 1. Dnevni termini ────────────────────────────────────────────────────────

export async function getDnevniTerminiService(datum: Date) {
  const pocetakDana = new Date(datum);
  pocetakDana.setUTCHours(0, 0, 0, 0);

  const krajDana = new Date(datum);
  krajDana.setUTCHours(23, 59, 59, 999);

  const rezultati = await prisma.rezervacije.findMany({
    where: {
      datumOtkazivanja: null,
      zavrseno: false,
      termin: {
        datum: { gte: pocetakDana, lte: krajDana },
      },
    },
    include: {
      termin: true,
      pacijent: {
        include: {
          korisnik: {
            select: {
              id: true,
              ime: true,
              prezime: true,
              brojTelefona: true,
              email: true,
              datumRodjenja: true,
            },
          },
        },
      },
      doktor: {
        include: {
          korisnik: { select: { id: true, ime: true, prezime: true } },
          odjel: true,
          soba: true,
        },
      },
      tipPregleda: true,
      soba: true,
      historija: {
        include: { nalaz: { select: { id: true, naziv: true, vrijemeNalaza: true, opis: true } } }
      },
    },
    orderBy: { termin: { vrijeme: "asc" } },
  });

  return rezultati.map(normalizujRezervaciju);
}

// ─── 2. Pretraga po imenu pacijenta ──────────────────────────────────────────

export async function pretragaTerminaService(ime: string) {
  const rezultati = await prisma.rezervacije.findMany({
    where: {
      datumOtkazivanja: null,
      pacijent: {
        korisnik: {
          OR: [
            { ime:     { contains: ime, mode: "insensitive" } },
            { prezime: { contains: ime, mode: "insensitive" } },
          ],
        },
      },
    },
    include: {
      termin: true,
      pacijent: {
        include: {
          korisnik: {
            select: {
              ime:          true,
              prezime:      true,
              brojTelefona: true,
              email:        true,
              datumRodjenja: true,
            },
          },
        },
      },
      doktor: {
        include: {
          korisnik: { select: { ime: true, prezime: true } },
          odjel: true,
          soba:     true,
        },
      },
      tipPregleda: true,
    },
    orderBy: { datumKreiranja: "desc" },
  });

  return rezultati.map(normalizujRezervaciju);
}

// ─── 3. Detalji jedne rezervacije ────────────────────────────────────────────

export async function getDetaljiTerminaService(idRezervacije: number) {
  const rezultat = await prisma.rezervacije.findUnique({
    where: { id: idRezervacije },
    include: {
      termin: true,
      pacijent: {
        include: {
          korisnik: {
            select: {
              ime:          true,
              prezime:      true,
              brojTelefona: true,
              email:        true,
              datumRodjenja: true,
            },
          },
        },
      },
      doktor: {
        include: {
          korisnik: { select: { ime: true, prezime: true } },
          odjel: true,
          soba:     true,
        },
      },
      tipPregleda: true,
    },
  });

  if (!rezultat) return null;
  return normalizujRezervaciju(rezultat);
}

// ─── 4. Otkazivanje termina od strane osoblja ─────────────────────────────────

export async function otkaziTerminService(idRezervacije: number) {
  const rezervacija = await prisma.rezervacije.findUnique({
    where: { id: idRezervacije },
    include: {
      termin: true,
      pacijent: {
        include: {
          korisnik: { select: { email: true, ime: true, prezime: true } },
        },
      },
    },
  });

  if (!rezervacija) {
    throw { status: 404, poruka: "Rezervacija nije pronađena." };
  }

  if (rezervacija.datumOtkazivanja !== null) {
    throw { status: 400, poruka: "Rezervacija je već otkazana." };
  }

  const baziDatum = new Date(rezervacija.termin.datum);
  const sati = Math.floor(rezervacija.termin.vrijeme / 60);
  const minuti = rezervacija.termin.vrijeme % 60;

  const terminUTCMilisekundi = Date.UTC(
    baziDatum.getUTCFullYear(),
    baziDatum.getUTCMonth(),
    baziDatum.getUTCDate(),
    sati,
    minuti,
    0,
    0
  );

  const sadaUTCMilisekundi = Date.now();

  if (terminUTCMilisekundi < sadaUTCMilisekundi) {
    throw { status: 400, poruka: "Ne možete otkazati rezervaciju koja je već prošla." };
  }

  await prisma.$transaction([
    prisma.rezervacije.update({
      where: { id: idRezervacije },
      data: {
        datumOtkazivanja: new Date(),
        doktorOtkazao:    true,
      },
    }),
    prisma.termin.update({
      where: { id: rezervacija.idTermina },
      data:  { status: "SLOBODAN" },
    }),
  ]);

  return { poruka: "Rezervacija otkazana od strane osoblja." };
}

export async function getSlobodniTerminiDoktora(idDoktor: number) {
  const rezultati = await prisma.termin.findMany({
    where: {
      idDoktor,
      status: "SLOBODAN",
      datum: { gte: new Date() }
    },
    orderBy: { datum: 'asc' }
  });

  return rezultati.map(normalizujTermin);
}

// ─── 5. Kreiranje termina za pacijenta ───────────────────────────────────────

export async function kreirajTerminZaPacijentomService(input: KreirajTerminInput) {
  const { idTermina, idDoktor, idPacijent, idTipPregleda, komentar, hitnost = false } = input;

  const pacijent = await prisma.pacijent.findUnique({
    where: { idKorisnik: idPacijent },
  });
  if (!pacijent) throw { status: 404, poruka: "Pacijent nije pronađen." };

  const doktor = await prisma.doktor.findUnique({ where: { id: idDoktor } });
  if (!doktor) throw { status: 404, poruka: "Doktor nije pronađen." };

  const termin = await prisma.termin.findFirst({
    where: { id: idTermina, idDoktor, status: "SLOBODAN" },
  });
  if (!termin) throw { status: 409, poruka: "Odabrani termin više nije slobodan ili ne postoji." };

  const [novaRezervacija] = await prisma.$transaction([
    prisma.rezervacije.create({
      data: {
        idTermina:        termin.id,
        idPacijent:       pacijent.id,
        idDoktor,
        idTipPregleda:    idTipPregleda ?? null,
        komentar:         komentar ?? null,
        hitnost,
        doktorRezervisao: true,
      },
      include: {
        termin: true,
        pacijent: { include: { korisnik: { select: { ime: true, prezime: true, email: true, brojTelefona: true , datumRodjenja: true, } } } },
        doktor: { include: { korisnik: { select: { ime: true, prezime: true } }, odjel: true,soba: true, } },
        tipPregleda: true,
        soba: true
      }
    }),
    prisma.termin.update({
      where: { id: termin.id },
      data:  { status: "ZAKAZAN" },
    }),
  ]);

  return normalizujRezervaciju(novaRezervacija);
}

// ─── 6. Upload PDF nalaza ─────────────────────────────────────────────────────

// ─── 6. Upload PDF nalaza ─────────────────────────────────────────────────────
// ZAMIJENI cijelu ovu funkciju u osobljeService.ts
// Razlika: prima idRezervacije umjesto idHistorije.
// Ako historijaPregleda još ne postoji (pregled nije završen), kreira je automatski.

export async function dodajNalazService(
  idRezervacije: number,
  naziv:         string,
  opis:          string | undefined,
  base64String:  string,
  mimeType:      string,
  
) {
  if (mimeType !== "application/pdf") {
    throw { status: 400, poruka: "Dozvoljeni su samo PDF fajlovi." };
  }

  const rezervacija = await prisma.rezervacije.findUnique({
    where: { id: idRezervacije },
  });
  if (!rezervacija) {
    throw { status: 404, poruka: "Rezervacija nije pronađena." };
  }

  if (rezervacija.datumOtkazivanja !== null) {
    throw { status: 400, poruka: "Ne možete dodati nalaz otkazanoj rezervaciji." };
  }

  // Pronađi postojeću historiju ili je kreiraj — bez obzira je li pregled završen
  let historija = await prisma.historijaPregleda.findFirst({
    where: { idRezervacija: idRezervacije },
  });

  if (!historija) {
    historija = await prisma.historijaPregleda.create({
      data: {
        idRezervacija: idRezervacije,
        idPacijent:    rezervacija.idPacijent,
        idDoktor:      rezervacija.idDoktor,
        datumPregleda: new Date(),
        dijagnoza:     "",   // ← dodati
      terapija:      "",   // ← dodati
      },
    });
  }

  const pdfBuffer = Buffer.from(base64String, "base64");

  let nalaz;
  if (historija.idNalaz) {
    // Ažuriraj postojeći nalaz
    nalaz = await prisma.nalaz.update({
      where: { id: historija.idNalaz },
      data: {
        naziv,
        opis:          opis ?? null,
        dokumentPDF:   pdfBuffer,
        vrijemeNalaza: new Date(),
      },
    });
  } else {
    // Kreiraj novi nalaz i poveži ga s historijom
    nalaz = await prisma.nalaz.create({
      data: {
        naziv,
        opis:        opis ?? null,
        dokumentPDF: pdfBuffer,
      },
    });

    await prisma.historijaPregleda.update({
      where: { id: historija.id },
      data:  { idNalaz: nalaz.id },
    });
  }

  const { dokumentPDF: _, ...nalazBezPDF } = nalaz;
  return nalazBezPDF;
}

// ─── 7. Lista nalaza pacijenta ────────────────────────────────────────────────

export async function getNalaziPacijentaService(idPacijenta: number) {
  return prisma.historijaPregleda.findMany({
    where: {
      idPacijent: idPacijenta,
      idNalaz:    { not: null },
    },
    include: {
      nalaz: {
        select: {
          id:            true,
          naziv:         true,
          vrijemeNalaza: true,
          opis:          true,
        },
      },
      doktor: {
        include: {
          korisnik: { select: { ime: true, prezime: true } },
        },
      },
    },
    orderBy: { datumPregleda: "desc" },
  });
}

// ─── 8. Dohvati PDF za prikaz ────────────────────────────────────────────────

export async function getNalazPDFService(idNalaza: number) {
  const nalaz = await prisma.nalaz.findUnique({
    where: { id: idNalaza },
    select: { id: true, naziv: true, dokumentPDF: true },
  });

  if (!nalaz) {
    throw { status: 404, poruka: "Nalaz nije pronađen." };
  }

  if (!nalaz.dokumentPDF) {
    throw { status: 404, poruka: "PDF fajl nije dostupan za ovaj nalaz." };
  }

  return nalaz;
}

// ─── 9. Otkazani termini ──────────────────────────────────────────────────────

export async function getOtkazaniTerminiService(datum?: Date) {
  const where: any = {
    datumOtkazivanja: { not: null },
  };

  if (datum) {
    const pocetakDana = new Date(datum);
    pocetakDana.setUTCHours(0, 0, 0, 0);

    const krajDana = new Date(datum);
    krajDana.setUTCHours(23, 59, 59, 999);

    where.termin = {
      datum: { gte: pocetakDana, lte: krajDana },
    };
  }

  const rezultati = await prisma.rezervacije.findMany({
    where,
    include: {
      termin: true,
      pacijent: {
        include: {
          korisnik: {
            select: {
              id: true,
              ime: true,
              prezime: true,
              brojTelefona: true,
              email: true,
              datumRodjenja: true,
            },
          },
        },
      },
      doktor: {
        include: {
          korisnik: { select: { id: true, ime: true, prezime: true } },
          odjel: true,
          soba: true,
        },
      },
      tipPregleda: true,
      soba: true,
      historija: {
        include: { nalaz: { select: { id: true, naziv: true, vrijemeNalaza: true, opis: true } } }
      },
    },
    orderBy: { datumOtkazivanja: "desc" },
  });

  return rezultati.map(normalizujRezervaciju);
}

// ─── 10. Hitni termini ────────────────────────────────────────────────────────

export async function getHitniTerminiService() {
  const rezultati = await prisma.rezervacije.findMany({
    where: {
      datumOtkazivanja: null,
      zavrseno: false,
      OR: [
        { hitnost: true },
        { tipPregleda: { naziv: "Hitni pregled" } }
      ]
    },
    include: {
      termin: true,
      pacijent: {
        include: {
          korisnik: {
            select: {
              id: true,
              ime: true,
              prezime: true,
              brojTelefona: true,
              email: true,
              datumRodjenja: true,
            },
          },
        },
      },
      doktor: {
        include: {
          korisnik: { select: { id: true, ime: true, prezime: true } },
          odjel: true,
          soba: true,
        },
      },
      tipPregleda: true,
      soba: true,
      historija: {
        include: { nalaz: { select: { id: true, naziv: true, vrijemeNalaza: true, opis: true } } }
      },
    },
    orderBy: { termin: { datum: "asc" } },
  });

  return rezultati.map(normalizujRezervaciju);
}

// ─── 11. Završeni pregledi ────────────────────────────────────────────────────

export async function getZavrseniPregledService(idPacijenta?: number) {
  const rezultati = await prisma.rezervacije.findMany({
    where: {
      zavrseno:  true,
      ...(idPacijenta !== undefined && { idPacijent: idPacijenta }),
    },
    include: {
      termin: true,
      pacijent: {
        include: {
          korisnik: {
            select: {
              ime:           true,
              prezime:       true,
              brojTelefona:  true,
              email:         true,
              datumRodjenja: true,
            },
          },
        },
      },
      doktor: {
        include: {
          korisnik: { select: { ime: true, prezime: true } },
        },
      },
      tipPregleda: true,
      historija:   true,
    },
    orderBy: { termin: { datum: "desc" } },
  });

  return rezultati.map(normalizujRezervaciju);
}

// ─── 12. Označi rezervaciju kao hitnu ────────────────────────────────────────

export async function postaviHitnostService(idRezervacije: number, hitnost: boolean) {
  const rezervacija = await prisma.rezervacije.findUnique({
    where: { id: idRezervacije },
  });

  if (!rezervacija) {
    throw { status: 404, poruka: "Rezervacija nije pronađena." };
  }

  if (rezervacija.datumOtkazivanja !== null) {
    throw { status: 400, poruka: "Ne možete mijenjati hitnost otkazane rezervacije." };
  }

  if (rezervacija.zavrseno) {
    throw { status: 400, poruka: "Ne možete mijenjati hitnost završene rezervacije." };
  }

  if (rezervacija.hitnost === hitnost) {
    const stanje = hitnost ? "već označena kao hitna" : "već nije označena kao hitna";
    throw { status: 400, poruka: `Rezervacija je ${stanje}.` };
  }

  return prisma.rezervacije.update({
    where: { id: idRezervacije },
    data:  { hitnost },
    include: {
      termin: true,
      pacijent: {
        include: {
          korisnik: { select: { ime: true, prezime: true } },
        },
      },
      doktor: {
        include: {
          korisnik: { select: { ime: true, prezime: true } },
        },
      },
    },
  });
}

// ─── 13. Sve liste za novi termin modal ───────────────────────────────────────

export async function getAllPacijentiService() {
  return prisma.pacijent.findMany({
    include: {
      korisnik: {
        select: {
          id: true, ime: true, prezime: true,
          email: true, brojTelefona: true, datumRodjenja: true,
        },
      },
    },
    orderBy: { korisnik: { prezime: 'asc' } },
  });
}

export async function getAllDoktoriService() {
  return prisma.doktor.findMany({
    include: {
      korisnik: { select: { id: true, ime: true, prezime: true } },
      odjel: true,
      soba: true,
    },
    orderBy: { korisnik: { prezime: 'asc' } },
  });
}

export async function getAllOdjeliService() {
  return prisma.odjel.findMany({
    orderBy: { naziv: 'asc' },
  });
}

export async function getAllSobeService() {
  return prisma.soba.findMany({
    orderBy: [{ sprat: 'asc' }, { naziv: 'asc' }],
  });
}

export async function getTipoviPregledaService() {
  return prisma.tipPregleda.findMany({
    orderBy: { naziv: 'asc' },
  });
}

export async function getAllTerminiService() {
  const rezultati = await prisma.rezervacije.findMany({
    include: {
      termin: true,
      pacijent: {
        include: {
          korisnik: {
            select: {
              id: true, ime: true, prezime: true,
              email: true, brojTelefona: true, datumRodjenja: true,
            },
          },
        },
      },
      doktor: {
        include: {
          korisnik: { select: { id: true, ime: true, prezime: true } },
          odjel: true,
          soba: true,
        },
      },
      tipPregleda: true,
      soba: true,
      historija: {
        include: {
          nalaz: { select: { id: true, naziv: true, vrijemeNalaza: true, opis: true } }
        }
      },
    },
    orderBy: [
      { termin: { datum: 'asc' } },
      { termin: { vrijeme: 'asc' } },
    ],
  });

  return rezultati.map(normalizujRezervaciju);
}

export async function getSlobodniTerminiDoktoraService(idDoktor: number, datum: string) {
  const pocetakDana = new Date(datum);
  pocetakDana.setUTCHours(0, 0, 0, 0);
  const krajDana = new Date(datum);
  krajDana.setUTCHours(23, 59, 59, 999);

  const rezultati = await prisma.termin.findMany({
    where: {
      idDoktor,
      status: 'SLOBODAN',
      datum: { gte: pocetakDana, lte: krajDana },
    },
    orderBy: { vrijeme: 'asc' },
  });

  return rezultati.map(normalizujTermin);
}
export async function getSlobodniDatumiDoktoraService(idDoktor: number): Promise<string[]> {
  const danas = new Date();
  danas.setUTCHours(0, 0, 0, 0);
 
  const za60Dana = new Date(danas);
  za60Dana.setUTCDate(za60Dana.getUTCDate() + 60);
 
  const termini = await prisma.termin.findMany({
    where: {
      idDoktor,
      status: "SLOBODAN",
      datum: { gte: danas, lte: za60Dana },
    },
    select: { datum: true },
    orderBy: { datum: "asc" },
  });
 
  // Dedupliciraj — isti dan može imati više termina, vraćamo samo distinkt datume
  const unique = [...new Set(termini.map(t => normalizujDatum(t.datum)))];
  return unique;
}
 