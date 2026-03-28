const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log('Travego stok verileri yüklenmeye başlanıyor...');

  // 1. Travego Modelini Oluştur/Bul
  const travegoModel = await prisma.carModel.upsert({
    where: { name: 'TRAVEGO' },
    update: {},
    create: { name: 'TRAVEGO' }
  });

  const parts = [
    // GRUP 1: EURO 5
    { name: 'Piston ve Gömlek Seti (Takım) - Euro 5', code: 'A4570305017' },
    { name: 'Silindir Kapak Contası (Üst Takım) - Euro 5', code: 'A4570161520' },
    { name: 'Ana Yatak Takımı (STD) - Euro 5', code: 'A4570300040' },
    { name: 'Kol Yatak Takımı (STD) - Euro 5', code: 'A4570300160' },
    { name: 'Enjektör Memesi - Euro 5', code: '0433271466' },
    { name: 'Yağ Pompası - Euro 5', code: 'A4571800101' },
    { name: 'Su Pompası (Devirdaim) - Euro 5', code: 'A4572002101' },
    { name: 'Turboşarj (OM 457) - Euro 5', code: 'A4570962299' },
    { name: 'Yağ Filtresi - Euro 5', code: 'A0001802909' },
    { name: 'Mazot Filtresi - Euro 5', code: 'A0004771302' },
    { name: 'Hava Filtresi - Euro 5', code: 'A0040941704' },
    { name: 'V-Kayışı (Ana Tahrik) - Euro 5', code: 'A0029933596' },

    // GRUP 2: EURO 6
    { name: 'Piston ve Gömlek Seti (Takım) - Euro 6', code: 'A4700300817' },
    { name: 'Silindir Kapak Contası - Euro 6', code: 'A4700160220' },
    { name: 'Euro 6 Enjektör Ünitesi', code: 'A4700700587' },
    { name: 'Turboşarj - Euro 6', code: 'A4700961199' },
    { name: 'Su Pompası - Euro 6', code: 'A4702000801' },
    { name: 'Yağ Soğutucu (Radyatör) - Euro 6', code: 'A4701800165' },
    { name: 'Yağ Filtresi - Euro 6', code: 'A4701800009' },
    { name: 'Mazot Filtresi - Euro 6', code: 'A4710901752' },
    { name: 'AdBlue Filtresi', code: 'A0001421089' },
    { name: 'Hava Filtresi - Euro 6', code: 'A0040943504' },

    // GRUP 3: ŞANZIMAN VE DEBRİYAJ
    { name: 'Debriyaj Baskısı (430mm)', code: 'A0072528114' },
    { name: 'Debriyaj Balatası (430mm)', code: 'A0012503203' },
    { name: 'Debriyaj Rulmanı', code: 'A0022506415' },
    { name: 'Debriyaj Alt Merkezi (Silindir)', code: 'A0002540047' },
    { name: 'Debriyaj Üst Merkezi (Pedal Altı)', code: 'A0012954106' },
    { name: 'Prizdirek Mili (G210-250)', code: 'A9452626002' },
    { name: 'Senkromenç Halkası (1-2 Vites)', code: 'A9452622723' },
    { name: 'Şanzıman Yağ Pompası', code: 'A9472691010' },
    { name: 'Şanzıman Arka Keçesi', code: 'A0239971647' },
    { name: 'Vites Kulesi Tamir Takımı', code: 'A0002604998' },

    // GRUP 4: FREN VE HAVA SİSTEMİ
    { name: 'Hava Kurutucu Filtre (Kurutucu)', code: 'A0004295697' },
    { name: 'Hava Kompresörü (Çift Silindirli)', code: 'A4711306015' },
    { name: 'Fren Müşürü', code: 'A0025453914' },
    { name: 'Tahliye Valfi (Dörtlü Dağıtıcı)', code: 'A0034316806' }
  ];

  for (const part of parts) {
    try {
      await prisma.product.upsert({
        where: { code: part.code },
        update: {
          compatibleModels: {
            connect: { id: travegoModel.id }
          }
        },
        create: {
          name: part.name.toLocaleUpperCase('tr-TR'),
          code: part.code,
          brand: 'MERCEDES-BENZ',
          stock: 0,
          buyPrice: 0,
          sellPrice: 0,
          compatibleModels: {
            connect: { id: travegoModel.id }
          }
        }
      });
      console.log(`- Ürün eklendi/güncellendi: ${part.name}`);
    } catch (e) {
      console.error(`Hata (${part.code}):`, e.message);
    }
  }

  console.log('\n✅ Tüm Travego parçaları başarıyla sisteme yüklendi!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
