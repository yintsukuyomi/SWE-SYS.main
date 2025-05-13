# SWE-SYS (Ders Programı Yönetim Sistemi)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.68%2B-blue)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-17%2B-blue)](https://reactjs.org/)

Modern ve kullanıcı dostu bir üniversite ders programı yönetim sistemi. Öğretmenler, dersler, sınıflar ve programların etkin yönetimini sağlar.

## 🌟 Özellikler

### 📚 Temel Özellikler
- Fakülte ve bölüm bazlı yönetim
- Öğretmen yönetimi (ekleme, düzenleme, silme)
- Ders yönetimi (ekleme, düzenleme, silme)
- Sınıf yönetimi (ekleme, düzenleme, silme)
- Program oluşturma ve yönetimi
- Otomatik program oluşturma

### 🔍 Gelişmiş Özellikler
- Gelişmiş filtreleme ve arama
- Rol tabanlı yetkilendirme (Admin ve normal kullanıcı)
- Responsive tasarım
- Excel ile toplu veri girişi
- Bildirim sistemi
- Aktivite takibi

## 🛠️ Teknolojiler

### Backend
- FastAPI - Modern, hızlı web framework
- SQLAlchemy - Güçlü ORM
- SQLite - Hafif veritabanı
- Pydantic - Veri doğrulama
- JWT Authentication - Güvenli kimlik doğrulama
- Alembic - Veritabanı migrasyonları

### Frontend
- React - Modern UI framework
- React Router - Sayfa yönlendirme
- Axios - HTTP istekleri
- Material-UI - UI bileşenleri
- Jest & React Testing Library - Test araçları

## 🚀 Kurulum

### Gereksinimler
- Python 3.8+
- Node.js 14+
- Git

### Projeyi İndirme

```bash
git clone https://github.com/yintsukuyomi/swesys.git
cd swesys
```

### Backend Kurulumu

```bash
cd backend

# Sanal ortam oluşturma
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Bağımlılıkları yükleme
pip install -r requirements.txt

# Veritabanı ayarları
cp .env.example .env  # .env dosyasını oluştur
# .env dosyasını düzenle

# Veritabanı migrasyonları
alembic upgrade head

# Uygulamayı başlatma
uvicorn main:app --reload
```

### Frontend Kurulumu

```bash
cd frontend

# Bağımlılıkları yükleme
npm install

# Uygulamayı başlatma
npm start
```

## 📖 Kullanım

Detaylı kullanım kılavuzu için [USER_GUIDE.md](USER_GUIDE.md) dosyasına bakın.

### Admin Paneli
- Öğretmen Yönetimi
- Ders Yönetimi
- Sınıf Yönetimi
- Program Yönetimi

### Normal Kullanıcı
- Program Görüntüleme
- Ders Bilgileri
- Filtreleme ve Arama

## 🧪 Test

### Backend Testleri
```bash
cd backend
pytest tests/ -v --cov=.
```

### Frontend Testleri
```bash
cd frontend
npm test
npm run test:coverage
```

## 📚 Dokümantasyon

- [API Dokümantasyonu](API.md)
- [Kullanıcı Kılavuzu](USER_GUIDE.md)
- [Katkıda Bulunma Rehberi](CONTRIBUTING.md)
- [Değişiklik Günlüğü](CHANGELOG.md)

## 🤝 Katkıda Bulunma

Katkıda bulunmak için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını inceleyin.

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje Apache2.0 lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

Proje Sahibi - [@yintsukuyomi](https://github.com/yintsukuyomi)

Proje Linki: [https://github.com/yintsukuyomi/swesys](https://github.com/yintsukuyomi/swesys)

