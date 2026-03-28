const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.post('/', async (req, res) => {
  try {
    const backupDir = "G:/Drive'ım/Merkas_Yedek";
    const sourceDb = path.join(__dirname, '../../prisma/dev.db');
    
    // Klasör yoksa oluştur
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const targetPath = path.join(backupDir, `merkas_yedek_${timestamp}.db`);
    
    // Veritabanını kopyala
    fs.copyFileSync(sourceDb, targetPath);
    
    console.log(`[BACKUP] Veritabanı başarıyla yedeklendi: ${targetPath}`);
    res.json({ success: true, path: targetPath });
  } catch (error) {
    console.error('[BACKUP ERROR]', error);
    res.status(500).json({ error: 'Yedekleme sırasında hata oluştu' });
  }
});

module.exports = router;
