# Ders Programı Yönetim Sistemi

Bu proje, üniversiteler için geliştirilmiş bir ders programı yönetim sistemidir. Öğretmenler, dersler, sınıflar ve programların yönetimini sağlar.

## Özellikler

- Öğretmen yönetimi (ekleme, düzenleme, silme)
- Ders yönetimi (ekleme, düzenleme, silme)
- Sınıf yönetimi (ekleme, düzenleme, silme)
- Program oluşturma ve yönetimi
- Otomatik program oluşturma
- Filtreleme ve arama özellikleri
- Admin ve normal kullanıcı rolleri
- Responsive tasarım

## Teknolojiler

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- JWT Authentication
- Alembic (Database Migrations)

### Frontend
- React
- React Router
- Axios
- Material-UI
- Jest & React Testing Library

## Kurulum

### Gereksinimler
- Python 3.8+
- Node.js 14+
- Git

### Projeyi İndirme

1. Projeyi klonlayın:
```bash
git clone https://github.com/yintsukuyomi/swesys.git
cd swesys
```

### Backend Kurulumu

1. Backend klasörüne gidin:
```bash
cd backend
```

2. Sanal ortam oluşturun ve aktifleştirin:
```bash
# Windows için
python -m venv venv
venv\Scripts\activate

# Linux/Mac için
python3 -m venv venv
source venv/bin/activate
```

3. pip'i güncelleyin:
```bash
python -m pip install --upgrade pip
```

4. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

5. Veritabanı ayarlarını yapın:
- `.env` dosyasını oluşturun ve aşağıdaki değişkenleri ayarlayın:
```
DATABASE_URL=sqlite:///./swesys.db
SECRET_KEY=your-secret-key
```

6. Veritabanı migrasyonlarını çalıştırın:
```bash
alembic upgrade head
```

7. Uygulamayı başlatın:
```bash
uvicorn main:app --reload
```

### Frontend Kurulumu

1. Yeni bir terminal açın ve proje ana dizinine gidin:
```bash
cd ..  # Eğer backend klasöründeyseniz
cd frontend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Uygulamayı başlatın:
```bash
npm start
```

## Kullanım

### Admin Paneli

1. Öğretmen Yönetimi
   - Öğretmen ekleme
   - Öğretmen bilgilerini düzenleme
   - Öğretmen silme
   - Çalışma günleri ve saatlerini belirleme

2. Ders Yönetimi
   - Ders ekleme
   - Ders bilgilerini düzenleme
   - Ders silme
   - Öğretmen atama
   - Öğrenci sayısı belirleme

3. Sınıf Yönetimi
   - Sınıf ekleme
   - Sınıf bilgilerini düzenleme
   - Sınıf silme
   - Kapasite belirleme

4. Program Yönetimi
   - Otomatik program oluşturma
   - Program düzenleme
   - Program silme
   - Günlük program görüntüleme

### Normal Kullanıcı

1. Program Görüntüleme
   - Günlük program
   - Haftalık program
   - Filtreleme seçenekleri

2. Ders Bilgileri
   - Ders detayları
   - Öğretmen bilgileri
   - Sınıf bilgileri

## Test

### Backend Testleri

1. Backend klasörüne gidin:
```bash
cd backend
```

2. Sanal ortamı aktifleştirin (eğer aktif değilse):
```bash
# Windows için
venv\Scripts\activate

# Linux/Mac için
source venv/bin/activate
```

3. Test bağımlılıklarını yükleyin:
```bash
pip install pytest pytest-cov httpx
```

4. Testleri çalıştırın:
```bash
pytest tests/ -v --cov=.
```

### Frontend Testleri

1. Frontend klasörüne gidin:
```bash
cd frontend
```

2. Testleri çalıştırın:
```bash
npm test
```

Test kapsamı raporu için:
```bash
npm run test:coverage
```

## API Dokümantasyonu

API dokümantasyonuna aşağıdaki URL'lerden erişebilirsiniz:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Katkıda Bulunma

1. Bu repository'yi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje Apache2.0 lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## İletişim

Proje Sahibi - [@yintsukuyomi](https://github.com/yintsukuyomi)

Proje Linki: [https://github.com/yintsukuyomi/swesys](https://github.com/yintsukuyomi/swesys)

