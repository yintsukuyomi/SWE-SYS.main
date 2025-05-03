export const FACULTIES = [
  { id: 'dil-tarih', name: 'Dil ve Tarih Coğrafya Fakültesi' },
  { id: 'fen', name: 'Fen Fakültesi' },
  { id: 'muhendislik', name: 'Mühendislik Fakültesi' },
  { id: 'ziraat', name: 'Ziraat Fakültesi' },
  { id: 'siyasal', name: 'Siyasal Bilgiler Fakültesi' },
  { id: 'saglik', name: 'Sağlık Bilimleri Fakültesi' },
  { id: 'tip', name: 'Tıp Fakültesi' },
  { id: 'dis', name: 'Diş Hekimliği Fakültesi' },
  { id: 'eczacilik', name: 'Eczacılık Fakültesi' },
  { id: 'ilahiyat', name: 'İlahiyat Fakültesi' },
  { id: 'veteriner', name: 'Veteriner Fakültesi' },
  { id: 'hukuk', name: 'Hukuk Fakültesi' },
  { id: 'egitim', name: 'Eğitim Bilimleri Fakültesi' },
  { id: 'hemsirelik', name: 'Hemşirelik Fakültesi' },
  { id: 'gsf', name: 'Güzel Sanatlar Fakültesi' },
  { id: 'iletisim', name: 'İletişim Fakültesi' },
  { id: 'aue', name: 'Açık ve Uzaktan Eğitim Fakültesi' },
  { id: 'uygulamali', name: 'Uygulamalı Bilimler Fakültesi' }
];

