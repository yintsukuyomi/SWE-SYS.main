# SWE-SYS API Dökümantasyonu

---

## 1. Giriş ve Genel Bilgi

SWE-SYS, eğitim kurumları için modern bir **Ders Programı Yönetim Sistemi** sunar. Kullanıcılar; öğretmen, ders, sınıf ve program yönetimi ile otomatik (yapay zeka destekli) ders programı oluşturma işlemlerini kolayca gerçekleştirebilir.

**Temel Özellikler:**
- JWT tabanlı güvenli kimlik doğrulama
- Öğretmen, ders, sınıf ve program CRUD işlemleri
- Otomatik program oluşturucu (klasik ve genetik algoritma)
- Kullanıcı dostu arayüz ve RESTful API

---

## 2. Kimlik Doğrulama

Tüm API istekleri için JWT token gereklidir. Token'ı header'da şu şekilde gönderin:

```
Authorization: Bearer <token>
```

### Giriş (Login)
**POST /api/auth/login**
```json
{
  "username": "kullaniciadi",
  "password": "sifre"
}
```
Yanıt:
```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

---

## 3. Temel API Kullanımı

### 3.1 Öğretmenler
- **GET /api/teachers**: Tüm öğretmenleri listeler
- **POST /api/teachers**: Yeni öğretmen ekler
- **PUT /api/teachers/{id}**: Öğretmen güncelle
- **DELETE /api/teachers/{id}**: Öğretmen sil

**Örnek Yanıt:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "faculty": "Engineering",
    "department": "Computer Science",
    "working_days": "Monday,Tuesday",
    "working_hours": "09:00-17:00"
  }
]
```

### 3.2 Dersler
- **GET /api/courses**: Tüm dersleri listeler
- **POST /api/courses**: Yeni ders ekler
- **PUT /api/courses/{id}**: Ders güncelle
- **DELETE /api/courses/{id}**: Ders sil

**Örnek Yanıt:**
```json
[
  {
    "id": 1,
    "name": "Algoritmalar",
    "code": "CSE101",
    "teacher_id": 1,
    "faculty": "Engineering",
    "departments": ["Computer Science"],
    "level": "Lisans",
    "type": "teorik",
    "semester": "Güz",
    "ects": 6,
    "total_hours": 3,
    "is_active": true,
    "student_count": 40
  }
]
```

### 3.3 Sınıflar
- **GET /api/classrooms**: Tüm sınıfları listeler
- **POST /api/classrooms**: Yeni sınıf ekler
- **PUT /api/classrooms/{id}**: Sınıf güncelle
- **DELETE /api/classrooms/{id}**: Sınıf sil

**Örnek Yanıt:**
```json
[
  {
    "id": 1,
    "name": "A101",
    "capacity": 40,
    "type": "teorik",
    "faculty": "Engineering",
    "department": "Computer Science"
  }
]
```

### 3.4 Programlar
- **GET /api/schedules**: Tüm programları listeler
- **POST /api/schedules**: Yeni program ekler
- **PUT /api/schedules/{id}**: Program güncelle
- **DELETE /api/schedules/{id}**: Program sil

**Örnek Yanıt:**
```json
[
  {
    "id": 1,
    "day": "Monday",
    "time_range": "09:00-10:30",
    "course_id": 1,
    "classroom_id": 1,
    "course": { "name": "Algoritmalar", "code": "CSE101", "teacher": { "name": "John Doe" } },
    "classroom": { "name": "A101" }
  }
]
```

---

## 4. Otomatik Program Oluşturucu (Klasik & Genetik Algoritma)

### 4.1 Özellik Tanımı
SWE-SYS, ders programı oluşturma işlemini klasik kurallara dayalı algoritmanın yanı sıra **yapay zeka tabanlı genetik algoritma** ile de gerçekleştirebilir. Genetik algoritma, çok sayıda kısıt ve karmaşık gereksinim altında, çakışmasız ve kapasiteye uygun, optimize edilmiş ders programları üretir.

### 4.2 Kullanım
#### API Üzerinden
```
POST /api/scheduler/generate?method=genetic
Authorization: Bearer <token>
```
- `method=genetic` parametresi ile genetik algoritma çalışır.
- Varsayılan (`method=classic`) klasik algoritmadır.

