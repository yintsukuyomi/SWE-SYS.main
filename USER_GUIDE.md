# Kullanıcı Kılavuzu

Bu kılavuz, SWE-SYS Ders Programı Yönetim Sistemi'nin kullanımını adım adım açıklar.

## İçindekiler
1. [Giriş ve Hızlı Başlangıç](#giriş-ve-hızlı-başlangıç)
2. [Kullanıcı Rolleri](#kullanıcı-rolleri)
3. [Temel İşlemler](#temel-işlemler)
4. [Otomatik Program Oluşturucu](#otomatik-program-oluşturucu)
5. [Sıkça Sorulan Sorular & İpuçları](#sıkça-sorulan-sorular--ipuçları)

---

## Giriş ve Hızlı Başlangıç

SWE-SYS, üniversiteler için modern, web tabanlı bir ders programı yönetim sistemidir. Hem klasik hem de yapay zeka (genetik algoritma) ile otomatik program oluşturma desteği sunar.

**Başlamak için:**
1. Tarayıcıda `http://localhost:3000` adresine gidin.
2. Giriş ekranında kullanıcı adı ve şifrenizi girin.
3. Rolünüze göre yönetim paneline veya program görüntüleme ekranına yönlendirilirsiniz.

---

## Kullanıcı Rolleri

- **Admin:** Tüm yönetim işlemlerini yapabilir (öğretmen, ders, sınıf, program ekleme/düzenleme/silme, otomatik program oluşturma).
- **Normal Kullanıcı:** Sadece programları görüntüleyebilir ve arama/filtreleme yapabilir.

---

## Temel İşlemler

### 1. Öğretmen Yönetimi
- **Ekle:** "Öğretmenler" sayfasında "Ekle" butonuna tıklayın, formu doldurun ve kaydedin.
- **Düzenle:** Listeden öğretmenin yanındaki "Düzenle" butonuna tıklayın, değişiklikleri yapıp kaydedin.
- **Sil:** Listeden öğretmenin yanındaki "Sil" butonuna tıklayın, onaylayın.

### 2. Ders Yönetimi
- **Ekle:** "Dersler" sayfasında "Ekle" butonuna tıklayın, formu doldurun ve kaydedin.
- **Düzenle/Sil:** Listeden ilgili dersin yanındaki butonları kullanın.

### 3. Sınıf Yönetimi
- **Ekle:** "Sınıflar" sayfasında "Ekle" butonuna tıklayın, formu doldurun ve kaydedin.
- **Düzenle/Sil:** Listeden ilgili sınıfın yanındaki butonları kullanın.

### 4. Program Yönetimi
- **Ekle:** "Programlar" sayfasında "Ekle" veya "Oluştur" butonuna tıklayın, formu doldurun ve kaydedin.
- **Düzenle/Sil:** Listeden ilgili programın yanındaki butonları kullanın.
- **Görüntüle:** Programlar sayfasında günlük veya haftalık görünüm seçeneklerini kullanın.
- **Filtrele:** Fakülte, bölüm, öğretmen veya sınıfa göre filtreleme yapabilirsiniz.

---

## Otomatik Program Oluşturucu

Sistemde iki farklı otomatik program oluşturma algoritması bulunur:

### 1. Klasik Algoritma
- "Program Oluşturucu" sayfasında "Klasik Algoritma ile Oluştur" butonuna tıklayın.
- Sistem, temel kurallara göre otomatik program oluşturur.

### 2. Yapay Zeka (Genetik Algoritma)
- Aynı sayfada "Yapay Zeka ile Oluştur" butonuna tıklayın.
- Sistem, çakışmasız ve kapasiteye uygun, optimize edilmiş bir program üretir.
- Sonuç kutusunda "Kusursuz Çözüm" etiketi varsa, hiçbir kısıt ihlali yoktur.

**İpucu:**
- Otomatik oluşturucu mevcut programı siler ve yenisiyle değiştirir.
- Program oluşturma sonrası başarı oranı ve programlanamayan dersler ekranda gösterilir.

---

## Sıkça Sorulan Sorular & İpuçları

**S: Programda çakışma olursa ne olur?**
C: Sistem otomatik olarak çakışmaları engeller. Yapay zeka algoritması, çakışmasız program bulamazsa en iyiye yakın çözümü sunar.

**S: Öğretmen uygunlukları nasıl dikkate alınır?**
C: Öğretmenlerin çalışma günleri ve saatleri kaydedilir, program oluşturulurken bu bilgiler kullanılır.

**S: Programı Excel/PDF olarak dışa aktarabilir miyim?**
Evet, program listesinde "Dışa Aktar" butonunu kullanabilirsiniz.

**S: Toplu veri girişi mümkün mü?**
Evet, Excel şablonunu indirip toplu veri yükleyebilirsiniz.

**S: Programı manuel olarak düzenleyebilir miyim?**
Evet, programdaki her dersi tek tek düzenleyebilir veya silebilirsiniz.

**İpucu:**
- Herhangi bir sorunla karşılaşırsanız, sayfayı yenileyin veya yöneticinize başvurun.
- Detaylı teknik bilgi için [API Dokümantasyonu](API.md) dosyasına bakabilirsiniz.

---
Daha fazla bilgi için dökümantasyon dosyalarını inceleyin veya teknik destek ekibine ulaşın. 