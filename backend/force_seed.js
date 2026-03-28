const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL // Seeding için direkt bağlantı daha güvenli
    }
  }
});

async function main() {
  console.log('Veritabanına bağlanılıyor...');
  
  const password = await bcrypt.hash('merkas123', 10);
  
  const users = [
    { username: 'Ahmet', password, role: 'USER' },
    { username: 'Ethem', password, role: 'USER' },
    { username: 'Muharrem', password, role: 'USER' },
  ];

  for (const user of users) {
    const upserted = await prisma.user.upsert({
      where: { username: user.username },
      update: { password: user.password },
      create: user,
    });
    console.log(`- Kullanıcı ${upserted.username} yüklendi.`);
  }

  console.log('Seeding başarıyla tamamlandı.');
}

main()
  .catch(e => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
