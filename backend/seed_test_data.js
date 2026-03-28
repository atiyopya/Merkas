const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Veriler temizleniyor...');

  // Deletion order (child to parent)
  await prisma.invoiceItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.user.deleteMany();

  console.log('Eski veriler temizlendi.');

  // 0. Kullanıcılar
  const bcrypt = require('bcryptjs');
  const password = await bcrypt.hash('admin123', 10);
  
  await prisma.user.createMany({
    data: [
      { username: 'Ahmet', password, role: 'ADMIN' },
      { username: 'Ethem', password, role: 'USER' },
      { username: 'Muharrem', password, role: 'USER' },
    ]
  });
  console.log('Kullanıcılar eklendi (Şifre: admin123).');

  // 1. Stoklar (Otobüs Parçaları - 10 adet)
  const products = [
    { name: 'Mercedes Travego Ön Fren Balatası', brand: 'Beral', code: 'STK001', stock: 50, buyPrice: 1200, sellPrice: 1850 },
    { name: 'Setra S415 Hava Filtresi', brand: 'Mann', code: 'STK002', stock: 30, buyPrice: 450, sellPrice: 750 },
    { name: 'MAN Fortuna Debriyaj Seti', brand: 'Sachs', code: 'STK003', stock: 5, buyPrice: 8500, sellPrice: 12000 },
    { name: 'Temsa Safir Vantilatör Kayışı', brand: 'Gates', code: 'STK004', stock: 100, buyPrice: 150, sellPrice: 350 },
    { name: 'Retarder Soğutma Yağı (20L)', brand: 'Mobil', code: 'STK005', stock: 20, buyPrice: 2200, sellPrice: 3200 },
    { name: 'Otobüs İç Aydınlatma LED (Beyaz)', brand: 'Hella', code: 'STK006', stock: 200, buyPrice: 45, sellPrice: 120 },
    { name: 'Silecek Süpürgesi (Büyük Tip)', brand: 'Bosch', code: 'STK007', stock: 60, buyPrice: 300, sellPrice: 550 },
    { name: 'Körük Lastiği (Arka Sol)', brand: 'Contitech', code: 'STK008', stock: 15, buyPrice: 1800, sellPrice: 2600 },
    { name: 'Marş Motoru Kömürü', brand: 'Valeo', code: 'STK009', stock: 40, buyPrice: 80, sellPrice: 250 },
    { name: 'Mazot Filtresi (Euro 6)', brand: 'Mahle', code: 'STK010', stock: 80, buyPrice: 550, sellPrice: 950 },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }
  console.log('Stoklar eklendi.');

  // 2. Turizm Firmaları (Cari - 10 adet)
  const tourismCompanies = [
    { name: 'KAMİL KOÇ TURİZM', phone: '444 0 562', vehicles: ['34 KK 001', '34 KK 002', '34 KK 003'] },
    { name: 'METRO TURİZM', phone: '0850 222 34 55', vehicles: ['34 MT 500', '34 MT 501'] },
    { name: 'VARAN TURİZM', phone: '444 8 999', vehicles: ['06 VRN 06', '06 VRN 07'] },
    { name: 'PAMUKKALE TURİZM', phone: '0850 333 35 35', vehicles: ['35 PK 01', '35 PK 02', '35 PK 03'] },
    { name: 'NİLÜFER TURİZM', phone: '0850 222 00 99', vehicles: ['16 NL 100', '16 NL 101'] },
    { name: 'ALİ OSMAN ULUSOY', phone: '0850 532 88 88', vehicles: ['61 AO 061', '61 AO 062'] },
    { name: 'SAHİL SEYAHAT', phone: '444 0 053', vehicles: ['53 SH 53', '53 SH 54'] },
    { name: 'ISPARTA PETROL', phone: '444 34 32', vehicles: ['32 IP 100', '32 IP 101'] },
    { name: 'LÜKS ARTVİN', phone: '444 0 008', vehicles: ['08 LA 008', '08 LA 009'] },
    { name: 'GÜNEY AKDENİZ', phone: '444 0 007', vehicles: ['07 GA 007', '07 GA 008'] },
  ];

  for (const company of tourismCompanies) {
    const customer = await prisma.customer.create({
      data: {
        name: company.name,
        phone: company.phone,
        balance: 0
      }
    });

    for (const plate of company.vehicles) {
      await prisma.vehicle.create({
        data: {
          plate: plate,
          model: 'Otobüs',
          customerId: customer.id
        }
      });
    }
  }
  console.log('Turizm firmaları ve araçları eklendi.');

  // 3. Ek Cariler (Servis Sağlayıcılar - 5 adet)
  const serviceProviders = [
    { name: 'ÖZGÜR MOTOR REVİZYON', phone: '0532 000 00 01' },
    { name: 'TEKNİK TORNACI AHMET', phone: '0532 000 00 02' },
    { name: 'YAĞCI HÜSEYİN VE OĞULLARI', phone: '0532 000 00 03' },
    { name: 'ELEKTRİKÇİ SALİH USTA', phone: '0532 000 00 04' },
    { name: 'KAPORTACI METİN', phone: '0532 000 00 05' },
  ];

  for (const s of serviceProviders) {
    await prisma.customer.create({
      data: {
        name: s.name,
        phone: s.phone,
        balance: 0
      }
    });
  }
  console.log('Servis sağlayıcı cariler eklendi.');

  console.log('Tüm veriler başarıyla yüklendi. Test edebilirsiniz!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