// Her fakülteye ait bölümler
export const DEPARTMENTS = {
  'dil-tarih': [
    { id: 'alman', name: 'Alman Dili ve Edebiyatı (Almanca)' },
    { id: 'amerikan', name: 'Amerikan Kültürü ve Edebiyatı (İngilizce)' },
    { id: 'antropoloji', name: 'Antropoloji' },
    { id: 'antropoloji-kktc', name: 'Antropoloji (KKTC Uyruklu)' },
    { id: 'arap', name: 'Arap Dili ve Edebiyatı' },
    { id: 'arkeoloji-ing', name: 'Arkeoloji (İngilizce)' },
    { id: 'bilgi-belge', name: 'Bilgi ve Belge Yönetimi' },
    { id: 'bulgar', name: 'Bulgar Dili ve Edebiyatı (Bulgarca)' },
    { id: 'cografya', name: 'Coğrafya' },
    { id: 'cografya-ing', name: 'Coğrafya (İngilizce)' },
    { id: 'cografya-kktc', name: 'Coğrafya (KKTC Uyruklu)' },
    { id: 'turk-lehce', name: 'Çağdaş Türk Lehçeleri ve Edebiyatları' },
    { id: 'yunan', name: 'Çağdaş Yunan Dili ve Edebiyatı' },
    { id: 'yunan-kktc', name: 'Çağdaş Yunan Dili ve Edebiyatı (KKTC Uyruklu)' },
    { id: 'dilbilimi', name: 'Dilbilimi' },
    { id: 'ermeni', name: 'Ermeni Dili ve Kültürü (Ermenice)' },
    { id: 'fars', name: 'Fars Dili ve Edebiyatı' },
    { id: 'felsefe', name: 'Felsefe' },
    { id: 'felsefe-ing', name: 'Felsefe (İngilizce)' },
    { id: 'fransiz', name: 'Fransız Dili ve Edebiyatı (Fransızca)' },
    { id: 'halkbilim', name: 'Halkbilimi' },
    { id: 'halkbilim-kktc', name: 'Halkbilimi (KKTC Uyruklu)' },
    { id: 'hindoloji', name: 'Hindoloji' },
    { id: 'hititoloji', name: 'Hititoloji' },
    { id: 'ingiliz', name: 'İngiliz Dili ve Edebiyatı (İngilizce)' },
    { id: 'ispanyol', name: 'İspanyol Dili ve Edebiyatı (İspanyolca)' },
    { id: 'italyan', name: 'İtalyan Dili ve Edebiyatı (İtalyanca)' },
    { id: 'japon', name: 'Japon Dili ve Edebiyatı' },
    { id: 'klasik-ark', name: 'Klasik Arkeoloji' },
    { id: 'kore', name: 'Kore Dili ve Edebiyatı' },
    { id: 'kore-kktc', name: 'Kore Dili ve Edebiyatı (KKTC Uyruklu)' },
    { id: 'latin', name: 'Latin Dili ve Edebiyatı' },
    { id: 'leh', name: 'Leh Dili ve Edebiyatı (Lehçe)' },
    { id: 'protohistorya', name: 'Protohistorya ve Ön Asya Arkeolojisi' },
    { id: 'psikoloji', name: 'Psikoloji' },
    { id: 'rus', name: 'Rus Dili ve Edebiyatı (Rusça)' },
    { id: 'sanat', name: 'Sanat Tarihi' },
    { id: 'sinoloji', name: 'Sinoloji' },
    { id: 'sosyoloji', name: 'Sosyoloji' },
    { id: 'sumeroloji', name: 'Sümeroloji' },
    { id: 'tarih', name: 'Tarih' },
    { id: 'tarih-oncesi', name: 'Tarih Öncesi Arkeolojisi' },
    { id: 'turk-edebiyat', name: 'Türk Dili ve Edebiyatı' },
    { id: 'urdu', name: 'Urdu Dili ve Edebiyatı' },
    { id: 'yunan-edebiyat', name: 'Yunan Dili ve Edebiyatı' },
    { id: 'yunan-edebiyat-kktc', name: 'Yunan Dili ve Edebiyatı (KKTC Uyruklu)' }
  ],
  'fen': [
    { id: 'astronomi', name: 'Astronomi ve Uzay Bilimleri' },
    { id: 'astronomi-kktc', name: 'Astronomi ve Uzay Bilimleri (KKTC Uyruklu)' },
    { id: 'bilgisayar-bilim', name: 'Bilgisayar Bilimleri' },
    { id: 'biyoloji', name: 'Biyoloji' },
    { id: 'biyoloji-ing', name: 'Biyoloji (İngilizce)' },
    { id: 'fizik', name: 'Fizik' },
    { id: 'istatistik', name: 'İstatistik' },
    { id: 'kimya', name: 'Kimya' },
    { id: 'kimya-ing', name: 'Kimya (İngilizce)' },
    { id: 'matematik', name: 'Matematik' },
    { id: 'matematik-ing', name: 'Matematik (İngilizce)' }
  ],
  'muhendislik': [
    { id: 'bilgisayar', name: 'Bilgisayar Mühendisliği' },
    { id: 'bilgisayar-ing', name: 'Bilgisayar Mühendisliği (İngilizce)' },
    { id: 'bilgisayar-ing-uolp', name: 'Bilgisayar Mühendisliği (İngilizce - UOLP Azerbaycan Teknik Üniversitesi)' },
    { id: 'biyomedikal', name: 'Biyomedikal Mühendisliği (İngilizce)' },
    { id: 'elektrik', name: 'Elektrik-Elektronik Mühendisliği (İngilizce)' },
    { id: 'fizik-muh', name: 'Fizik Mühendisliği (İngilizce)' },
    { id: 'fizik-muh-kktc', name: 'Fizik Mühendisliği (İngilizce) (KKTC Uyruklu)' },
    { id: 'gida', name: 'Gıda Mühendisliği (İngilizce)' },
    { id: 'insaat', name: 'İnşaat Mühendisliği' },
    { id: 'insaat-kktc', name: 'İnşaat Mühendisliği (KKTC Uyruklu)' },
    { id: 'jeofizik', name: 'Jeofizik Mühendisliği (İngilizce)' },
    { id: 'jeoloji', name: 'Jeoloji Mühendisliği (İngilizce)' },
    { id: 'kimya-muh', name: 'Kimya Mühendisliği (İngilizce)' },
    { id: 'yapay-zeka', name: 'Yapay Zeka ve Veri Mühendisliği' },
    { id: 'yazilim', name: 'Yazılım Mühendisliği' },
    { id: 'yazilim-kktc', name: 'Yazılım Mühendisliği (KKTC Uyruklu)' }
  ],
  'ziraat': [
    { id: 'bahce', name: 'Bahçe Bitkileri' },
    { id: 'bitki-koruma', name: 'Bitki Koruma' },
    { id: 'peyzaj', name: 'Peyzaj Mimarlığı' },
    { id: 'su-urunleri', name: 'Su Ürünleri Mühendisliği' },
    { id: 'su-urunleri-ing', name: 'Su Ürünleri Mühendisliği (İngilizce)' },
    { id: 'sut', name: 'Süt Teknolojisi' },
    { id: 'tarim-ekonomi', name: 'Tarım Ekonomisi' },
    { id: 'tarim-makine', name: 'Tarım Makineleri ve Teknolojileri Mühendisliği' },
    { id: 'tarim-yapi', name: 'Tarımsal Yapılar ve Sulama' },
    { id: 'tarla', name: 'Tarla Bitkileri' },
    { id: 'toprak', name: 'Toprak Bilimi ve Bitki Besleme' },
    { id: 'zootekni', name: 'Zootekni' }
  ],
  'siyasal': [
    { id: 'calisma', name: 'Çalışma Ekonomisi ve Endüstri İlişkileri' },
    { id: 'iktisat', name: 'İktisat' },
    { id: 'isletme', name: 'İşletme' },
    { id: 'isletme-ing', name: 'İşletme (İngilizce)' },
    { id: 'maliye', name: 'Maliye' },
    { id: 'politika', name: 'Politika ve Ekonomi (İngilizce)' },
    { id: 'siyaset', name: 'Siyaset Bilimi ve Kamu Yönetimi' },
    { id: 'uluslararasi', name: 'Uluslararası İlişkiler' }
  ],
  'saglik': [
    { id: 'beslenme', name: 'Beslenme ve Diyetetik' },
    { id: 'cocuk', name: 'Çocuk Gelişimi' },
    { id: 'odyoloji', name: 'Odyoloji' },
    { id: 'ortez', name: 'Ortez ve Protez' },
    { id: 'saglik-yonetim', name: 'Sağlık Yönetimi' },
    { id: 'sosyal-hizmet', name: 'Sosyal Hizmet' }
  ],
  'tip': [
    { id: 'tip', name: 'Tıp' },
    { id: 'tip-ing', name: 'Tıp (İngilizce)' }
  ],
  'dis': [
    { id: 'dis', name: 'Diş Hekimliği' },
    { id: 'dis-ing', name: 'Diş Hekimliği (İngilizce)' }
  ],
  'eczacilik': [
    { id: 'eczacilik', name: 'Eczacılık' },
    { id: 'eczacilik-ing', name: 'Eczacılık (İngilizce)' }
  ],
  'ilahiyat': [
    { id: 'ilahiyat', name: 'İlahiyat' },
    { id: 'ilahiyat-ing', name: 'İlahiyat (İngilizce)' },
    { id: 'ilahiyat-mtok', name: 'İlahiyat (M.T.O.K.)' }
  ],
  'veteriner': [
    { id: 'veterinerlik', name: 'Veterinerlik' },
    { id: 'veterinerlik-ing', name: 'Veterinerlik (İngilizce)' },
    { id: 'veterinerlik-kktc', name: 'Veterinerlik (İngilizce) (KKTC Uyruklu)' }
  ],
  'hukuk': [
    { id: 'hukuk', name: 'Hukuk' }
  ],
  'egitim': [
    { id: 'bilgisayar-egitim', name: 'Bilgisayar ve Öğretim Teknolojileri Öğretmenliği' },
    { id: 'okul-oncesi', name: 'Okul Öncesi Öğretmenliği' },
    { id: 'ozel-egitim', name: 'Özel Eğitim Öğretmenliği' },
    { id: 'rehberlik', name: 'Rehberlik ve Psikolojik Danışmanlık' },
    { id: 'sinif', name: 'Sınıf Öğretmenliği' },
    { id: 'sosyal-bilgiler', name: 'Sosyal Bilgiler Öğretmenliği' }
  ],
  'hemsirelik': [
    { id: 'ebelik', name: 'Ebelik' },
    { id: 'hemsirelik', name: 'Hemşirelik' }
  ],
  'gsf': [
    { id: 'kultur-koruma', name: 'Kültür Varlıklarını Koruma ve Onarım' }
  ],
  'iletisim': [
    { id: 'gazetecilik', name: 'Gazetecilik' },
    { id: 'halkla-iliskiler', name: 'Halkla İlişkiler ve Tanıtım' },
    { id: 'radyo', name: 'Radyo, Televizyon ve Sinema' },
    { id: 'yeni-medya', name: 'Yeni Medya ve İletişim' }
  ],
  'aue': [
    { id: 'arap-uzaktan', name: 'Arap Dili ve Edebiyatı (Uzaktan Öğretim)' },
    { id: 'cografya-uzaktan', name: 'Coğrafya (Uzaktan Öğretim)' },
    { id: 'elektronik-ticaret', name: 'Elektronik Ticaret ve Yönetimi (Açıköğretim)' },
    { id: 'gazetecilik-uzaktan', name: 'Gazetecilik (Uzaktan Öğretim)' },
    { id: 'halkla-iliskiler-uzaktan', name: 'Halkla İlişkiler ve Tanıtım (Uzaktan Öğretim)' },
    { id: 'ingiliz-uzaktan', name: 'İngiliz Dili ve Edebiyatı (İngilizce) (Uzaktan Öğretim)' },
    { id: 'radyo-uzaktan', name: 'Radyo, Televizyon ve Sinema (Uzaktan Öğretim)' },
    { id: 'rus-uzaktan', name: 'Rus Dili ve Edebiyatı (Rusça) (Uzaktan Öğretim)' },
    { id: 'sanat-uzaktan', name: 'Sanat Tarihi (Uzaktan Öğretim)' },
    { id: 'sinoloji-uzaktan', name: 'Sinoloji (Uzaktan Öğretim)' },
    { id: 'sosyal-hizmet-uzaktan', name: 'Sosyal Hizmet (Uzaktan Öğretim)' },
    { id: 'yonetim-bilisim', name: 'Yönetim Bilişim Sistemleri (Açıköğretim)' }
  ],
  'uygulamali': [
    { id: 'aktuerya', name: 'Aktüerya Bilimleri' },
    { id: 'gayrimenkul', name: 'Gayrimenkul Geliştirme ve Yönetimi' }
  ]
};

// Fakülte ID'sine göre bölüm listesini al
export const getDepartmentsByFaculty = (facultyId) => {
  return DEPARTMENTS[facultyId] || [];
};
