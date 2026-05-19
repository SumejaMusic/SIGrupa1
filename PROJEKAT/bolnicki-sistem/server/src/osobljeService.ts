// src/services/osobljeService.ts
//
// Sva poslovna logika za medicinski panel.
// Kontroler je tanak sloj (HTTP) — service sadrži sve provjere i Prisma upite.

import { prisma } from "./lib/prisma.js";
//import { posaljiOtkazivanjeMail } from "./emailService.js";

// ─── Tipovi ───────────────────────────────────────────────────────────────────

export interface KreirajTerminInput {
  idTermina:      number;  // ← ovo mora postojati
  idDoktor:      number;
  idPacijent:    number; // ovo je idKorisnik pacijenta — iz JWT-a
  idTipPregleda?: number;
  
  komentar?:     string;
  hitnost?:      boolean;
}

// ─── 1. Dnevni termini ────────────────────────────────────────────────────────
// Vraća sve aktivne rezervacije za traženi datum.
// "Aktivne" znači: nisu otkazane (datumOtkazivanja: null) i nisu završene.
// Sortiramo po termin.vrijeme (minuti od ponoći) rastuće.

export async function getDnevniTerminiService(datum: Date) {
  const pocetakDana = new Date(datum);
  pocetakDana.setUTCHours(0, 0, 0, 0);

  const krajDana = new Date(datum);
  krajDana.setUTCHours(23, 59, 59, 999);

  return prisma.rezervacije.findMany({
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
          id: true,           // ← DODAJ
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
      korisnik: { select: { id: true, ime: true, prezime: true } }, // ← id
      odjel: true,   // ← DODAJ (frontend čita apt.doktor.odjel.naziv)
      soba: true,  // ← OVDJE, ne na vrhu
    },
  },
  tipPregleda: true,
  soba: true,        // ← DODAJ
  historija: {       // ← DODAJ
    include: { nalaz: { select: { id: true, naziv: true, vrijemeNalaza: true, opis: true } } }
  },
},
    orderBy: { termin: { vrijeme: "asc" } },
  });
}

// ─── 2. Pretraga po imenu pacijenta ──────────────────────────────────────────
// Pretražuje i po imenu i po prezimenu (OR) — case-insensitive putem Prisma mode.
// Vraća samo aktivne rezervacije.

export async function pretragaTerminaService(ime: string) {
  return prisma.rezervacije.findMany({
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
        },
      },
      tipPregleda: true,
    },
    orderBy: { datumKreiranja: "desc" },
  });
}

// ─── 3. Detalji jedne rezervacije ────────────────────────────────────────────
// ACC kriterij: prikazuje ime/prezime, telefon, tip pregleda, komentar.
// Vraća null ako ne postoji — kontroler šalje 404.

export async function getDetaljiTerminaService(idRezervacije: number) {
  return prisma.rezervacije.findUnique({
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
          soba:     true,
        },
      },
      tipPregleda: true,
    },
  });
}

// ─── 4. Otkazivanje termina od strane osoblja ─────────────────────────────────
// ACC kriterij:
//   - Oslobađa termin (status → SLOBODAN)
//   - Šalje email pacijentu sa kontakt telefonom
//   - Nema vremenskog ograničenja (osoblje može otkazati bilo kada)
//   - doktorOtkazao: true — postojeće polje u Rezervacije modelu
//
// $transaction osigurava atomičnost: ili obje operacije prođu ili nijedna.
// Email se šalje VAN transakcije — ako email server padne, otkazivanje ostaje
// zabilježeno u bazi i osoblje može ručno kontaktirati pacijenta.

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

  // Atomično: ažuriramo rezervaciju i oslobađamo termin
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

  // Email šaljemo nakon transakcije — greška emaila ne poništava otkazivanje
  /*try {
    await posaljiOtkazivanjeMail(
      rezervacija.pacijent.korisnik.email,
      rezervacija.pacijent.korisnik.ime,
      rezervacija.termin.datum,
      rezervacija.termin.vrijeme
    );
  } catch (emailErr) {
    console.error("Email obavijest o otkazivanju nije poslana:", emailErr);
  }*/

  return { poruka: "Rezervacija otkazana od strane osoblja." };
}

