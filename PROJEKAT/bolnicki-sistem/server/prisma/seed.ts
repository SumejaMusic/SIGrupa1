
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Pokretanje seed-a...");

  const createFutureDate = (daysAhead: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // ─────────────────────────────────────────────
  // Odjel
  // ─────────────────────────────────────────────
  const odjel = await prisma.odjel.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      naziv: "Opća medicina",
      opis: "Testni odjel opće medicine",
    },
  });

  const odjel2 = await prisma.odjel.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      naziv: "Pedijatrija",
      opis: "Odjel pedijatrije",
    },
  });

  const odjel3 = await prisma.odjel.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      naziv: "Kardiologija",
      opis: "Odjel kardiologije",
    },
  });

  console.log("Odjeli kreirani:", odjel.naziv, ",", odjel2.naziv, ",", odjel3.naziv);

  // ─────────────────────────────────────────────
  // Sobe
  // ─────────────────────────────────────────────
  const soba = await prisma.soba.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      naziv: "Ordinacija 1",
      tip: "ORDINACIJA",
      sprat: 1,
      kapacitet: 2,
      opis: "Testna ordinacija",
      statusSobe: "AKTIVNA",
    },
  });

  const soba2 = await prisma.soba.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      naziv: "Ordinacija 2",
      tip: "ORDINACIJA",
      sprat: 1,
      kapacitet: 2,
      opis: "Pedijatrijska ordinacija",
      statusSobe: "AKTIVNA",
    },
  });

  const soba3 = await prisma.soba.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      naziv: "Ordinacija 3",
      tip: "ORDINACIJA",
      sprat: 2,
      kapacitet: 2,
      opis: "Kardiološka ordinacija",
      statusSobe: "AKTIVNA",
    },
  });

  console.log("Sobe kreirane:", soba.naziv, ",", soba2.naziv, ",", soba3.naziv);

  // ─────────────────────────────────────────────
  // Korisnik — Doktor
  // ─────────────────────────────────────────────
  const korisnikDoktor = await prisma.korisnik.upsert({
    where: { email: "doktor@test.com" },
    update: {},
    create: {
      jmbg: "1234567890123",
      ime: "Mirza",
      prezime: "Hodžić",
      datumRodjenja: new Date("1980-01-01"),
      email: "doktor@test.com",
      pristupnaSifra: "hash_placeholder",
      brojTelefona: "61111111",
      datumRegistracije: new Date(),
      brojNeuspjelihPrijava: 0,
      uloga: "DOKTOR",
    },
  });

  // ─────────────────────────────────────────────
  // Doktor
  // ─────────────────────────────────────────────
  const doktor = await prisma.doktor.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idKorisnik: korisnikDoktor.id,
      idOdjela: odjel.id,
      idSobe: soba.id,
      brojPregleda: 0,
      brojLicence: 123456,
      specijalizacija: "Opća medicina",
      trajanjePregleda: 30,
    },
  });
  console.log("Doktor kreiran: Dr.", korisnikDoktor.prezime);

  // ─────────────────────────────────────────────
  // Doktor 2 — Pedijatrija
  // ─────────────────────────────────────────────
  const korisnikDoktor2 = await prisma.korisnik.upsert({
    where: { email: "doktor2@test.com" },
    update: {},
    create: {
      jmbg: "1234567890124",
      ime: "Fatima",
      prezime: "Softić",
      datumRodjenja: new Date("1985-03-10"),
      email: "doktor2@test.com",
      pristupnaSifra: "hash_placeholder",
      brojTelefona: "61111112",
      datumRegistracije: new Date(),
      brojNeuspjelihPrijava: 0,
      uloga: "DOKTOR",
    },
  });

  const doktor2 = await prisma.doktor.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      idKorisnik: korisnikDoktor2.id,
      idOdjela: odjel2.id,
      idSobe: soba2.id,
      brojPregleda: 0,
      brojLicence: 123457,
      specijalizacija: "Pedijatrija",
      trajanjePregleda: 30,
    },
  });
  console.log("Doktor 2 kreiran: Dr.", korisnikDoktor2.prezime);

  // ─────────────────────────────────────────────
  // Doktor 3 — Kardiologija
  // ─────────────────────────────────────────────
  const korisnikDoktor3 = await prisma.korisnik.upsert({
    where: { email: "doktor3@test.com" },
    update: {},
    create: {
      jmbg: "1234567890125",
      ime: "Nedim",
      prezime: "Beganović",
      datumRodjenja: new Date("1978-07-20"),
      email: "doktor3@test.com",
      pristupnaSifra: "hash_placeholder",
      brojTelefona: "61111113",
      datumRegistracije: new Date(),
      brojNeuspjelihPrijava: 0,
      uloga: "DOKTOR",
    },
  });

  const doktor3 = await prisma.doktor.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      idKorisnik: korisnikDoktor3.id,
      idOdjela: odjel3.id,
      idSobe: soba3.id,
      brojPregleda: 0,
      brojLicence: 123458,
      specijalizacija: "Kardiologija",
      trajanjePregleda: 45,
    },
  });
  console.log("Doktor 3 kreiran: Dr.", korisnikDoktor3.prezime);

  const sutra = new Date();
  sutra.setDate(sutra.getDate() + 1);
  sutra.setHours(0, 0, 0, 0);

  // ─────────────────────────────────────────────
  // Raspored doktora
  // ─────────────────────────────────────────────
  await prisma.rasporedDoktora.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idDoktor: doktor.id,
      danUSedmici: "UTORAK",
      vrijemeOd: new Date("2026-04-14T08:00:00"),
      vrijemeDo: new Date("2026-04-14T16:00:00"),
      datumOd: sutra,
      datumDo: null,
      aktivan: true,
    },
  });

  await prisma.rasporedDoktora.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      idDoktor: doktor2.id,
      danUSedmici: "UTORAK",
      vrijemeOd: new Date("2026-04-14T08:00:00"),
      vrijemeDo: new Date("2026-04-14T16:00:00"),
      datumOd: sutra,
      datumDo: null,
      aktivan: true,
    },
  });

  await prisma.rasporedDoktora.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      idDoktor: doktor3.id,
      danUSedmici: "UTORAK",
      vrijemeOd: new Date("2026-04-14T08:00:00"),
      vrijemeDo: new Date("2026-04-14T16:00:00"),
      datumOd: sutra,
      datumDo: null,
      aktivan: true,
    },
  });
  console.log("Rasporedi doktora kreirani");

  // ─────────────────────────────────────────────
  // Korisnik — Pacijent
  // ─────────────────────────────────────────────
  const korisnikPacijent = await prisma.korisnik.upsert({
    where: { email: "pacijent@test.com" },
    update: {
      ime: "Marko",
      prezime: "Markovic",
      brojTelefona: "62222222",
      uloga: "PACIJENT",
    },
    create: {
      jmbg: "876543210987",
      ime: "Marko",
      prezime: "Markovic",
      datumRodjenja: new Date("1995-05-15"),
      email: "pacijent@test.com",
      pristupnaSifra: "hash_placeholder",
      brojTelefona: "62222222",
      datumRegistracije: new Date(),
      brojNeuspjelihPrijava: 0,
      uloga: "PACIJENT",
    },
  });

  // ─────────────────────────────────────────────
  // Pacijent
  // ─────────────────────────────────────────────
  const pacijent = await prisma.pacijent.upsert({
    where: { idKorisnik: korisnikPacijent.id },
    update: {
      brojKnjizice: 111222333,
      hronicniBolesnik: false,
    },
    create: {
      idKorisnik: korisnikPacijent.id,
      brojKnjizice: 111222333,
      hronicniBolesnik: false,
    },
  });
  console.log("Pacijent kreiran:", korisnikPacijent.ime, korisnikPacijent.prezime);

  // ─────────────────────────────────────────────
  // Tipovi pregleda
  // ─────────────────────────────────────────────
  const tipPregleda = await prisma.tipPregleda.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      naziv: "Preventivni pregled",
      opis: "Standardni preventivni pregled",
      trajanjeMinuta: 30,
      zahtijevaSalu: false,
    },
  });

  const tipPregleda2 = await prisma.tipPregleda.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      naziv: "Kontrolni pregled",
      opis: "Kontrola stanja pacijenta",
      trajanjeMinuta: 30,
      zahtijevaSalu: false,
    },
  });

  const tipPregleda3 = await prisma.tipPregleda.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      naziv: "Hitni pregled",
      opis: "Hitan pregled",
      trajanjeMinuta: 20,
      zahtijevaSalu: false,
    },
  });

  console.log("Tipovi pregleda kreirani:", tipPregleda.naziv, ",", tipPregleda2.naziv, ",", tipPregleda3.naziv);

  // ─────────────────────────────────────────────
  // Slobodni termini
  // ─────────────────────────────────────────────
  // Kreiraj termine za dana 2 dana od sada

  // Termin 1 - 09:00 (540 minuta)
  const termin1 = await prisma.termin.upsert({
    where: { id: 1 },
    update: { status: "SLOBODAN" },
    create: {
      id: 1,
      idDoktor: doktor.id,
      datum: sutra,
      vrijeme: 540, // 09:00
      opis: "Jutarnji termin",
      status: "SLOBODAN",
    },
  });

  // Termin 2 - 09:30 (570 minuta)
  const termin2 = await prisma.termin.upsert({
    where: { id: 2 },
    update: { status: "SLOBODAN" },
    create: {
      id: 2,
      idDoktor: doktor.id,
      datum: sutra,
      vrijeme: 570, // 09:30
      opis: "Drugi jutarnji termin",
      status: "SLOBODAN",
    },
  });

  // Termin 3 - 10:00 (600 minuta)
  const termin3 = await prisma.termin.upsert({
    where: { id: 3 },
    update: { status: "SLOBODAN" },
    create: {
      id: 3,
      idDoktor: doktor.id,
      datum: sutra,
      vrijeme: 600, // 10:00
      opis: "Treći termin",
      status: "SLOBODAN",
    },
  });

  // Termin 4 - 14:00 (840 minuta)
  const termin4 = await prisma.termin.upsert({
    where: { id: 4 },
    update: { status: "SLOBODAN" },
    create: {
      id: 4,
      idDoktor: doktor.id,
      datum: sutra,
      vrijeme: 840, // 14:00
      opis: "Popodnevni termin",
      status: "SLOBODAN",
    },
  });

  // Termini za Doktor 2 (Pedijatrija)
  for (let i = 5; i < 9; i++) {
    await prisma.termin.upsert({
      where: { id: i },
      update: { status: "SLOBODAN" },
      create: {
        id: i,
        idDoktor: doktor2.id,
        datum: sutra,
        vrijeme: 540 + (i - 5) * 30,
        opis: `Termin doktora 2 - ${9 + Math.floor((i - 5) * 30 / 60)}:${String((i - 5) * 30 % 60).padStart(2, '0')}`,
        status: "SLOBODAN",
      },
    });
  }

  // Termini za Doktor 3 (Kardiologija)
  for (let i = 9; i < 13; i++) {
    await prisma.termin.upsert({
      where: { id: i },
      update: { status: "SLOBODAN" },
      create: {
        id: i,
        idDoktor: doktor3.id,
        datum: sutra,
        vrijeme: 540 + (i - 9) * 45,
        opis: `Termin doktora 3 - ${9 + Math.floor((i - 9) * 45 / 60)}:${String((i - 9) * 45 % 60).padStart(2, '0')}`,
        status: "SLOBODAN",
      },
    });
  }

  const korisnikDoktor4 = await prisma.korisnik.upsert({
    where: { email: "doktor4@test.com" },
    update: {},
    create: {
      jmbg: "1234567890126",
      ime: "Lejla",
      prezime: "Kovacevic",
      datumRodjenja: new Date("1987-06-11"),
      email: "doktor4@test.com",
      pristupnaSifra: "hash_placeholder",
      brojTelefona: "61111114",
      datumRegistracije: new Date(),
      brojNeuspjelihPrijava: 0,
      uloga: "DOKTOR",
    },
  });

  const doktor4 = await prisma.doktor.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      idKorisnik: korisnikDoktor4.id,
      idOdjela: odjel.id,
      idSobe: soba.id,
      brojPregleda: 0,
      brojLicence: 123459,
      specijalizacija: "Porodicna medicina",
      trajanjePregleda: 20,
    },
  });

  const korisnikDoktor5 = await prisma.korisnik.upsert({
    where: { email: "doktor5@test.com" },
    update: {},
    create: {
      jmbg: "1234567890127",
      ime: "Adnan",
      prezime: "Hasanovic",
      datumRodjenja: new Date("1982-09-05"),
      email: "doktor5@test.com",
      pristupnaSifra: "hash_placeholder",
      brojTelefona: "61111115",
      datumRegistracije: new Date(),
      brojNeuspjelihPrijava: 0,
      uloga: "DOKTOR",
    },
  });

  const doktor5 = await prisma.doktor.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      idKorisnik: korisnikDoktor5.id,
      idOdjela: odjel2.id,
      idSobe: soba2.id,
      brojPregleda: 0,
      brojLicence: 123460,
      specijalizacija: "Pedijatrijska endokrinologija",
      trajanjePregleda: 30,
    },
  });

  const korisnikDoktor6 = await prisma.korisnik.upsert({
    where: { email: "doktor6@test.com" },
    update: {},
    create: {
      jmbg: "1234567890128",
      ime: "Selma",
      prezime: "Imamovic",
      datumRodjenja: new Date("1979-12-15"),
      email: "doktor6@test.com",
      pristupnaSifra: "hash_placeholder",
      brojTelefona: "61111116",
      datumRegistracije: new Date(),
      brojNeuspjelihPrijava: 0,
      uloga: "DOKTOR",
    },
  });

  const doktor6 = await prisma.doktor.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      idKorisnik: korisnikDoktor6.id,
      idOdjela: odjel3.id,
      idSobe: soba3.id,
      brojPregleda: 0,
      brojLicence: 123461,
      specijalizacija: "Interventna kardiologija",
      trajanjePregleda: 45,
    },
  });

  await prisma.rasporedDoktora.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      idDoktor: doktor4.id,
      danUSedmici: "SRIJEDA",
      vrijemeOd: new Date("2026-04-14T08:00:00"),
      vrijemeDo: new Date("2026-04-14T14:00:00"),
      datumOd: sutra,
      datumDo: null,
      aktivan: true,
    },
  });

  await prisma.rasporedDoktora.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      idDoktor: doktor5.id,
      danUSedmici: "CETVRTAK",
      vrijemeOd: new Date("2026-04-14T09:00:00"),
      vrijemeDo: new Date("2026-04-14T15:00:00"),
      datumOd: sutra,
      datumDo: null,
      aktivan: true,
    },
  });

  await prisma.rasporedDoktora.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      idDoktor: doktor6.id,
      danUSedmici: "PETAK",
      vrijemeOd: new Date("2026-04-14T08:00:00"),
      vrijemeDo: new Date("2026-04-14T17:00:00"),
      datumOd: sutra,
      datumDo: null,
      aktivan: true,
    },
  });

  const additionalDoctors = [
    { doctorId: doktor.id, naziv: "Mirza Hodzic", trajanje: 30 },
    { doctorId: doktor2.id, naziv: "Fatima Softic", trajanje: 30 },
    { doctorId: doktor3.id, naziv: "Nedim Beganovic", trajanje: 45 },
    { doctorId: doktor4.id, naziv: "Lejla Kovacevic", trajanje: 20 },
    { doctorId: doktor5.id, naziv: "Adnan Hasanovic", trajanje: 30 },
    { doctorId: doktor6.id, naziv: "Selma Imamovic", trajanje: 45 },
  ];

  let terminId = 13;
  for (let daysAhead = 2; daysAhead <= 6; daysAhead++) {
    const targetDate = createFutureDate(daysAhead);

    for (const doctor of additionalDoctors) {
      for (let slot = 0; slot < 5; slot++) {
        const vrijeme = 480 + slot * doctor.trajanje;
        await prisma.termin.upsert({
          where: { id: terminId },
          update: {
            idDoktor: doctor.doctorId,
            datum: targetDate,
            vrijeme,
            opis: `Termin - ${doctor.naziv} - dan +${daysAhead}`,
            status: "SLOBODAN",
          },
          create: {
            id: terminId,
            idDoktor: doctor.doctorId,
            datum: targetDate,
            vrijeme,
            opis: `Termin - ${doctor.naziv} - dan +${daysAhead}`,
            status: "SLOBODAN",
          },
        });
        terminId++;
      }
    }
  }

  console.log("Termini kreirani za datum:", sutra.toISOString().split('T')[0]);
  console.log("Dodatni doktori kreirani:", doktor4.id, doktor5.id, doktor6.id);
  console.log("Ukupno seedovanih termina najmanje:", terminId - 1);

  console.log("\nSeed završen uspješno!");
  console.log("─────────────────────────────────");
  console.log("Test podaci:");
  console.log("  Doktor ID:   ", doktor.id);
  console.log("  Pacijent ID: ", pacijent.id);
  console.log("  Termin IDs:  ", termin1.id, termin2.id);
}

main()
  .catch((e) => {
    console.error("Seed greška:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });