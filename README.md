# SWESYS - Ders Programı Yönetim Sistemi

SWESYS, üniversiteler için geliştirilmiş bir ders programı yönetim sistemidir. Bu sistem, fakülte ve bölümlerin ders programlarını oluşturmasına, yönetmesine ve optimize etmesine olanak sağlar.

## Özellikler

- Fakülte ve bölüm yönetimi
- Derslik yönetimi
- Öğretmen yönetimi
- Ders programı oluşturma ve düzenleme
- Çakışma kontrolü
- Kullanıcı yetkilendirme sistemi
- Responsive web arayüzü

## Teknolojiler

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- Alembic (Database Migrations)

### Frontend
- React
- React Router
- Axios
- CSS3

## Kurulum

### Backend Kurulumu

1. Python 3.8 veya üstü sürümü yükleyin
2. Backend klasörüne gidin:
   ```bash
   cd backend
   ```
3. Virtual environment oluşturun ve aktifleştirin:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```
4. Gereksinimleri yükleyin:
   ```bash
   pip install -r requirements.txt
   ```
5. `.env` dosyasını oluşturun ve gerekli değişkenleri ayarlayın:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/swesys
   SECRET_KEY=your-secret-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
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

1. Node.js ve npm yükleyin
2. Frontend klasörüne gidin:
   ```bash
   cd frontend
   ```
3. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
4. `.env` dosyasını oluşturun:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```
5. Uygulamayı başlatın:
   ```bash
   npm start
   ```

## Kullanım

1. Tarayıcınızda `http://localhost:3000` adresine gidin
2. Varsayılan admin hesabı ile giriş yapın:
   - Kullanıcı adı: admin
   - Şifre: admin123

## Katkıda Bulunma

1. Bu repository'yi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## İletişim

Proje Sahibi - [@your-username](https://github.com/your-username)

Proje Linki: [https://github.com/your-username/swesys](https://github.com/your-username/swesys)

