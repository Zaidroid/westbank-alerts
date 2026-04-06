/**
 * West Bank Common Routes Database
 *
 * Routes define the typical paths travelers take between cities.
 * Each route includes checkpoints in travel order, allowing real-time
 * status tracking and navigation assistance.
 */

export interface RouteCheckpoint {
  canonical_key: string;
  name_ar: string;
  name_en?: string;
  latitude: number;
  longitude: number;
  distance_from_start_km: number; // Approximate distance from route start
}

export interface Route {
  id: string;
  name_ar: string;
  name_en: string;
  from: string;      // Origin city
  to: string;        // Destination city
  distance_km: number;
  estimated_time_min: number;
  checkpoints: RouteCheckpoint[];
  description_ar?: string;
  description_en?: string;
}

export const WB_ROUTES: Record<string, Route> = {
  // ── North-South Corridor (Route 60) ──────────────────────────────────────

  "ramallah-jerusalem": {
    id: "ramallah-jerusalem",
    name_ar: "رام الله ↔ القدس",
    name_en: "Ramallah ↔ Jerusalem",
    from: "Ramallah",
    to: "Jerusalem",
    distance_km: 15,
    estimated_time_min: 30,
    description_ar: "الطريق الرئيسية عبر قلنديا وبيت إيل",
    checkpoints: [
      { canonical_key: "DCO",       name_ar: "DCO",       name_en: "DCO (Beit El)",  latitude: 31.939, longitude: 35.225, distance_from_start_km: 0 },
      { canonical_key: "بيت_ايل",   name_ar: "بيت ايل",   name_en: "Beit El",         latitude: 31.943, longitude: 35.228, distance_from_start_km: 1 },
      { canonical_key: "الجلزون",   name_ar: "الجلزون",   name_en: "Al-Jalazun Camp", latitude: 31.951, longitude: 35.220, distance_from_start_km: 3 },
      { canonical_key: "قلنديا",    name_ar: "قلنديا",    name_en: "Qalandia",        latitude: 31.868, longitude: 35.221, distance_from_start_km: 8 },
      { canonical_key: "الرام",     name_ar: "الرام",     name_en: "Ar-Ram",          latitude: 31.851, longitude: 35.228, distance_from_start_km: 11 },
      { canonical_key: "شعفاط",     name_ar: "شعفاط",     name_en: "Shu'fat",         latitude: 31.813, longitude: 35.238, distance_from_start_km: 15 },
    ],
  },

  "ramallah-nablus": {
    id: "ramallah-nablus",
    name_ar: "رام الله ↔ نابلس",
    name_en: "Ramallah ↔ Nablus",
    from: "Ramallah",
    to: "Nablus",
    distance_km: 55,
    estimated_time_min: 70,
    description_ar: "الطريق الرئيسية شمالاً عبر زعتره وحواره",
    checkpoints: [
      { canonical_key: "عطاره",             name_ar: "عطاره",             name_en: "Atara",                      latitude: 32.015,  longitude: 35.187,  distance_from_start_km: 0 },
      { canonical_key: "عيون_الحراميه",     name_ar: "عيون الحراميه",     name_en: "Uyun al-Haramiyya",          latitude: 32.0283, longitude: 35.2364, distance_from_start_km: 8 },
      { canonical_key: "سنجل",              name_ar: "سنجل",              name_en: "Sinjil",                     latitude: 32.0311, longitude: 35.2589, distance_from_start_km: 12 },
      { canonical_key: "اللبن_الشرقيه",     name_ar: "اللبن الشرقيه",     name_en: "Al-Lubban ash-Sharqiya",     latitude: 32.076,  longitude: 35.259,  distance_from_start_km: 22 },
      { canonical_key: "اشارات_زعتره",      name_ar: "اشارات زعتره",      name_en: "Za'tara Junction Signals",   latitude: 32.134,  longitude: 35.243,  distance_from_start_km: 32 },
      { canonical_key: "زعتره",             name_ar: "زعتره",             name_en: "Za'tara (Tapuach)",          latitude: 32.1347, longitude: 35.2456, distance_from_start_km: 33 },
      { canonical_key: "حواره",             name_ar: "حوارة",             name_en: "Huwara",                     latitude: 32.1587, longitude: 35.2538, distance_from_start_km: 42 },
      { canonical_key: "التفافي_حواره",     name_ar: "التفافي حوارة",     name_en: "Huwara Bypass Road",         latitude: 32.160,  longitude: 35.258,  distance_from_start_km: 43 },
      { canonical_key: "بورين",             name_ar: "بورين",             name_en: "Burin",                      latitude: 32.1728, longitude: 35.2361, distance_from_start_km: 48 },
      { canonical_key: "يتسهار",            name_ar: "يتسهار",            name_en: "Yitzhar",                    latitude: 32.147,  longitude: 35.232,  distance_from_start_km: 55 },
    ],
  },

  "nablus-jenin": {
    id: "nablus-jenin",
    name_ar: "نابلس ↔ جنين",
    name_en: "Nablus ↔ Jenin",
    from: "Nablus",
    to: "Jenin",
    distance_km: 42,
    estimated_time_min: 50,
    description_ar: "الطريق الشمالية عبر حومش ودوتان",
    checkpoints: [
      { canonical_key: "بتما_قبلان",  name_ar: "بتما قبلان",  name_en: "Bitma-Qabalan",  latitude: 32.197,  longitude: 35.242,  distance_from_start_km: 0 },
      { canonical_key: "حومش",        name_ar: "حومش",        name_en: "Homesh",         latitude: 32.285,  longitude: 35.195,  distance_from_start_km: 14 },
      { canonical_key: "دوتان",       name_ar: "دوتان",       name_en: "Dotan",          latitude: 32.389,  longitude: 35.211,  distance_from_start_km: 25 },
      { canonical_key: "قباطيه",      name_ar: "قباطية",      name_en: "Qabatiya",       latitude: 32.404,  longitude: 35.279,  distance_from_start_km: 32 },
      { canonical_key: "عرابه",       name_ar: "عرابة",       name_en: "Arraba",         latitude: 32.455,  longitude: 35.236,  distance_from_start_km: 38 },
      { canonical_key: "الجلمه",      name_ar: "الجلمة",      name_en: "Al-Jalama",      latitude: 32.512,  longitude: 35.279,  distance_from_start_km: 42 },
    ],
  },

  "bethlehem-hebron": {
    id: "bethlehem-hebron",
    name_ar: "بيت لحم ↔ الخليل",
    name_en: "Bethlehem ↔ Hebron",
    from: "Bethlehem",
    to: "Hebron",
    distance_km: 30,
    estimated_time_min: 40,
    description_ar: "الطريق الجنوبية عبر العروب وحلحول",
    checkpoints: [
      { canonical_key: "بيت_فجار",  name_ar: "بيت فجار",  name_en: "Beit Fajjar",      latitude: 31.657, longitude: 35.206, distance_from_start_km: 0 },
      { canonical_key: "العروب",    name_ar: "العروب",    name_en: "Al-Arroub Camp",   latitude: 31.599, longitude: 35.101, distance_from_start_km: 10 },
      { canonical_key: "حلحول",     name_ar: "حلحول",     name_en: "Halhul",           latitude: 31.588, longitude: 35.093, distance_from_start_km: 14 },
      { canonical_key: "جسر_حلحول", name_ar: "جسر حلحول", name_en: "Halhul Bridge",    latitude: 31.585, longitude: 35.092, distance_from_start_km: 15 },
      { canonical_key: "النشاش",    name_ar: "النشاش",    name_en: "An-Nashash",       latitude: 31.582, longitude: 35.089, distance_from_start_km: 18 },
      { canonical_key: "بني_نعيم",  name_ar: "بني نعيم",  name_en: "Bani Na'im",       latitude: 31.528, longitude: 35.119, distance_from_start_km: 24 },
      { canonical_key: "راس_الجوره",name_ar: "راس الجوره",name_en: "Ras al-Jora",      latitude: 31.534, longitude: 35.097, distance_from_start_km: 30 },
    ],
  },

  // ── East-West Routes ─────────────────────────────────────────────────────

  "ramallah-jericho": {
    id: "ramallah-jericho",
    name_ar: "رام الله ↔ أريحا",
    name_en: "Ramallah ↔ Jericho",
    from: "Ramallah",
    to: "Jericho",
    distance_km: 40,
    estimated_time_min: 50,
    description_ar: "الطريق الشرقية نحو وادي الأردن",
    checkpoints: [
      { canonical_key: "عين_سينيا",  name_ar: "عين سينيا",  name_en: "Ein Sinya",     latitude: 31.983, longitude: 35.224, distance_from_start_km: 0 },
      { canonical_key: "حزما",       name_ar: "حزما",       name_en: "Hizma",         latitude: 31.823, longitude: 35.264, distance_from_start_km: 15 },
      { canonical_key: "جبع",        name_ar: "جبع",        name_en: "Jaba'",         latitude: 31.865, longitude: 35.253, distance_from_start_km: 20 },
      { canonical_key: "المعرجات",   name_ar: "المعرجات",   name_en: "Al-Ma'arjat",   latitude: 31.835, longitude: 35.390, distance_from_start_km: 30 },
      { canonical_key: "النويعمه",   name_ar: "النويعمة",   name_en: "An-Nuwei'ma",   latitude: 31.867, longitude: 35.450, distance_from_start_km: 40 },
    ],
  },

  "nablus-tulkarm": {
    id: "nablus-tulkarm",
    name_ar: "نابلس ↔ طولكرم",
    name_en: "Nablus ↔ Tulkarm",
    from: "Nablus",
    to: "Tulkarm",
    distance_km: 45,
    estimated_time_min: 55,
    description_ar: "الطريق الغربية عبر دير شرف وبزاريا",
    checkpoints: [
      { canonical_key: "دير_شرف",       name_ar: "دير شرف",       name_en: "Deir Sharaf",        latitude: 32.238, longitude: 35.183, distance_from_start_km: 0 },
      { canonical_key: "شافي_شمرون",    name_ar: "شافي شمرون",    name_en: "Shavei Shomron",     latitude: 32.228, longitude: 35.214, distance_from_start_km: 5 },
      { canonical_key: "بزاريا",        name_ar: "بزاريا",        name_en: "Bazzariya",          latitude: 32.246, longitude: 35.170, distance_from_start_km: 12 },
      { canonical_key: "مدخل_بزاريا",   name_ar: "مدخل بزاريا",   name_en: "Bazzariya Entrance", latitude: 32.245, longitude: 35.169, distance_from_start_km: 13 },
      { canonical_key: "عنبتا",         name_ar: "عنبتا",         name_en: "Anabta",             latitude: 32.305, longitude: 35.134, distance_from_start_km: 28 },
      { canonical_key: "جباره",         name_ar: "جبارة",         name_en: "Jabara",             latitude: 32.301, longitude: 35.105, distance_from_start_km: 35 },
      { canonical_key: "بيت_ليد",       name_ar: "بيت ليد",       name_en: "Beit Lid",           latitude: 32.293, longitude: 35.168, distance_from_start_km: 40 },
    ],
  },

  "nablus-qalqilya": {
    id: "nablus-qalqilya",
    name_ar: "نابلس ↔ قلقيليه",
    name_en: "Nablus ↔ Qalqilya",
    from: "Nablus",
    to: "Qalqilya",
    distance_km: 50,
    estimated_time_min: 65,
    description_ar: "الطريق الغربية عبر سلفيت وبديا",
    checkpoints: [
      { canonical_key: "جماعين",     name_ar: "جماعين",     name_en: "Jamma'in",         latitude: 32.1547, longitude: 35.1892, distance_from_start_km: 0 },
      { canonical_key: "كفل_حارس",  name_ar: "كفل حارس",  name_en: "Kifl Haris",       latitude: 32.088,  longitude: 35.134,  distance_from_start_km: 10 },
      { canonical_key: "حارس",      name_ar: "حارس",      name_en: "Haris",            latitude: 32.092,  longitude: 35.128,  distance_from_start_km: 12 },
      { canonical_key: "بروقين",    name_ar: "بروقين",    name_en: "Bruqin",           latitude: 32.082,  longitude: 35.096,  distance_from_start_km: 18 },
      { canonical_key: "بديا",      name_ar: "بديا",      name_en: "Bidya",            latitude: 32.071,  longitude: 35.076,  distance_from_start_km: 24 },
      { canonical_key: "كفر_ثلث",   name_ar: "كفر ثلث",   name_en: "Kafr Thulth",      latitude: 32.147,  longitude: 35.069,  distance_from_start_km: 34 },
      { canonical_key: "الفندق",    name_ar: "الفندق",    name_en: "Al-Funduq",        latitude: 32.159,  longitude: 35.088,  distance_from_start_km: 40 },
      { canonical_key: "بوابه_عزون",name_ar: "بوابة عزون",name_en: "Azzun Gate",       latitude: 32.172,  longitude: 35.042,  distance_from_start_km: 50 },
    ],
  },

  "tulkarm-qalqilya": {
    id: "tulkarm-qalqilya",
    name_ar: "طولكرم ↔ قلقيليه",
    name_en: "Tulkarm ↔ Qalqilya",
    from: "Tulkarm",
    to: "Qalqilya",
    distance_km: 25,
    estimated_time_min: 30,
    description_ar: "الطريق الغربية بين طولكرم وقلقيليه",
    checkpoints: [
      { canonical_key: "شويكه",      name_ar: "شويكه",      name_en: "Shweikeh",     latitude: 32.315, longitude: 35.026, distance_from_start_km: 0 },
      { canonical_key: "نور_شمس",   name_ar: "نور شمس",   name_en: "Nur Shams",    latitude: 32.319, longitude: 35.062, distance_from_start_km: 4 },
      { canonical_key: "عنبتا",      name_ar: "عنبتا",      name_en: "Anabta",       latitude: 32.305, longitude: 35.134, distance_from_start_km: 10 },
      { canonical_key: "عناب",       name_ar: "عناب",       name_en: "Anab / Enav",  latitude: 32.279, longitude: 35.143, distance_from_start_km: 14 },
      { canonical_key: "بلعا",       name_ar: "بلعا",       name_en: "Bal'a",        latitude: 32.288, longitude: 35.108, distance_from_start_km: 18 },
      { canonical_key: "اماتين",     name_ar: "اماتين",     name_en: "Immatain",     latitude: 32.177, longitude: 35.106, distance_from_start_km: 22 },
      { canonical_key: "بوابه_عزون", name_ar: "بوابة عزون", name_en: "Azzun Gate",   latitude: 32.172, longitude: 35.042, distance_from_start_km: 25 },
    ],
  },

  // ── Cross-Region Routes ──────────────────────────────────────────────────

  "ramallah-bethlehem": {
    id: "ramallah-bethlehem",
    name_ar: "رام الله ↔ بيت لحم",
    name_en: "Ramallah ↔ Bethlehem",
    from: "Ramallah",
    to: "Bethlehem",
    distance_km: 30,
    estimated_time_min: 45,
    description_ar: "عبر حزما والكنتينر (وادي النار)",
    checkpoints: [
      { canonical_key: "عين_سينيا",  name_ar: "عين سينيا",  name_en: "Ein Sinya",            latitude: 31.983, longitude: 35.224, distance_from_start_km: 0 },
      { canonical_key: "حزما",       name_ar: "حزما",       name_en: "Hizma",                latitude: 31.823, longitude: 35.264, distance_from_start_km: 12 },
      { canonical_key: "جبع",        name_ar: "جبع",        name_en: "Jaba'",                latitude: 31.865, longitude: 35.253, distance_from_start_km: 16 },
      { canonical_key: "الكنتينر",   name_ar: "الكنتينر",   name_en: "Container (Wadi Nar)", latitude: 31.731, longitude: 35.258, distance_from_start_km: 30 },
    ],
  },

  "hebron-jerusalem": {
    id: "hebron-jerusalem",
    name_ar: "الخليل ↔ القدس",
    name_en: "Hebron ↔ Jerusalem",
    from: "Hebron",
    to: "Jerusalem",
    distance_km: 38,
    estimated_time_min: 55,
    description_ar: "عبر بيت لحم والكنتينر وأبو ديس",
    checkpoints: [
      { canonical_key: "راس_الجوره", name_ar: "راس الجوره", name_en: "Ras al-Jora",          latitude: 31.534, longitude: 35.097, distance_from_start_km: 0 },
      { canonical_key: "بني_نعيم",   name_ar: "بني نعيم",   name_en: "Bani Na'im",           latitude: 31.528, longitude: 35.119, distance_from_start_km: 4 },
      { canonical_key: "العروب",     name_ar: "العروب",     name_en: "Al-Arroub Camp",       latitude: 31.599, longitude: 35.101, distance_from_start_km: 12 },
      { canonical_key: "بيت_فجار",   name_ar: "بيت فجار",   name_en: "Beit Fajjar",          latitude: 31.657, longitude: 35.206, distance_from_start_km: 20 },
      { canonical_key: "الكنتينر",   name_ar: "الكنتينر",   name_en: "Container (Wadi Nar)", latitude: 31.731, longitude: 35.258, distance_from_start_km: 28 },
      { canonical_key: "ابو_ديس",    name_ar: "ابو ديس",    name_en: "Abu Dis",              latitude: 31.762, longitude: 35.260, distance_from_start_km: 35 },
    ],
  },

  "ramallah-salfit": {
    id: "ramallah-salfit",
    name_ar: "رام الله ↔ سلفيت",
    name_en: "Ramallah ↔ Salfit",
    from: "Ramallah",
    to: "Salfit",
    distance_km: 30,
    estimated_time_min: 40,
    description_ar: "شمال غرب عبر روابي ومردا",
    checkpoints: [
      { canonical_key: "روابي",          name_ar: "روابي",          name_en: "Rawabi",                 latitude: 32.030,  longitude: 35.163, distance_from_start_km: 0 },
      { canonical_key: "عطاره",          name_ar: "عطاره",          name_en: "Atara",                  latitude: 32.015,  longitude: 35.187, distance_from_start_km: 5 },
      { canonical_key: "مردا",           name_ar: "مردا",           name_en: "Marda",                  latitude: 32.089,  longitude: 35.149, distance_from_start_km: 14 },
      { canonical_key: "اسكاكا",         name_ar: "اسكاكا",         name_en: "Iskaka",                 latitude: 32.103,  longitude: 35.164, distance_from_start_km: 18 },
      { canonical_key: "اشارات_ارائيل",  name_ar: "اشارات ارائيل",  name_en: "Ariel Junction Signals", latitude: 32.105,  longitude: 35.165, distance_from_start_km: 19 },
      { canonical_key: "سلفيت_الشمالي",  name_ar: "سلفيت الشمالي",  name_en: "Salfit North",           latitude: 32.087,  longitude: 35.175, distance_from_start_km: 30 },
    ],
  },

  "nablus-jericho": {
    id: "nablus-jericho",
    name_ar: "نابلس ↔ أريحا",
    name_en: "Nablus ↔ Jericho",
    from: "Nablus",
    to: "Jericho",
    distance_km: 55,
    estimated_time_min: 75,
    description_ar: "شرقاً عبر بيت فوريك ووادي الأردن",
    checkpoints: [
      { canonical_key: "بيت_فوريك",  name_ar: "بيت فوريك",  name_en: "Beit Furik",    latitude: 32.190, longitude: 35.312, distance_from_start_km: 0 },
      { canonical_key: "عورتا",      name_ar: "عورتا",      name_en: "Awarta",        latitude: 32.170, longitude: 35.305, distance_from_start_km: 5 },
      { canonical_key: "عقربا",      name_ar: "عقربا",      name_en: "Aqraba",        latitude: 32.135, longitude: 35.350, distance_from_start_km: 15 },
      { canonical_key: "عين_شبلي",   name_ar: "عين شبلي",   name_en: "Ein Shibli",    latitude: 32.195, longitude: 35.360, distance_from_start_km: 25 },
      { canonical_key: "الحمرا",     name_ar: "الحمرا",     name_en: "Al-Hamra",      latitude: 32.275, longitude: 35.460, distance_from_start_km: 40 },
      { canonical_key: "فصايل",      name_ar: "فصايل",      name_en: "Fasayil",       latitude: 32.028, longitude: 35.432, distance_from_start_km: 55 },
    ],
  },

  "jenin-tubas": {
    id: "jenin-tubas",
    name_ar: "جنين ↔ طوباس",
    name_en: "Jenin ↔ Tubas",
    from: "Jenin",
    to: "Tubas",
    distance_km: 25,
    estimated_time_min: 35,
    description_ar: "شرقاً نحو الأغوار الشمالية",
    checkpoints: [
      { canonical_key: "جلبون",    name_ar: "جلبون",    name_en: "Jalbon",        latitude: 32.439, longitude: 35.334, distance_from_start_km: 0 },
      { canonical_key: "الفارعه",  name_ar: "الفارعة",  name_en: "Al-Fara'a Camp", latitude: 32.280, longitude: 35.373, distance_from_start_km: 10 },
      { canonical_key: "طمون",     name_ar: "طمون",     name_en: "Tamun",         latitude: 32.308, longitude: 35.365, distance_from_start_km: 16 },
      { canonical_key: "عقابا",    name_ar: "عقابا",    name_en: "Aqaba",         latitude: 32.342, longitude: 35.374, distance_from_start_km: 20 },
      { canonical_key: "تياسير",   name_ar: "تياسير",   name_en: "Tayasir",       latitude: 32.335, longitude: 35.420, distance_from_start_km: 25 },
    ],
  },

  "jenin-tulkarm": {
    id: "jenin-tulkarm",
    name_ar: "جنين ↔ طولكرم",
    name_en: "Jenin ↔ Tulkarm",
    from: "Jenin",
    to: "Tulkarm",
    distance_km: 35,
    estimated_time_min: 45,
    description_ar: "الطريق الغربية عبر يعبد ودوتان",
    checkpoints: [
      { canonical_key: "يعبد",      name_ar: "يعبد",      name_en: "Ya'bad",    latitude: 32.438, longitude: 35.173, distance_from_start_km: 0 },
      { canonical_key: "مسليه",     name_ar: "مسلية",     name_en: "Masaliya",  latitude: 32.455, longitude: 35.191, distance_from_start_km: 5 },
      { canonical_key: "دوتان",     name_ar: "دوتان",     name_en: "Dotan",     latitude: 32.389, longitude: 35.211, distance_from_start_km: 14 },
      { canonical_key: "بيت_ليد",   name_ar: "بيت ليد",   name_en: "Beit Lid",  latitude: 32.293, longitude: 35.168, distance_from_start_km: 25 },
      { canonical_key: "عنبتا",     name_ar: "عنبتا",     name_en: "Anabta",    latitude: 32.305, longitude: 35.134, distance_from_start_km: 30 },
      { canonical_key: "جباره",     name_ar: "جبارة",     name_en: "Jabara",    latitude: 32.301, longitude: 35.105, distance_from_start_km: 35 },
    ],
  },
};

