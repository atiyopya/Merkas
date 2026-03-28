const prisma = require('./src/prismaClient');

// Plaka üreteci (Türk plakası formatı: 42 KV 123)
function generatePlate() {
  const letters = 'ABCDEFGHIJKLMNOPRSTUVYZ';
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `42 ${l1}${l2} ${num}`;
}

async function main() {
  console.log('--- Veri Ekleme İşlemi Başladı ---');

  // 1. Mevcut carilere en az 10 araç ekle
  const existingCustomers = await prisma.customer.findMany();
  console.log(`${existingCustomers.length} mevcut cariye araç ekleniyor...`);

  for (const customer of existingCustomers) {
    const currentVehicles = await prisma.vehicle.count({ where: { customerId: customer.id } });
    const toAdd = Math.max(0, 10 - currentVehicles);
    if (toAdd > 0) {
      console.log(`${customer.name} için ${toAdd} araç ekleniyor...`);
      for (let i = 0; i < toAdd; i++) {
        await prisma.vehicle.create({
          data: {
            plate: generatePlate(),
            model: 'Mercedes Travego',
            customerId: customer.id
          }
        });
      }
    }
  }

  // 2. KONYA TURİZM carisi aç
  let konyaTurizm = await prisma.customer.findFirst({ where: { name: 'KONYA TURİZM' } });
  if (!konyaTurizm) {
    konyaTurizm = await prisma.customer.create({
      data: {
        name: 'KONYA TURİZM',
        phone: '0332 123 45 67',
        balance: 0
      }
    });
    console.log('KONYA TURİZM carisi oluşturuldu.');
  }

  // 3. KONYA TURİZM için 50 araç ekle
  console.log('KONYA TURİZM için 50 araç ekleniyor...');
  const konyaVehicles = [];
  for (let i = 0; i < 50; i++) {
    const v = await prisma.vehicle.create({
      data: {
        plate: generatePlate(),
        model: Math.random() > 0.5 ? 'Mercedes Travego' : 'Setra S415',
        customerId: konyaTurizm.id
      }
    });
    konyaVehicles.push(v);
  }

  // 4. Genel Usta carisi aç (Firma Borcu için)
  let usta = await prisma.customer.findFirst({ where: { name: 'USTA MEHMET' } });
  if (!usta) {
    usta = await prisma.customer.create({
      data: {
        name: 'USTA MEHMET',
        balance: 0
      }
    });
    console.log('USTA MEHMET carisi oluşturuldu.');
  }

  // 5. Ürünleri al
  const products = await prisma.product.findMany();
  if (products.length === 0) {
    console.error('HATA: Veritabanında ürün bulunamadı. Lütfen önce ürün ekleyin.');
    return;
  }

  // 6. KONYA TURİZM araçları için satış ve firma borcu işlemleri
  console.log('Satış ve firma borcu işlemleri yapılıyor...');
  const paymentMethods = ['CASH', 'POS', 'MAIL_ORDER', 'VERESIYE'];

  for (const vehicle of konyaVehicles) {
    const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = 1;
    const unitPrice = product.sellPrice || 1000;
    const totalAmount = unitPrice * quantity;

    // A. Satış (Invoice + Transaction)
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          customerId: konyaTurizm.id,
          totalAmount: totalAmount,
          vehicleId: vehicle.id,
          items: {
            create: [{
              productId: product.id,
              quantity: quantity,
              unitPrice: unitPrice,
              totalPrice: totalAmount
            }]
          }
        }
      });

      const transactionType = method === 'VERESIYE' ? 'DEBT' : 'PAYMENT';
      await tx.transaction.create({
        data: {
          customerId: konyaTurizm.id,
          invoiceId: invoice.id,
          amount: totalAmount,
          type: transactionType,
          method: method,
          vehicleId: vehicle.id,
          description: `${product.name} satışı`
        }
      });

      if (method === 'VERESIYE') {
        await tx.customer.update({
          where: { id: konyaTurizm.id },
          data: { balance: { increment: totalAmount } }
        });
      }

      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: quantity } }
      });

      await tx.stockMovement.create({
        data: {
          productId: product.id,
          quantity: -quantity,
          type: 'SATIŞ',
          description: `Otomatik Satış (ID: ${invoice.id})`,
          customerId: konyaTurizm.id
        }
      });

      // B. Firma Borcu (İşçilik)
      const laborCost = Math.floor(500 + Math.random() * 1500);
      
      // Ustaya borçlanıyoruz (Bakiye düşer çünkü negatife giderse borç demek)
      await tx.customer.update({
        where: { id: usta.id },
        data: { balance: { decrement: laborCost } }
      });

      await tx.transaction.create({
        data: {
          customerId: usta.id,
          type: 'EXPENSE',
          amount: laborCost,
          method: 'BORC_ISCILIK',
          description: `${vehicle.plate} işçilik borcu`,
          vehicleId: vehicle.id
        }
      });

      // Konya Turizm'e yansıtıyoruz (Bakiye artar çünkü bize borçlanıyor)
      await tx.customer.update({
        where: { id: konyaTurizm.id },
        data: { balance: { increment: laborCost } }
      });

      await tx.transaction.create({
        data: {
          customerId: konyaTurizm.id,
          amount: laborCost,
          type: 'DEBT',
          method: 'YANSIMA_BORC',
          description: `İşçilik Yansıması - ${usta.name} - ${vehicle.plate}`,
          vehicleId: vehicle.id
        }
      });
    });
  }

  console.log('--- Veri Ekleme İşlemi Başarıyla Tamamlandı ---');
}

main()
  .catch(e => {
    console.error('HATA OLUŞTU:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
