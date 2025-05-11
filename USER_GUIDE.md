# Kullanıcı Kılavuzu

Bu kılavuz, Ders Programı Yönetim Sistemi'nin kullanımını adım adım açıklar.

## İçindekiler

1. [Giriş](#giriş)
2. [Sisteme Giriş](#sisteme-giriş)
3. [Admin Paneli](#admin-paneli)
4. [Öğretmen Yönetimi](#öğretmen-yönetimi)
5. [Ders Yönetimi](#ders-yönetimi)
6. [Sınıf Yönetimi](#sınıf-yönetimi)
7. [Program Yönetimi](#program-yönetimi)
8. [Program Görüntüleme](#program-görüntüleme)
9. [Sık Sorulan Sorular](#sık-sorulan-sorular)

## Giriş

Ders Programı Yönetim Sistemi, üniversitelerin ders programlarını oluşturmasına ve yönetmesine olanak sağlayan bir web uygulamasıdır. Sistem iki farklı kullanıcı rolüne sahiptir:

- **Admin**: Tüm yönetim işlemlerini yapabilir
- **Normal Kullanıcı**: Sadece program görüntüleme ve arama yapabilir

## Sisteme Giriş

1. Tarayıcınızda `http://localhost:3000` adresine gidin
2. Giriş sayfasında kullanıcı adı ve şifrenizi girin
3. "Giriş Yap" butonuna tıklayın

## Admin Paneli

Admin paneline giriş yaptıktan sonra erişebilirsiniz. Panel şu bölümlerden oluşur:

- Öğretmenler
- Dersler
- Sınıflar
- Programlar

Her bölümün kendi yönetim sayfası bulunur.

## Öğretmen Yönetimi

### Öğretmen Ekleme

1. "Öğretmenler" sayfasına gidin
2. "Öğretmen Ekle" butonuna tıklayın
3. Açılan formda:
   - Ad Soyad
   - E-posta
   - Fakülte
   - Bölüm
   - Çalışma Günleri
   - Çalışma Saatleri
   bilgilerini girin
4. "Kaydet" butonuna tıklayın

### Öğretmen Düzenleme

1. Öğretmen listesinde düzenlemek istediğiniz öğretmenin yanındaki "Düzenle" butonuna tıklayın
2. Açılan formda gerekli değişiklikleri yapın
3. "Kaydet" butonuna tıklayın

### Öğretmen Silme

1. Öğretmen listesinde silmek istediğiniz öğretmenin yanındaki "Sil" butonuna tıklayın
2. Onay penceresinde "Evet" butonuna tıklayın

## Ders Yönetimi

### Ders Ekleme

1. "Dersler" sayfasına gidin
2. "Ders Ekle" butonuna tıklayın
3. Açılan formda:
   - Ders Adı
   - Ders Kodu
   - Öğretmen
   - Fakülte
   - Bölümler
   - Seviye
   - Tip
   - Dönem
   - ECTS
   - Toplam Saat
   - Öğrenci Sayısı
   bilgilerini girin
4. "Kaydet" butonuna tıklayın

### Ders Düzenleme

1. Ders listesinde düzenlemek istediğiniz dersin yanındaki "Düzenle" butonuna tıklayın
2. Açılan formda gerekli değişiklikleri yapın
3. "Kaydet" butonuna tıklayın

### Ders Silme

1. Ders listesinde silmek istediğiniz dersin yanındaki "Sil" butonuna tıklayın
2. Onay penceresinde "Evet" butonuna tıklayın

## Sınıf Yönetimi

### Sınıf Ekleme

1. "Sınıflar" sayfasına gidin
2. "Sınıf Ekle" butonuna tıklayın
3. Açılan formda:
   - Sınıf Adı
   - Kapasite
   - Tip
   - Fakülte
   - Bölüm
   bilgilerini girin
4. "Kaydet" butonuna tıklayın

### Sınıf Düzenleme

1. Sınıf listesinde düzenlemek istediğiniz sınıfın yanındaki "Düzenle" butonuna tıklayın
2. Açılan formda gerekli değişiklikleri yapın
3. "Kaydet" butonuna tıklayın

### Sınıf Silme

1. Sınıf listesinde silmek istediğiniz sınıfın yanındaki "Sil" butonuna tıklayın
2. Onay penceresinde "Evet" butonuna tıklayın

## Program Yönetimi

### Program Oluşturma

1. "Programlar" sayfasına gidin
2. "Program Oluştur" butonuna tıklayın
3. Açılan formda:
   - Gün
   - Saat Aralığı
   - Ders
   - Sınıf
   bilgilerini girin
4. "Kaydet" butonuna tıklayın

### Program Düzenleme

1. Program listesinde düzenlemek istediğiniz programın yanındaki "Düzenle" butonuna tıklayın
2. Açılan formda gerekli değişiklikleri yapın
3. "Kaydet" butonuna tıklayın

### Program Silme

1. Program listesinde silmek istediğiniz programın yanındaki "Sil" butonuna tıklayın
2. Onay penceresinde "Evet" butonuna tıklayın

## Program Görüntüleme

### Günlük Program

1. "Programlar" sayfasına gidin
2. Üst menüden günü seçin
3. Program listesi seçilen güne göre filtrelenecektir

### Haftalık Program

1. "Programlar" sayfasına gidin
2. "Haftalık Görünüm" butonuna tıklayın
3. Tüm haftanın programı tablo halinde görüntülenecektir

### Filtreleme

1. Program listesinin üstündeki filtreleme seçeneklerini kullanın:
   - Fakülte
   - Bölüm
   - Öğretmen
   - Sınıf
2. Seçtiğiniz kriterlere göre program listesi filtrelenecektir

## Sık Sorulan Sorular

### Program çakışması nasıl önlenir?
Sistem otomatik olarak program çakışmalarını kontrol eder. Aynı sınıfa veya öğretmene aynı saatte ders atanması durumunda uyarı verir.

### Öğretmen müsaitlik durumu nasıl kontrol edilir?
Öğretmenlerin çalışma günleri ve saatleri kaydedilir. Program oluştururken bu bilgiler dikkate alınır.

### Ders programı nasıl dışa aktarılır?
Program listesinin üstündeki "Dışa Aktar" butonuna tıklayarak programı PDF veya Excel formatında indirebilirsiniz.

### Toplu program oluşturma nasıl yapılır?
"Toplu Program Oluştur" butonuna tıklayarak, seçtiğiniz dersler için otomatik program oluşturabilirsiniz. Sistem, öğretmen müsaitlikleri ve sınıf kapasitelerini dikkate alarak en uygun programı oluşturur. 