// ─── 5. Kreiranje termina za pacijenta ───────────────────────────────────────
// ACC kriterij: osoblje unosi podatke → termin odmah postaje ZAKAZAN.
// doktorRezervisao: true označava da osoblje/doktor je kreator, ne pacijent.
//
// idPacijent koji dolazi iz body-a je idKorisnik (iz JWT-a osoblja).
// Moramo naći Pacijent zapis koji odgovara tom korisniku.
//
// $transaction osigurava da kreiranje rezervacije i zauzimanje termina
// budu atomične — ne može se desiti da termin ostane SLOBODAN a rezervacija se kreira.

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
  if (!termin) throw { status: 409, poruka: "Odabrani termin nije slobodan ili ne postoji." };

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
    }),
    prisma.termin.update({
      where: { id: termin.id },
      data:  { status: "ZAKAZAN" },
    }),
  ]);

  return novaRezervacija;
}
// ─── 6. Upload PDF nalaza ─────────────────────────────────────────────────────
// ACC kriterij: samo PDF dozvoljen, čuva se trajno, vezan za historiju pregleda.
//
// base64String dolazi iz req.body.fajl — klijent konvertuje fajl u base64.
// Buffer.from(base64, "base64") pretvara u Buffer koji Prisma Bytes polje prihvata.
//
// Ako historija već ima nalaz, ažuriramo ga (ne kreiramo duplikat).
// PDF se NE vraća u odgovoru — samo metadata (naziv, opis, vrijemeNalaza).

export async function dodajNalazService(
  idHistorije:  number,
  naziv:        string,
  opis:         string | undefined,
  base64String: string,
  mimeType:     string
) {
  if (mimeType !== "application/pdf") {
    throw { status: 400, poruka: "Dozvoljeni su samo PDF fajlovi." };
  }

  const historija = await prisma.historijaPregleda.findUnique({
    where: { id: idHistorije },
  });
  if (!historija) {
    throw { status: 404, poruka: "Historija pregleda nije pronađena." };
  }

  // Konvertujemo base64 → Buffer (Prisma Bytes = Node.js Buffer)
  const pdfBuffer = Buffer.from(base64String, "base64");

  let nalaz;
  if (historija.idNalaz) {
    // Historija već ima nalaz — ažuriramo ga
    nalaz = await prisma.nalaz.update({
      where: { id: historija.idNalaz },
      data: {
        naziv,
        opis:         opis ?? null,
        dokumentPDF:  pdfBuffer,
        vrijemeNalaza: new Date(),
      },
    });
  } else {
    // Kreiramo novi nalaz i vežemo ga za historiju
    nalaz = await prisma.nalaz.create({
      data: {
        naziv,
        opis:        opis ?? null,
        dokumentPDF: pdfBuffer,
      },
    });

    await prisma.historijaPregleda.update({
      where: { id: idHistorije },
      data:  { idNalaz: nalaz.id },
    });
  }

  // Vraćamo metadata bez PDF-a — preveliko za HTTP response
  const { dokumentPDF: _, ...nalazBezPDF } = nalaz;
  return nalazBezPDF;
}

// ─── 7. Lista nalaza pacijenta ────────────────────────────────────────────────
// Vraća samo historije pregleda koje imaju nalaz (idNalaz !== null).
// dokumentPDF namjerno nije uključen — koristiti GET /nalazi/:id/pdf za to.

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
          // dokumentPDF namjerno NIJE ovdje
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
// Vraća nalaz sa dokumentPDF bytes.
// Kontroler postavlja Content-Type: application/pdf i Content-Disposition: inline
// što tjera preglednik da otvori PDF u novom tabu (ACC kriterij).

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
// Vraća rezervacije koje imaju datumOtkazivanja !== null.
// Sortiramo od najnovijeg otkazivanja ka starijem.
// Opcionalni filter: datum (samo otkazani za taj dan).

