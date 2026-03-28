@echo off
chcp 65001 >nul
title Merkas Ticaret Otomasyonu
echo ===================================================
echo     MERKAS TİCARET OTOMASYONU BAŞLATILIYOR...
echo ===================================================
echo.
echo Lütfen açilan iki siyah pencereyi (Backend/Frontend) kapatmayin.
echo Otomasyonu kullanirken arka planda calismaya devam etmelidirler.
echo.

set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0"

echo [1/2] Api/Veritabani (Backend) sunucusu baslatiliyor...
start "Merkas Backend (KAPATMAYIN)" cmd /k "cd backend && title Merkas Backend && node src/index.js"

echo [2/2] Ekran/Arayuz (Frontend) sunucusu baslatiliyor...
start "Merkas Ekran (KAPATMAYIN)" cmd /k "cd frontend && title Merkas Frontend && node node_modules\vite\bin\vite.js --host"

echo.
echo Sunucular basariyla tetiklendi! 
echo Sistemin tamamen ayaga kalkmasi icin 5 saniye bekleniyor...
timeout /t 5 >nul

echo Tarayici otomatik olarak aciliyor...
start http://localhost:5173
exit
