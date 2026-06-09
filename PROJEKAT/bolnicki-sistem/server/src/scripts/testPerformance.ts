import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPerformance() {
  console.log('📊 Pokrećem performansni test nad 50.000 zapisa...');

  // Pokrećemo EXPLAIN ANALYZE preko Prisme
  const result = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE 
    SELECT * FROM "AuditLog" 
    WHERE "tipAkcije" = 'LOGIN' 
    ORDER BY "vrijemeAkcije" DESC 
    LIMIT 10;
  `);

  console.log('--- REZULTAT ANALIZE ---');
  console.log(result);
  console.log('------------------------');
}

testPerformance()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());