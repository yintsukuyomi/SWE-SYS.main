# Katkıda Bulunma Rehberi

SWE-SYS projesine katkıda bulunmak istediğiniz için teşekkür ederiz! Bu rehber, projeye nasıl katkıda bulunabileceğinizi açıklar.

## 🎯 Katkıda Bulunma Süreci

1. Bu repository'yi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Pull Request Süreci

1. Pull Request'iniz için açıklayıcı bir başlık kullanın
2. Yaptığınız değişiklikleri detaylı bir şekilde açıklayın
3. İlgili issue'ları referans verin (eğer varsa)
4. Değişikliklerinizin test edildiğinden emin olun
5. Kod stilini takip ettiğinizden emin olun

## 💻 Geliştirme Ortamı

### Backend Geliştirme

1. Sanal ortam oluşturun:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Geliştirme bağımlılıkları
```

3. Veritabanını hazırlayın:
```bash
alembic upgrade head
```

4. Testleri çalıştırın:
```bash
pytest tests/ -v --cov=.
```

### Frontend Geliştirme

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm start
```

3. Testleri çalıştırın:
```bash
npm test
```

## 📚 Kod Stili

### Python
- PEP 8 stil rehberini takip edin
- Maksimum satır uzunluğu: 88 karakter
- Black kod formatlayıcısını kullanın
- isort ile importları sıralayın

### JavaScript/React
- ESLint kurallarını takip edin
- Prettier ile kod formatlaması yapın
- Component isimleri PascalCase olmalı
- Hook isimleri use ile başlamalı

## 🧪 Test Yazımı

### Backend Testleri
- Her endpoint için test yazın
- Model testleri ekleyin
- Edge case'leri test edin
- Mock kullanımına dikkat edin

### Frontend Testleri
- Component testleri yazın
- Hook testleri ekleyin
- Integration testleri yazın
- Snapshot testleri kullanın

## 📝 Commit Mesajları

Commit mesajlarınızı aşağıdaki formatta yazın:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Tipler:
- feat: Yeni özellik
- fix: Hata düzeltmesi
- docs: Dokümantasyon değişiklikleri
- style: Kod stili değişiklikleri
- refactor: Kod refaktörü
- test: Test ekleme/düzenleme
- chore: Genel bakım

## 🔍 Code Review Süreci

1. PR'ınız en az bir maintainer tarafından review edilmelidir
2. Tüm CI kontrolleri başarılı olmalıdır
3. Gerekli değişiklikler yapıldıktan sonra PR merge edilebilir

## 📚 Faydalı Kaynaklar

- [FastAPI Dokümantasyonu](https://fastapi.tiangolo.com/)
- [React Dokümantasyonu](https://reactjs.org/docs/getting-started.html)
- [SQLAlchemy Dokümantasyonu](https://docs.sqlalchemy.org/)
- [Material-UI Dokümantasyonu](https://mui.com/getting-started/usage/)

## ❓ Sorularınız mı var?

Herhangi bir sorunuz olursa, lütfen bir issue açın veya proje sahibiyle iletişime geçin. 