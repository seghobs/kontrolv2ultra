#!/bin/bash

# Kontrol Project Setup Script

echo "Kontrol Projesi Kuruluyor..."

# Projeyi GitHub'dan indir
if [ -d "kontrol" ]; then
    echo "Kontrol klasörü zaten mevcut, güncelleniyor..."
    cd kontrol
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null
else
    echo "Proje indiriliyor..."
    git clone https://github.com/seghobs/kontrolv2ultra.git kontrol
    cd kontrol
fi

# Gerekli dosyalara yazma izni ver
echo "Dosya izinleri ayarlanıyor..."
chmod -R 755 .
chmod -R 777 data/ logs/ 2>/dev/null

echo "Kurulum tamamlandı!"
echo "Projeyi çalıştırmak için: cd kontrol && python app.py"
