const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetUsers() {
  try {
    console.log('Mevcut kullanıcılar siliniyor...');
    await prisma.user.deleteMany({});
    
    console.log('Yeni Merkas kullanıcısı oluşturuluyor...');
    const hashedPassword = await bcrypt.hash('merkas123', 10);
    
    const user = await prisma.user.create({
      data: {
        username: 'Merkas',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('İşlem başarılı!');
    console.log('Kullanıcı Adı:', user.username);
    console.log('Şifre: merkas123');
  } catch (error) {
    console.error('Hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUsers();
