const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/', async (req, res) => {
  try {
    const models = await prisma.carModel.findMany({ orderBy: { name: 'asc' } });
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Modeller alınamadı' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const model = await prisma.carModel.create({ data: { name } });
    res.status(201).json(model);
  } catch (error) {
    res.status(500).json({ error: 'Model eklenirken hata oluştu veya bu model zaten var.' });
  }
});

module.exports = router;
