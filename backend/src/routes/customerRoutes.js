const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { vehicles: true },
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Müşteri verileri alınamadı' });
  }
});

// Hareket geçmişi olan son müşterileri getir
router.get('/active', async (req, res) => {
  try {
    const activeCustomers = await prisma.customer.findMany({
      where: {
        OR: [
          { transactions: { some: {} } },
          { invoices: { some: {} } }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      take: 8
    });
    res.json(activeCustomers);
  } catch (error) {
    res.status(500).json({ error: 'Aktif müşteriler alınamadı' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, vehicles, balance } = req.body;
    const customer = await prisma.customer.create({
      data: { 
        name, 
        phone, 
        balance: parseFloat(balance) || 0,
        vehicles: {
          create: vehicles && Array.isArray(vehicles) ? vehicles.map(v => ({
            plate: v.plate,
            model: v.model || null
          })) : []
        }
      },
      include: { vehicles: true }
    });
    if (req.io) req.io.emit('dataChanged');
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Müşteri eklenirken hata oluştu' });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicles, balance } = req.body;
    
    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        name,
        phone,
        balance: balance !== undefined ? parseFloat(balance) : undefined,
        vehicles: {
          deleteMany: {},
          create: vehicles && Array.isArray(vehicles) ? vehicles.map(v => ({
            plate: v.plate,
            model: v.model || null
          })) : []
        }
      },
      include: { vehicles: true }
    });
    if (req.io) req.io.emit('dataChanged');
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Müşteri güncellenirken hata oluştu' });
  }
});

router.get('/:id/transactions', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        transactions: {
          include: {
            vehicle: true,
            invoice: {
              include: {
                items: {
                  include: {
                    product: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        vehicles: true
      }
    });
    if (!customer) return res.status(404).json({ error: 'Müşteri bulunamadı' });
    res.json(customer);
  } catch(error) {
    res.status(500).json({ error: 'Hareketler getirilemedi' });
  }
});

module.exports = router;