/**
 * Get all available routes
 */
export function getAllRoutes(): Route[] {
  return Object.values(WB_ROUTES);
}

/**
 * Get a specific route by ID
 */
export function getRouteById(id: string): Route | undefined {
  return WB_ROUTES[id];
}

/**
 * Search routes by city name (from or to)
 */
export function searchRoutesByCity(city: string): Route[] {
  const normalized = city.toLowerCase();
  return getAllRoutes().filter(route =>
    route.from.toLowerCase().includes(normalized) ||
    route.to.toLowerCase().includes(normalized) ||
    route.name_ar.includes(city)
  );
}

/**
 * Get checkpoint health for a route
 * Returns counts of checkpoints in each status
 */
export function getRouteHealth(route: Route, checkpointStatusMap: Record<string, string>) {
  const health = {
    open: 0,
    closed: 0,
    congested: 0,
    military: 0,
    slow: 0,
    unknown: 0,
  };

  route.checkpoints.forEach(cp => {
    const status = checkpointStatusMap[cp.canonical_key] || "unknown";
    if (status in health) {
      health[status as keyof typeof health]++;
    }
  });

  return health;
}

/**
 * Check if a checkpoint is on a route
 */
export function isCheckpointOnRoute(canonicalKey: string, route: Route): boolean {
  return route.checkpoints.some(cp => cp.canonical_key === canonicalKey);
}

/**
 * Get all routes that pass through a checkpoint
 */
export function getRoutesForCheckpoint(canonicalKey: string): Route[] {
  return getAllRoutes().filter(route => isCheckpointOnRoute(canonicalKey, route));
}

/**
 * Return lowercased search terms for matching alerts/areas to a route
 */
export function getRouteSearchTerms(route: Route): string[] {
  return [
    route.from,
    route.to,
    ...route.checkpoints.map(cp => cp.name_en || '').filter(Boolean),
    ...route.checkpoints.map(cp => cp.name_ar),
  ].map(t => t.toLowerCase()).filter(Boolean);
}

/**
 * Check if an alert area is relevant to a route
 */
export function isAreaOnRoute(area: string | null | undefined, route: Route): boolean {
  if (!area) return false;
  const lower = area.toLowerCase();
  const terms = getRouteSearchTerms(route);
  return terms.some(t => lower.includes(t) || t.includes(lower));
}
