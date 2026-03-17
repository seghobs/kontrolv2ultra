#!/bin/bash

# Kontrol Project Auto Setup - Tek Komutla Kurulum
# Kullanım: bash -c "$(curl -sL https://raw.githubusercontent.com/seghobs/kontrolv2ultra/main/setup.sh)"

echo "========================================="
echo "Kontrol Projesi Otomatik Kuruluyor..."
echo "========================================="

# Mevcut kontrol klasörünü yedekle
if [ -d "kontrol" ]; then
    echo "Eski kontrol klasörü yedekleniyor..."
    mv kontrol kontrol_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null
fi

# Projeyi GitHub'dan indir
echo "Proje indiriliyor..."
git clone https://github.com/seghobs/kontrolv2ultra.git kontrol

if [ ! -d "kontrol" ]; then
    echo "HATA: Proje indirilemedi!"
    exit 1
fi

cd kontrol

# PythonAnywhere veya Linux sistemi kontrolü
if command -v pip3 &> /dev/null; then
    echo "Pip bulundu, paketler yükleniyor..."
    pip3 install -r requirements.txt 2>/dev/null || pip install -r requirements.txt 2>/dev/null
fi

# Dosya izinleri
echo "İzinler ayarlanıyor..."
chmod -R 755 .
chmod -R 777 data/ logs/ 2>/dev/null
chmod 600 *.json 2>/dev/null

# .env dosyası kontrolü
if [ ! -f ".env" ]; then
    echo ".env dosyası oluşturuluyor..."
    echo "SECRET_KEY=kontrol_secret_key_$(date +%s)" > .env
fi

# Veritabanı klasörü kontrolü
mkdir -p data logs

echo ""
echo "========================================="
echo "Kurulum TAMAMLANDI!"
echo "========================================="
echo ""
echo "Projeyi başlatmak için:"
echo "  cd kontrol"
echo "  python flask_app.py"
echo ""
echo "Veya tek komutla:"
echo "  cd kontrol && python flask_app.py"
echo ""
