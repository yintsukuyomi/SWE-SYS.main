# SWE-SYS: Eğitim Yönetiminde Yeni Nesil Otomasyon

## 🚀 Neden Bu Proje?

Zaman kaybı, çakışan programlar, manuel işlemler, düşük verim.

Yükseköğretim kurumları hâlâ *Excel tabloları* ve *e-posta trafiğiyle* akademik planlamalarını yürütmeye çalışıyor. Bu sistemler:

- Haftalık programları oluşturmakta yavaş kalıyor
- Ders çakışmalarını önleyemiyor
- Akademisyen ve salon kaynaklarını verimsiz kullanıyor
- Anlık değişikliklere hızlı uyum sağlayamıyor
- Kurumsal veri üretmiyor ve raporlayamıyor

Bu noktada **SWE-SYS** devreye giriyor.

---

## 🧠 SWE-SYS Nedir?

**SWE-SYS**, üniversite düzeyindeki ders planlama ve yönetim süreçlerini baştan sona dijitalleştiren, akıllı algoritmalarla otomatikleştirilmiş, rol bazlı yetkilendirilmiş ve gerçek zamanlı bildirim desteği olan **modüler bir eğitim yönetim sistemidir.**

> "SWE-SYS, manuel iş yükünü kaldırır; doğru, hızlı ve esnek planlamayı mümkün kılar."

---

## 🧩 Modüler Mimari – Gereken Her Şey Tek Sistemde

| Modül | Açıklama |
| --- | --- |
| 🧭 **Ders Planlayıcı** | Akademik kadro ve salon bilgilerini alır, çakışmasız ders programı üretir |
| 🔐 **Kimlik Doğrulama ve Yetkilendirme** | Kullanıcı girişlerini ve rol bazlı erişimi yönetir |
| 🧠 **Akıllı Zamanlama Motoru** | Yapay zekâ destekli algoritmalarla ders saatlerini optimize eder |
| 💻 **Web & Mobil Arayüz** | Öğrenci, akademisyen ve yöneticiye özel kullanıcı deneyimi sunar |
| 🔔 **Anlık Bildirim Sistemi** | Ders değişiklikleri ve iptaller anında bildirilir |
| 🔐 **Rol Bazlı Yetkilendirme** | Yalnızca yetkili kullanıcılar belirli işlemleri gerçekleştirebilir |
| 📈 **Veri Analitiği ve Raporlama** | Yönetim panelleriyle kurumlara karar destek raporları sunar |
| 🔗 **Üniversite Sistemleri ile Entegrasyon** | Öğrenci bilgi sistemi, YÖK API’leri ve LDAP gibi altyapılara bağlanabilir |

---

## 💡 Fark Yaratan Özellikler

✅ %90’a kadar zaman tasarrufu  
✅ %100 çakışma önleme  
✅ Akademisyen memnuniyetinde artış  
✅ Gerçek zamanlı değişiklik yönetimi  
✅ Tam dijital dönüşüm uyumluluğu  
✅ Ölçeklenebilir yapı – 1 fakülteden, tüm üniversiteye  

---

## Teknolojiler

- **React**: Web ve mobil arayüz geliştirmek için.
- **FastAPI**: Backend API'lerini oluşturmak için.
- **SQLite**: Veritabanı yönetimi için.
- **SQLAlchemy**: Veritabanı işlemleri için ORM (Object-Relational Mapping) aracı olarak.
- **Python-Jose**: JWT tabanlı kimlik doğrulama için.
- **Passlib**: Şifreleme işlemleri için.

---

## 📂 Proje Yapısı

SWE-SYS projesi aşağıdaki gibi bir dosya ve klasör yapısına sahiptir:

```
SWESYS/
├── backend/               # FastAPI tabanlı backend kodları
│   ├── main.py            # Uygulama giriş noktası
│   ├── models/            # SQLAlchemy modelleri
│   ├── data               # Veritabanları
│   ├── routers/           # API endpoint'leri
│   ├── services/          # İş mantığı ve servis katmanı
│   └── database.py        # Veritabanı bağlantısı
├── frontend/              # React tabanlı frontend kodları
│   ├── public/            # Statik dosyalar
│   ├── src/               # React bileşenleri ve sayfalar
│   ├── App.js             # Ana uygulama bileşeni
│   └── index.js           # React giriş noktası
├── docs/                  # Proje dokümantasyonu
├── tests/                 # Test dosyaları
│   ├── backend/           # Backend testleri
│   └── frontend/          # Frontend testleri
├── .env                   # Ortam değişkenleri
├── requirements.txt       # Python bağımlılıkları
├── package.json           # Node.js bağımlılıkları
└── README.md              # Proje genel açıklaması
```

Bu yapı, hem frontend hem de backend geliştirme süreçlerini düzenli ve modüler bir şekilde yönetmek için tasarlanmıştır.

---

## 🛠️ Geliştirme Süreci

SWE-SYS projesine katkıda bulunmak isteyenler için geliştirme süreci aşağıdaki gibidir:

1. **Depoyu Klonlayın**  
   Projeyi yerel makinenize klonlayarak başlayın:
   ```bash
   git clone https://github.com/kullaniciadi/SWESYS.git
   cd SWESYS
   ```

2. **Gerekli Bağımlılıkları Yükleyin**  
   Backend ve frontend için bağımlılıkları yükleyin:
   - Backend:
     ```bash
     cd backend
     pip install -r requirements.txt
     ```
   - Frontend:
     ```bash
     cd ../frontend
     npm install
     ```

3. **Ortam Değişkenlerini Ayarlayın**  
   `.env` dosyasını oluşturun ve gerekli ortam değişkenlerini tanımlayın:
   ```env
   DATABASE_URL=sqlite:///./data/swesys.db
   SECRET_KEY=your_secret_key
   ```

4. **Geliştirme Sunucularını Çalıştırın**  
   - Backend:
     ```bash
     cd backend
     uvicorn main:app --reload
     ```
   - Frontend:
     ```bash
     cd ../frontend
     npm start
     ```

5. **Kodlama Standartlarına Uyun**  
   Kodlama yaparken PEP 8 ve React'ın en iyi uygulamalarına dikkat edin.

6. **Testleri Çalıştırın**  
   Değişikliklerinizi göndermeden önce testleri çalıştırın:
   - Backend:
     ```bash
     cd backend/tests
     pytest
     ```
   - Frontend:
     ```bash
     cd ../../frontend
     npm test
     ```

---

## 🤝 Katkıda Bulunma

1. **Fork Edin**: Depoyu fork ederek başlayın.
2. **Branch Oluşturun**: Yeni bir özellik veya düzeltme için branch oluşturun:
   ```bash
   git checkout -b yeni-ozellik
   ```
3. **Değişiklik Yapın**: Kodunuzu yazın ve test edin.
4. **Pull Request Gönderin**: Değişikliklerinizi açıklayan bir PR oluşturun.

---
