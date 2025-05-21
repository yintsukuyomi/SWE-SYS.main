# PlanEdu (Ders Programı Yönetim Sistemi)

Modern, kullanıcı dostu ve yapay zeka destekli bir üniversite ders programı yönetim sistemi.

## 🚀 Özellikler
- Klasik ve Yapay Zeka (Genetik Algoritma) ile Otomatik Program Oluşturma
- Fakülte, bölüm, öğretmen, ders ve sınıf yönetimi
- Rol tabanlı yetkilendirme (Admin/Kullanıcı)
- Excel ile toplu veri girişi
- Bildirim ve aktivite takibi
- Modern, responsive arayüz

## 🛠️ Kurulum

### Gereksinimler
- Python 3.8+
- Node.js 14+
- Git

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp .env.example .env  # .env dosyasını düzenleyin
db migrasyon: alembic upgrade head
uvicorn main:app --reload # Backendi başlatın
```

### Frontend
```bash
cd frontend
npm install # Gereksinimleri indirin
npm start # Frontendi başlatın
```

## 📖 Kullanım
- Yönetici panelinden öğretmen, ders, sınıf ve program yönetimi
- Otomatik program oluşturucu ile klasik veya yapay zeka algoritması seçimi
- Detaylı kullanım için: [Kullanıcı Kılavuzu](USER_GUIDE.md)

## 🧪 Test
- Backend: `pytest tests/ -v --cov=.`
- Frontend: `npm test`

## 📚 Dökümantasyon
- [API Dokümantasyonu](API.md)
- [Kullanıcı Kılavuzu](USER_GUIDE.md)
- [Katkı Rehberi](CONTRIBUTING.md)
- [Değişiklik Günlüğü](CHANGELOG.md)

## 🤝 Katkı
Katkı sağlamak için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını inceleyin.

## 📄 Lisans
Apache 2.0 — Ayrıntılar için [LICENSE](LICENSE)

## 📞 İletişim
Proje Sahibi: [@yintsukuyomi](https://github.com/yintsukuyomi)

---
Daha fazla bilgi için dökümantasyon dosyalarını inceleyin.

