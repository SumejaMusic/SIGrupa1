import { prisma } from "./prisma.js";

const TEST_PATIENT_EMAIL = process.env.TEST_PATIENT_EMAIL ?? "pacijent@test.com";
const TEST_KORISNIK_ID = Number(process.env.TEST_KORISNIK_ID);

export const getCurrentPacijent = async () => {
  if (Number.isInteger(TEST_KORISNIK_ID) && TEST_KORISNIK_ID > 0) {
    const pacijentById = await prisma.pacijent.findFirst({
      where: { idKorisnik: TEST_KORISNIK_ID },
      include: { korisnik: true },
    });

    if (pacijentById) {
      return pacijentById;
    }
  }

  const pacijentByEmail = await prisma.pacijent.findFirst({
    where: {
      korisnik: {
        email: TEST_PATIENT_EMAIL,
      },
    },
    include: { korisnik: true },
  });

  if (pacijentByEmail) {
    return pacijentByEmail;
  }

  return prisma.pacijent.findFirst({
    include: { korisnik: true },
    orderBy: { id: "asc" },
  });
};

export const getCurrentKorisnikId = async () => {
  const pacijent = await getCurrentPacijent();
  return pacijent?.idKorisnik ?? null;
};