export async function getOtkazaniTerminiService(datum?: Date) {
  const where: any = {
    datumOtkazivanja: { not: null }, // Uslov: termin MORA biti otkazan
  };

  if (datum) {
    // Kreiramo početak dana u čistom UTC-u (00:00:00.000)
    const pocetakDana = new Date(datum);
    pocetakDana.setUTCHours(0, 0, 0, 0);

    // Kreiramo kraj dana u čistom UTC-u (23:59:59.999)
    const krajDana = new Date(datum);
    krajDana.setUTCHours(23, 59, 59, 999);

    where.termin = {
      datum: { gte: pocetakDana, lte: krajDana },
    };
  }

  return prisma.rezervacije.findMany({
    where,
    include: {
  termin: true,
  pacijent: {
    include: {
      korisnik: {
        select: {
          id: true,           // ← DODAJ
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
      korisnik: { select: { id: true, ime: true, prezime: true } }, // ← id
      odjel: true,   // ← DODAJ (frontend čita apt.doktor.odjel.naziv)
      soba: true,  // ← OVDJE, ne na vrhu
    },
  },
  tipPregleda: true,
  soba: true,        // ← DODAJ
  historija: {       // ← DODAJ
    include: { nalaz: { select: { id: true, naziv: true, vrijemeNalaza: true, opis: true } } }
  },
},
    orderBy: { datumOtkazivanja: "desc" }, // Najnovije otkazani termini izlaze prvi
  });
}

// ─── 10. Hitni termini ────────────────────────────────────────────────────────
// Vraća sve aktivne (neotkazane, nezavršene) rezervacije označene kao hitne.
// Sortiramo po datumu termina rastuće — najhitniji/najskori su prvi.

export async function getHitniTerminiService() {
  return prisma.rezervacije.findMany({
    where: {
      hitnost:          true,
      datumOtkazivanja: null,
      zavrseno:         false,
    },
    include: {
  termin: true,
  pacijent: {
    include: {
      korisnik: {
        select: {
          id: true,           // ← DODAJ
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
      korisnik: { select: { id: true, ime: true, prezime: true } }, // ← id
      odjel: true,   // ← DODAJ (frontend čita apt.doktor.odjel.naziv)
      soba: true,  // ← OVDJE, ne na vrhu
    },
    soba: true,  // ← ovo ostavi za direktnu sobu na rezervaciji
  },
  tipPregleda: true,
  soba: true,        // ← DODAJ
  historija: {       // ← DODAJ
    include: { nalaz: { select: { id: true, naziv: true, vrijemeNalaza: true, opis: true } } }
  },
},
    orderBy: { termin: { datum: "asc" } },
  });
}

// ─── 11. Završeni pregledi ────────────────────────────────────────────────────
// Vraća rezervacije označene kao zavrseno: true.
// Opcionalni filter: idPacijenta — za pregled historije jednog pacijenta.
// Sortiramo od najnovijeg ka starijem.

export async function getZavrseniPregledService(idPacijenta?: number) {
  return prisma.rezervacije.findMany({
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
}

// ─── 12. Označi rezervaciju kao hitnu ────────────────────────────────────────
// Naknadno postavljanje hitnosti na postojećoj rezervaciji.
// Nije moguće za otkazane ili već završene rezervacije.
// hitnost: true → postavlja hitnu, false → uklanja hitnost (toggle).

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
export async function getAllTerminiService() {
  return prisma.rezervacije.findMany({
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
          soba: true,  // ← OVDJE, ne na vrhu
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
}
export async function getSlobodniTerminiDoktoraService(idDoktor: number, datum: string) {
  const pocetakDana = new Date(datum);
  pocetakDana.setUTCHours(0, 0, 0, 0);
  const krajDana = new Date(datum);
  krajDana.setUTCHours(23, 59, 59, 999);

  return prisma.termin.findMany({
    where: {
      idDoktor,
      status: 'SLOBODAN',
      datum: { gte: pocetakDana, lte: krajDana },
    },
    orderBy: { vrijeme: 'asc' },
  });
}