const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log('O403 özel parça kataloğu yükleniyor...');

  // O403 Modelini bul
  const o403Model = await prisma.carModel.upsert({
    where: { name: 'O403' },
    update: {},
    create: { name: 'O403' }
  });

  const parts = [
    // GRUP 1: MOTOR AKSAMI
    { name: 'Piston ve Gömlek Seti (Tekli) - O403', code: 'A4420300917', sellPrice: 6800 },
    { name: 'Silindir Kapak Contası (Tekli) - O403', code: 'A4420161420', sellPrice: 1100 },
    { name: 'Ana Yatak Takımı (STD) - O403', code: 'A4420300040', sellPrice: 5200 },
    { name: 'Kol Yatak Takımı (STD) - O403', code: 'A4420300160', sellPrice: 4600 },
    { name: 'Emme Supabı - O403', code: 'A4420530401', sellPrice: 450 },
    { name: 'Egzoz Supabı - O403', code: 'A4420500405', sellPrice: 550 },
    { name: 'Su Pompası (Devirdaim) - O403', code: 'A4422001101', sellPrice: 9400 },
    { name: 'Yağ Pompası - O403', code: 'A4421801201', sellPrice: 11800 },
    { name: 'Turboşarj (K36 Tipi) - O403', code: 'A0040964799', sellPrice: 38000 },
    { name: 'Enjektör Memesi - O403', code: 'A0018448201', sellPrice: 1450 },
    { name: 'V-Kayışı (Takım) - O403', code: 'A0089977292', sellPrice: 2600 },

    // GRUP 2: ŞANZIMAN VE DEBRİYAJ
    { name: 'Debriyaj Baskısı (430mm) - O403', code: 'A0062503204', sellPrice: 16200 },
    { name: 'Debriyaj Balatası (430mm) - O403', code: 'A0052509103', sellPrice: 12800 },
    { name: 'Debriyaj Rulmanı - O403', code: 'A0022505015', sellPrice: 6400 },
    { name: 'Debriyaj Alt Merkezi (Silindir) - O403', code: 'A0002542508', sellPrice: 7200 },
    { name: 'Debriyaj Üst Merkezi (Silindir) - O403', code: 'A0012954206', sellPrice: 4800 },
    { name: 'Prizdirek Mili (ZF) - O403', code: 'A0002621002', sellPrice: 11500 },
    { name: 'Senkromenç Halkası (1-2 Vites) - O403', code: 'A0002624534', sellPrice: 3200 },
    { name: 'Şanzıman Arka Keçesi - O403', code: 'A0199974247', sellPrice: 1150 },

    // GRUP 3: FİLTRE VE BAKIM
    { name: 'Yağ Filtresi (Metal Kapaklı) - O403', code: 'A0001802109', sellPrice: 750 },
    { name: 'Mazot Filtresi (Takım) - O403', code: 'A0004771502', sellPrice: 950 },
    { name: 'Hava Filtresi - O403', code: 'A0030946204', sellPrice: 1850 },
    { name: 'Su Filtresi - O403', code: 'A0002040219', sellPrice: 850 },
    { name: 'Hava Kurutucu Filtre (Wabco Tip) - O403', code: 'A0004290897', sellPrice: 1400 }
  ];

  for (const part of parts) {
    const buyPrice = part.sellPrice * 0.90;
    
    try {
      await prisma.product.upsert({
        where: { code: part.code },
        update: {
          buyPrice: buyPrice,
          sellPrice: part.sellPrice,
          stock: 6,
          compatibleModels: {
            connect: { id: o403Model.id }
          }
        },
        create: {
          name: part.name.toLocaleUpperCase('tr-TR'),
          brand: 'MERCEDES-BENZ',
          code: part.code,
          stock: 6,
          buyPrice: buyPrice,
          sellPrice: part.sellPrice,
          compatibleModels: {
            connect: { id: o403Model.id }
          }
        }
      });
      console.log(`- Ürün eklendi/güncellendi: ${part.name}`);
    } catch (e) {
      console.error(`Hata (${part.code}):`, e.message);
    }
  }

  console.log('\n✅ O403 özel parça kataloğu başarıyla yüklendi!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
