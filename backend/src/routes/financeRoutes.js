const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('[FINANCE /summary] query:', req.query);
    
    let whereClause = {};
    const isAll = startDate === 'ALL' || endDate === 'ALL';

    if (isAll) {
      // Hiçbir filtre uygulama
    } else if (startDate || endDate) {
      whereClause.createdAt = {};
      
      if (startDate) {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) whereClause.createdAt.gte = s;
        else console.error('[FINANCE] Invalid startDate parsing:', startDate);
      }
      if (endDate) {
        const e = new Date(endDate);
        if (!isNaN(e.getTime())) whereClause.createdAt.lte = e;
        else console.error('[FINANCE] Invalid endDate parsing:', endDate);
      }
    } else {
      // Default: Bu ayın başından itibaren (Yerel saatle)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      whereClause.createdAt = { gte: startOfMonth };
    }
    console.log('[FINANCE /summary] prisma whereClause:', whereClause.createdAt);

    const transactions = await prisma.transaction.findMany({
      where: whereClause
    });

    // Veresiye (Müşteri Borcu) ve Firma Borcu (Bizim Borcumuz) hesapla
    const customers = await prisma.customer.findMany();
    const totalVeresiye = customers.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0);
    const totalCompanyDebt = customers.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0);

    const summary = {
      Gelir_Nakit: 0,
      Gelir_POS: 0,
      Gelir_MailOrder: 0,
      Veresiye: totalVeresiye,
      
      Gider_Nakit: 0,
      Gider_POS: 0,
      Gider_MailOrder: 0,
      FirmaBorcu: totalCompanyDebt
    };

    transactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        if (t.method === 'CASH') summary.Gider_Nakit += t.amount;
        else if (t.method === 'POS') summary.Gider_POS += t.amount;
        else if (t.method === 'MAIL_ORDER') summary.Gider_MailOrder += t.amount;
      } else {
        if (t.method === 'CASH') summary.Gelir_Nakit += t.amount;
        else if (t.method === 'POS') summary.Gelir_POS += t.amount;
        else if (t.method === 'MAIL_ORDER') summary.Gelir_MailOrder += t.amount;
      }
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Finans özeti alınamadı' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('[FINANCE /history] query:', req.query);
    
    let whereClause = {};
    const isAll = startDate === 'ALL' || endDate === 'ALL';

    if (isAll) {
      // Filtre yok
    } else if (startDate || endDate) {
      whereClause.createdAt = {};
      
      if (startDate) {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) whereClause.createdAt.gte = s;
        else console.error('[FINANCE] Invalid startDate parsing:', startDate);
      }
      if (endDate) {
        const e = new Date(endDate);
        if (!isNaN(e.getTime())) whereClause.createdAt.lte = e;
        else console.error('[FINANCE] Invalid endDate parsing:', endDate);
      }
    } else {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      whereClause.createdAt = { gte: startOfMonth };
    }
    console.log('[FINANCE /history] prisma whereClause:', whereClause.createdAt);

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } }
      }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'İşlem geçmişi alınamadı' });
  }
});

router.post('/payment', async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, vehicleId } = req.body;
    
    // 1. Müşteriyi bul
    const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId) }});
    if (!customer) return res.status(404).json({ error: 'Müşteri bulunamadı' });

    // 2. Tahsilat kaydı ekle
    const transaction = await prisma.transaction.create({
      data: {
        customerId: parseInt(customerId),
        type: 'INCOME',
        amount: parseFloat(amount),
        method: paymentMethod, // 'CASH', 'POS', 'MAIL_ORDER'
        vehicleId: vehicleId ? parseInt(vehicleId) : null
      }
    });

    // 3. Müşteri bakiyesini düş
    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(customerId) },
      data: { balance: { decrement: parseFloat(amount) } }
    });

    if (req.io) req.io.emit('dataChanged');
    res.json({ transaction, customer: updatedCustomer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Tahsilat işlemi sırasında hata oluştu' });
  }
});

router.post('/add-debt', async (req, res) => {
  try {
    const { customerId, amount, category, description, relatedCustomerId, vehicleId } = req.body;
    
    const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId) }});
    if (!customer) return res.status(404).json({ error: 'Firma/Cari bulunamadı' });

    const methodType = category === 'İŞÇİLİK' ? 'BORC_ISCILIK' : 'BORC_PARCA';

    const transaction = await prisma.transaction.create({
      data: {
        customerId: parseInt(customerId),
        type: 'EXPENSE',
        amount: parseFloat(amount),
        method: methodType,
        description: description || null,
        vehicleId: vehicleId ? parseInt(vehicleId) : null
      }
    });

    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(customerId) },
      data: { balance: { decrement: parseFloat(amount) } }
    });

    if (category === 'İŞÇİLİK' && relatedCustomerId) {
      await prisma.customer.update({
        where: { id: parseInt(relatedCustomerId) },
        data: { balance: { increment: parseFloat(amount) } }
      });
      await prisma.transaction.create({
        data: {
          customerId: parseInt(relatedCustomerId),
          amount: parseFloat(amount),
          type: 'DEBT',
          method: 'YANSIMA_BORC',
          description: `İşçilik Yansıması - ${customer.name}`,
          vehicleId: vehicleId ? parseInt(vehicleId) : null
        }
      });
    }

    if (req.io) req.io.emit('dataChanged');
    res.json({ transaction, customer: updatedCustomer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Borç ekleme sırasında hata oluştu' });
  }
});

router.post('/pay-debt', async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, vehicleId } = req.body;
    
    const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId) }});
    if (!customer) return res.status(404).json({ error: 'Firma/Cari bulunamadı' });

    const transaction = await prisma.transaction.create({
      data: {
        customerId: parseInt(customerId),
        type: 'EXPENSE',
        amount: parseFloat(amount),
        method: paymentMethod,
        vehicleId: vehicleId ? parseInt(vehicleId) : null
      }
    });

    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(customerId) },
      data: { balance: { increment: parseFloat(amount) } }
    });

    if (req.io) req.io.emit('dataChanged');
    res.json({ transaction, customer: updatedCustomer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ödeme işlemi sırasında hata oluştu' });
  }
});

module.exports = router;
