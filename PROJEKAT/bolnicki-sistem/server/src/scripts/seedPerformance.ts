import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seed() {
  console.log('🚀 Započinjem generisanje 50.000 audit logova za NFR-20 test...');

  // 1. Prvo nam treba barem jedan korisnik za kojeg ćemo vezati logove
  let testKorisnik = await prisma.korisnik.findFirst();
  
  if (!testKorisnik) {
    console.log('Nema korisnika u bazi, kreiram jednog testnog...');
    testKorisnik = await prisma.korisnik.create({
      data: {
        jmbg: '1234567890123',
        jmbgHash: faker.string.uuid(),
        ime: 'Test',
        prezime: 'User',
        datumRodjenja: new Date('1990-01-01'),
        email: 'performance.test@bolnica.ba',
        pristupnaSifra: 'password123',
        uloga: 'ADMINISTRATOR'
      }
    });
  }

  const BROJ_ZAPISA = 50000;
  const VELICINA_GRUPE = 5000; 

  console.time('⏱️ Vrijeme punjenja baze');

  for (let i = 0; i < BROJ_ZAPISA; i += VELICINA_GRUPE) {
    const logs = Array.from({ length: VELICINA_GRUPE }).map(() => ({
      idKorisnika: testKorisnik!.id,
      tipAkcije: faker.helpers.arrayElement(['LOGIN', 'UPDATE_TERMIN', 'CREATE_RESERV', 'VIEW_PROFILE', 'DELETE_LOG']),
      izmenjenaTabela: faker.helpers.arrayElement(['Korisnik', 'Termin', 'Rezervacije', 'Pacijent']),
      stariPodaci: faker.lorem.sentence(),
      noviPodaci: faker.lorem.sentence(),
      ipAdresa: faker.internet.ip(),
      vrijemeAkcije: faker.date.past(),
    }));

    // createMany je najbrža metoda u Prismi
    await prisma.auditLog.createMany({
      data: logs,
    });

    console.log(`✅ Uneseno: ${i + VELICINA_GRUPE} audit logova...`);
  }

  console.timeEnd('⏱️ Vrijeme punjenja baze');
  console.log('⭐ Baza je spremna za testiranje performansi!');
}

seed()
  .catch((e) => {
    console.error('❌ Greška:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });