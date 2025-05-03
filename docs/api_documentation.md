# SWE-SYS API Dokümantasyonu

## Dersler (Courses)

### GET /api/courses/
Dersleri listele. Sorgu parametreleri:
- `is_active` (bool): Aktif/pasif durumuna göre filtreleme.
- `teacher_id` (int): Belirli bir öğretmene ait dersleri filtreleme.
- `faculty` (str): Fakülteye göre filtreleme.

### POST /api/courses/
Yeni bir ders oluştur.

### PUT /api/courses/{course_id}
Mevcut bir dersi güncelle.

### DELETE /api/courses/{course_id}
Belirli bir dersi sil.
