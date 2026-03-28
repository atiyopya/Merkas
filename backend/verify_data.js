const prisma = require('./src/prismaClient');

async function main() {
  const konya = await prisma.customer.findFirst({ where: { name: 'KONYA TURİZM' } });
  const usta = await prisma.customer.findFirst({ where: { name: 'USTA MEHMET' } });
  
  const vCount = await prisma.vehicle.count({ where: { customerId: konya.id } });
  const tCount = await prisma.transaction.count({ where: { customerId: konya.id } });
  const uCount = await prisma.transaction.count({ where: { customerId: usta.id } });
  
  console.log(JSON.stringify({
    konya: {
      name: konya.name,
      balance: konya.balance,
      vehicleCount: vCount,
      transactionCount: tCount
    },
    usta: {
      name: usta.name,
      balance: usta.balance,
      transactionCount: uCount
    }
  }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
