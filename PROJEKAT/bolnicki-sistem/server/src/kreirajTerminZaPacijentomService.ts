import { prisma } from "./lib/prisma.js";
export interface KreirajTerminInput {
  idTermina:      number;   // ← direktno, ne datum+vrijemeMinute
  idDoktor:       number;
  idPacijent:     number;   // idKorisnik pacijenta
  idTipPregleda?: number;
  komentar?:      string;
  hitnost?:       boolean;
}

export async function kreirajTerminZaPacijentomService(input: KreirajTerminInput) {
  const { idTermina, idDoktor, idPacijent, idTipPregleda, komentar, hitnost = false } = input;

  const pacijent = await prisma.pacijent.findUnique({ where: { idKorisnik: idPacijent } });
  if (!pacijent) throw { status: 404, poruka: "Pacijent nije pronađen." };

  const termin = await prisma.termin.findUnique({ where: { id: idTermina } });
  if (!termin) throw { status: 404, poruka: "Termin nije pronađen." };
  if (termin.status !== 'SLOBODAN') throw { status: 409, poruka: "Termin više nije slobodan." };
  if (termin.idDoktor !== idDoktor) throw { status: 400, poruka: "Termin ne pripada ovom doktoru." };

  const [novaRezervacija] = await prisma.$transaction([
    prisma.rezervacije.create({
      data: {
        idTermina,
        idPacijent:       pacijent.id,
        idDoktor,
        idTipPregleda:    idTipPregleda ?? null,
        komentar:         komentar ?? null,
        hitnost,
        doktorRezervisao: true,
      },
    }),
    prisma.termin.update({
      where: { id: idTermina },
      data:  { status: 'ZAKAZAN' },
    }),
  ]);

  return novaRezervacija;
}