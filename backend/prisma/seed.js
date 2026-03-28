const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Eski kullanıcıları temizle (isteğe bağlı ama temiz veri için iyi)
  await prisma.user.deleteMany({});
  
  const password = await bcrypt.hash('merkas123', 10);
  
  const users = [
    { username: 'Ahmet', password, role: 'USER' },
    { username: 'Ethem', password, role: 'USER' },
    { username: 'Muharrem', password, role: 'USER' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: { password: user.password },
      create: user,
    });
    console.log(`User ${user.username} created/updated.`);
  }

  // Örnek müşteriler ekle
  const sampleCustomers = [
    {
      name: 'ÖMER FARUK',
      phone: '05551234567',
      vehicles: {
        create: [
          { plate: '34ABC123', model: 'Fiat Egea' },
          { plate: '34XYZ789', model: 'Honda Civic' }
        ]
      }
    },
    {
      name: 'MEHMET CAN',
      phone: '05449876543',
      vehicles: {
        create: [
          { plate: '06ANK06', model: 'Toyota Corolla' }
        ]
      }
    }
  ];

  for (const cust of sampleCustomers) {
    await prisma.customer.create({
      data: cust
    });
    console.log(`Sample customer ${cust.name} created.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