#### Frontend Üzerinden
- **Program Oluşturucu** sayfasında "Yapay Zeka ile Oluştur" butonuna tıklayın.
- Sonuç kutusunda algoritma ve başarı durumu gösterilir.

#### Örnek Yanıt
```json
{
  "success": true,
  "message": "Genetik algoritma ile program oluşturuldu. 12 oturum planlandı.",
  "scheduled_count": 12,
  "schedule": [ ... ],
  "perfect": true
}
```
- `perfect: true` ise, hiçbir kısıt ihlali olmayan kusursuz bir program üretilmiştir.

### 4.3 Klasik Algoritma ile Farkı
| Özellik                | Klasik Algoritma         | Genetik Algoritma (Yapay Zeka) |
|------------------------|--------------------------|---------------------------------|
| Kısıtları ele alma     | Sıralı, deterministik    | Evrimsel, optimize              |
| Çözüm kalitesi         | Genellikle iyi           | Genellikle daha iyi/kusursuz    |
| Büyük veri/kısıt       | Zorlanabilir             | Daha iyi başa çıkar             |
| Esneklik               | Düşük                    | Yüksek                         |
| Kullanıcıya sunum      | "Klasik"                 | "Yapay Zeka"                   |

### 4.4 Algoritmanın Çalışma Prensibi
1. **Popülasyon Oluşturma:** Rastgele çok sayıda program (birey) oluşturulur.
2. **Fitness Değerlendirme:** Her program, çakışma, kapasite, uygunluk gibi kriterlere göre puanlanır. Kısıt ihlali olanlar elenir.
3. **Seçim:** En iyi programlar seçilir.
4. **Çaprazlama:** Seçilen programlar birleştirilerek yeni programlar üretilir.
5. **Mutasyon:** Bazı programlarda küçük rastgele değişiklikler yapılır.
6. **Döngü:** Bu adımlar yüzlerce kez tekrarlanır.
7. **Sonuç:** En iyi/kusursuz program döndürülür.

### 4.5 Notlar
- Eğer veri setinizde çok fazla kısıt varsa, algoritmanın kusursuz çözüm bulması zaman alabilir.
- "Kusursuz Çözüm" etiketi, hiçbir çakışma veya kapasite ihlali olmadığını gösterir.
- Her iki algoritmanın sonuçları da frontend'de açıkça gösterilir.

---

## 5. Hata Kodları
| Kod  | Anlamı                    |
|------|---------------------------|
| 400  | Geçersiz istek            |
| 401  | Kimlik doğrulama hatası   |
| 403  | Yetkisiz erişim           |
| 404  | Kaynak bulunamadı         |
| 409  | Çakışma durumu            |
| 500  | Sunucu hatası             |

---

## 6. Sıkça Sorulan Sorular & İpuçları

**S: Programda "Unknown Course" veya "Unknown Classroom" görünüyor, neden?**
C: İlgili ders veya sınıfın adı/kodu eksik olabilir. Veritabanında bu alanların dolu olduğundan emin olun.

**S: Genetik algoritma neden bazen "kusursuz çözüm" bulamıyor?**
C: Çok fazla kısıt veya yetersiz kaynak (sınıf, öğretmen) varsa, algoritma en iyiye yakın çözümü döndürür. Veri setinizi gözden geçirin.

**S: API'ye nasıl erişebilirim?**
C: JWT token ile kimlik doğrulama gereklidir. Giriş yaptıktan sonra token'ı header'da kullanın.

**İpucu:**
- Program oluşturucu işlemi mevcut programı siler ve yenisiyle değiştirir.
- Her endpoint için örnek istek/yanıtlar dökümantasyonda yer almaktadır.

---

## 7. Ek Notlar
- Proje açık kaynaklıdır ve geliştirilmeye açıktır.
- Daha fazla bilgi veya destek için teknik ekibe ulaşabilirsiniz.
- Dökümantasyonun güncel halini her zaman proje deposunda bulabilirsiniz.

---

© SWE-SYS - Tüm hakları saklıdır. 