# Kontrol v2 Ultra

Instagram yorum kontrol ve token yonetim paneli.

## Ozellikler

- Flask tabanli web arayuzu
- Admin panelinden token ekleme/guncelleme/silme
- Token gecerlilik kontrolu ve otomatik pasife alma
- Yorum kontrolu icin aktif ve calisan token secimi
- Instagram DM grubundan uye cekme
- Gruptaki paylasimlari cekme (bugun/dun)
- Genel muaf liste (tum kontrollerde muaf)
- Detayli eksik raporu (kullanici hangi postta eksik)
- Kullanicinin kendi paylastigi postta eksik sayilmaz
- GMT+3 saat destegi

## Kurulum

### Tek Komutla Kurulum (Linux/Bash/PythonAnywhere)

```bash
bash -c "$(curl -sL https://raw.githubusercontent.com/seghobs/kontrolv2ultra/main/setup.sh)"
```

### Manuel Kurulum

```bash
git clone https://github.com/seghobs/kontrolv2ultra.git kontrol
cd kontrol
pip install -r requirements.txt
python flask_app.py
```

## Kullanim

Tarayici ac:

```
http://localhost:5000
```

Admin panel:

```
http://localhost:5000/admin
```

## Proje Yapisi

- `flask_app.py`: Uygulama giris noktasi
- `app_core/`: Backend kodlari
  - `routes/`: Route dosyalari
  - `storage.py`: SQLite islemleri
  - `instagram_api.py`: Instagram API islemleri
- `templates/`: HTML dosyalari
- `static/js/`: JavaScript dosyalari
