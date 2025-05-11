# API Dokümantasyonu

Bu dokümantasyon, Ders Programı Yönetim Sistemi'nin API endpoint'lerini ve kullanımlarını açıklar.

## Kimlik Doğrulama

Tüm API istekleri için JWT token gereklidir. Token'ı header'da `Authorization: Bearer <token>` formatında göndermelisiniz.

### Endpoint'ler

#### POST /api/auth/login
Kullanıcı girişi yapar ve JWT token döner.

**Request Body:**
```json
{
    "username": "string",
    "password": "string"
}
```

**Response:**
```json
{
    "access_token": "string",
    "token_type": "bearer"
}
```

## Öğretmenler

### GET /api/teachers
Tüm öğretmenleri listeler.

**Response:**
```json
[
    {
        "id": "integer",
        "name": "string",
        "email": "string",
        "faculty": "string",
        "department": "string",
        "working_days": "string",
        "working_hours": "string"
    }
]
```

### POST /api/teachers
Yeni öğretmen ekler.

**Request Body:**
```json
{
    "name": "string",
    "email": "string",
    "faculty": "string",
    "department": "string",
    "working_days": "string",
    "working_hours": "string"
}
```

### PUT /api/teachers/{teacher_id}
Öğretmen bilgilerini günceller.

**Request Body:**
```json
{
    "name": "string",
    "email": "string",
    "faculty": "string",
    "department": "string",
    "working_days": "string",
    "working_hours": "string"
}
```

### DELETE /api/teachers/{teacher_id}
Öğretmeni siler.

## Dersler

### GET /api/courses
Tüm dersleri listeler.

**Response:**
```json
[
    {
        "id": "integer",
        "name": "string",
        "code": "string",
        "teacher_id": "integer",
        "faculty": "string",
        "departments": ["string"],
        "level": "string",
        "type": "string",
        "semester": "string",
        "ects": "integer",
        "total_hours": "integer",
        "is_active": "boolean",
        "student_count": "integer"
    }
]
```

### POST /api/courses
Yeni ders ekler.

**Request Body:**
```json
{
    "name": "string",
    "code": "string",
    "teacher_id": "integer",
    "faculty": "string",
    "departments": ["string"],
    "level": "string",
    "type": "string",
    "semester": "string",
    "ects": "integer",
    "total_hours": "integer",
    "is_active": "boolean",
    "student_count": "integer"
}
```

### PUT /api/courses/{course_id}
Ders bilgilerini günceller.

**Request Body:**
```json
{
    "name": "string",
    "code": "string",
    "teacher_id": "integer",
    "faculty": "string",
    "departments": ["string"],
    "level": "string",
    "type": "string",
    "semester": "string",
    "ects": "integer",
    "total_hours": "integer",
    "is_active": "boolean",
    "student_count": "integer"
}
```

### DELETE /api/courses/{course_id}
Dersi siler.

### GET /api/courses/unscheduled
Programlanmamış dersleri listeler.

## Sınıflar

### GET /api/classrooms
Tüm sınıfları listeler.

**Response:**
```json
[
    {
        "id": "integer",
        "name": "string",
        "capacity": "integer",
        "type": "string",
        "faculty": "string",
        "department": "string"
    }
]
```

### POST /api/classrooms
Yeni sınıf ekler.

**Request Body:**
```json
{
    "name": "string",
    "capacity": "integer",
    "type": "string",
    "faculty": "string",
    "department": "string"
}
```

### PUT /api/classrooms/{classroom_id}
Sınıf bilgilerini günceller.

**Request Body:**
```json
{
    "name": "string",
    "capacity": "integer",
    "type": "string",
    "faculty": "string",
    "department": "string"
}
```

### DELETE /api/classrooms/{classroom_id}
Sınıfı siler.

## Programlar

### GET /api/schedules
Tüm programları listeler.

**Response:**
```json
[
    {
        "id": "integer",
        "day": "string",
        "time_range": "string",
        "course_id": "integer",
        "classroom_id": "integer",
        "course": {
            "name": "string",
            "code": "string",
            "teacher": {
                "name": "string"
            }
        },
        "classroom": {
            "name": "string"
        }
    }
]
```

### POST /api/schedules
Yeni program ekler.

**Request Body:**
```json
{
    "day": "string",
    "time_range": "string",
    "course_id": "integer",
    "classroom_id": "integer"
}
```

### PUT /api/schedules/{schedule_id}
Program bilgilerini günceller.

**Request Body:**
```json
{
    "day": "string",
    "time_range": "string",
    "course_id": "integer",
    "classroom_id": "integer"
}
```

### DELETE /api/schedules/{schedule_id}
Programı siler.

### DELETE /api/schedules/day/{day}
Belirli bir güne ait tüm programları siler.

## Hata Kodları

- 400 Bad Request: Geçersiz istek
- 401 Unauthorized: Kimlik doğrulama hatası
- 403 Forbidden: Yetkisiz erişim
- 404 Not Found: Kaynak bulunamadı
- 409 Conflict: Çakışma durumu
- 500 Internal Server Error: Sunucu hatası

## Örnek Kullanım

### Öğretmen Ekleme
```bash
curl -X POST "http://localhost:8000/api/teachers" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
           "name": "John Doe",
           "email": "john@example.com",
           "faculty": "Engineering",
           "department": "Computer Science",
           "working_days": "Monday,Tuesday",
           "working_hours": "09:00-17:00"
         }'
```

### Ders Programı Oluşturma
```bash
curl -X POST "http://localhost:8000/api/schedules" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
           "day": "Monday",
           "time_range": "09:00-10:30",
           "course_id": 1,
           "classroom_id": 1
         }'
``` 