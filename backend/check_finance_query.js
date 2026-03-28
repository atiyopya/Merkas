const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQuery() {
  const startDateStr = '2026-03-27T20:59:59.999Z'; // what backend gets for end of day 27th local

  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: {
        lte: new Date(startDateStr)
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('Transactions with lte 2026-03-27 (UTC equivalent):', transactions.slice(0, 5).map(t => ({ id: t.id, date: t.createdAt })));
  
  const all = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log('\nAll latest transactions:', all.slice(0, 5).map(t => ({ id: t.id, date: t.createdAt })));
  
}

testQuery().catch(console.error).finally(() => prisma.$disconnect());
