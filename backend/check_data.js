const prisma = require('./src/prismaClient');

async function main() {
  const customers = await prisma.customer.findMany({ 
    take: 5,
    select: { id: true, name: true }
  });
  const products = await prisma.product.findMany({ 
    take: 5,
    select: { id: true, name: true, code: true, sellPrice: true }
  });
  const vehicles = await prisma.vehicle.findMany({ take: 1 });
  
  console.log(JSON.stringify({ customers, products, hasVehicles: vehicles.length > 0 }, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
