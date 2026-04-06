import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "ar" | "en";

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  live: string;
  connected: string;
  reconnecting: string;
  offline: string;
  searchPlaceholder: string;
  totalAlerts: string;
  alertsLast24h: string;
  alertsLastHour: string;
  criticalAlerts: string;
  closedCheckpoints: string;
  liveMap: string;
  checkpoints: string;
  alerts: string;
  stats: string;
  liveFeed: string;
  pause: string;
  resume: string;
  allSeverities: string;
  allTypes: string;
  allRegions: string;
  allStatuses: string;
  critical: string;
  high: string;
  medium: string;
  low: string;
  open: string;
  closed: string;
  congested: string;
  military: string;
  slow: string;
  unknown: string;
  active: string;
  inactive: string;
  stale: string;
  crowded: string;
  verified: string;
  unverified: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  location: string;
  region: string;
  timestamp: string;
  confidence: string;
  details: string;
  coordinates: string;
  viewRawJson: string;
  hideRawJson: string;
  noAlertsFound: string;
  noCheckpointsFound: string;
  alertsBySeverity: string;
  alertsByType: string;
  alertsByRegion: string;
  all: string;
  filter: string;
  legend: string;
  alertMarker: string;
  shooting: string;
  closure: string;
  idfOperation: string;
  settlerViolence: string;
  injury: string;
  flyingCheckpoint: string;
  wbAlert: string;
  protest: string;
  demolition: string;
  arrestCampaign: string;
  lastVerified: string;
  checkpointsGrid: string;
  statusSummary: string;
  sortBy: string;
  nameAZ: string;
  nameZA: string;
  byStatus: string;
  byRegion: string;
  newestFirst: string;
  oldestFirst: string;
  crowdedOnly: string;
  staleOnly: string;
  results: string;
  regionalAttack: string;
  warNews: string;
  checkpointUpdate: string;
  rocketAttack: string;
  airstrike: string;
  explosion: string;
  general: string;
  roadClosure: string;
  routeStatus: string;
  selectRegion: string;
  clearRoute: string;
  blockedCheckpoints: string;
  allClear: string;
  updatedAgo: string;
  onYourRoute: string;
  dangerZone: string;
  safeToPass: string;
  noData: string;
  freshData: string;
  checkpointsClear: string;
  checkpointsBlocked: string;
  northZone: string;
  middleZone: string;
  southZone: string;
  idfRaid: string;
  settlerAttack: string;
  injuryReport: string;
  westBankSiren: string;
  routes: string;
  selectRoute: string;
  browseRoutes: string;
  routeDescription: string;
  enableLocation: string;
  nextCheckpoint: string;
  onRoute: string;
  distance: string;
  estimatedTime: string;
  home: string;
  settings: string;
  pushNotifications: string;
  language: string;
  safeRoutes: string;
  fastest: string;
  alternate: string;
  currentLocation: string;
  whereTo: string;
  nodes: string;
  safetyAlerts: string;
  startNavigation: string;
  viewOnMap: string;
}

const AR: Translations = {
  appTitle: "متتبع الضفة الغربية",
  appSubtitle: "مباشر",
  live: "مباشر",
  connected: "متصل",
  reconnecting: "جارٍ إعادة الاتصال",
  offline: "غير متصل",
  searchPlaceholder: "ابحث عن الحواجز أو المناطق...",
  totalAlerts: "إجمالي التنبيهات",
  alertsLast24h: "التنبيهات (24 ساعة)",
  alertsLastHour: "التنبيهات (الساعة الأخيرة)",
  criticalAlerts: "تنبيهات حرجة",
  closedCheckpoints: "حواجز مغلقة",
  liveMap: "الخريطة المباشرة",
  checkpoints: "الحواجز",
  alerts: "التنبيهات",
  stats: "الإحصائيات",
  liveFeed: "البث المباشر",
  pause: "إيقاف مؤقت",
  resume: "استئناف",
  allSeverities: "جميع مستويات الخطورة",
  allTypes: "جميع الأنواع",
  allRegions: "جميع المناطق",
  allStatuses: "جميع الحالات",
  critical: "حرج",
  high: "عالٍ",
  medium: "متوسط",
  low: "منخفض",
  open: "مفتوح",
  closed: "مغلق",
  congested: "مزدحم",
  military: "جيش الاحتلال",
  slow: "بطيء",
  unknown: "غير معروف",
  active: "نشط",
  inactive: "غير نشط",
  stale: "بيانات قديمة",
  crowded: "ازدحام",
  verified: "موثق",
  unverified: "غير موثق",
  justNow: "الآن",
  minutesAgo: "د",
  hoursAgo: "س",
  location: "الموقع",
  region: "المنطقة",
  timestamp: "الوقت",
  confidence: "مستوى الثقة",
  details: "التفاصيل",
  coordinates: "الإحداثيات",
  viewRawJson: "عرض البيانات الخام",
  hideRawJson: "إخفاء البيانات الخام",
  noAlertsFound: "لا توجد تنبيهات مطابقة للمعايير.",
  noCheckpointsFound: "لا توجد حواجز مطابقة.",
  alertsBySeverity: "التنبيهات حسب الخطورة",
  alertsByType: "التنبيهات حسب النوع",
  alertsByRegion: "التنبيهات حسب المنطقة",
  all: "الكل",
  filter: "تصفية",
  legend: "المفتاح",
  alertMarker: "تنبيه نشط",
  shooting: "إطلاق نار",
  closure: "إغلاق",
  idfOperation: "عملية جيش الاحتلال",
  settlerViolence: "عنف مستوطنين",
  injury: "إصابة",
  flyingCheckpoint: "حاجز طيار",
  wbAlert: "تنبيه ضفة",
  protest: "احتجاج",
  demolition: "هدم",
  arrestCampaign: "حملة اعتقالات",
  lastVerified: "آخر توثيق",
  checkpointsGrid: "شبكة الحواجز",
  statusSummary: "ملخص الحالة",
  sortBy: "ترتيب",
  nameAZ: "الاسم أ-ي",
  nameZA: "الاسم ي-أ",
  byStatus: "حسب الحالة",
  byRegion: "حسب المنطقة",
  newestFirst: "الأحدث أولاً",
  oldestFirst: "الأقدم أولاً",
  crowdedOnly: "مزدحم فقط",
  staleOnly: "بيانات قديمة فقط",
  results: "نتيجة",
  regionalAttack: "هجوم إقليمي",
  warNews: "أخبار حرب",
  checkpointUpdate: "تحديث الحواجز",
  rocketAttack: "صواريخ",
  airstrike: "غارة جوية",
  explosion: "انفجار",
  general: "عام",
  roadClosure: "إغلاق طريق",
  routeStatus: "حالة الطريق",
  selectRegion: "اختر المنطقة",
  clearRoute: "مسح",
  blockedCheckpoints: "حواجز مغلقة",
  allClear: "الطريق سالك",
  updatedAgo: "آخر تحديث",
  onYourRoute: "على طريقك",
  dangerZone: "خطر",
  safeToPass: "سالك",
  noData: "لا توجد بيانات",
  freshData: "بيانات حديثة",
  checkpointsClear: "جميع الحواجز سالكة",
  checkpointsBlocked: "حواجز مغلقة على طريقك",
  northZone: "الشمال",
  middleZone: "الوسط",
  southZone: "الجنوب",
  idfRaid: "اقتحام",
  settlerAttack: "اعتداء مستوطنين",
  injuryReport: "إصابة",
  westBankSiren: "صافرات إنذار",
  routes: "المسارات",
  selectRoute: "اختر مسار",
  browseRoutes: "استعرض المسارات",
  routeDescription: "اختر مسار لمشاهدة حالة الحواجز في الوقت الفعلي",
  enableLocation: "تفعيل الموقع",
  nextCheckpoint: "الحاجز التالي",
  onRoute: "على مسارك",
  distance: "المسافة",
  estimatedTime: "الوقت المتوقع",
  home: "الرئيسية",
  settings: "الإعدادات",
  pushNotifications: "إشعارات الهاتف",
  language: "اللغة",
  safeRoutes: "المسارات الآمنة",
  fastest: "الأسرع",
  alternate: "مسار بديل",
  currentLocation: "موقعي الحالي",
  whereTo: "إلى أين تريد الذهاب؟",
  nodes: "نقاط",
  safetyAlerts: "تنبيهات أمنية",
  startNavigation: "بدء التوجيه",
  viewOnMap: "تحديد على الخريطة",
};

const EN: Translations = {
  appTitle: "West Bank Live Tracker",
  appSubtitle: "Live",
  live: "LIVE",
  connected: "CONNECTED",
  reconnecting: "RECONNECTING",
  offline: "OFFLINE",
  searchPlaceholder: "Search checkpoints or regions...",
  totalAlerts: "Total Alerts",
  alertsLast24h: "Alerts Last 24h",
  alertsLastHour: "Alerts Last Hour",
  criticalAlerts: "Critical Alerts",
  closedCheckpoints: "Closed Checkpoints",
  liveMap: "Live Map",
  checkpoints: "Checkpoints",
  alerts: "Alerts",
  stats: "Stats",
  liveFeed: "Live Feed",
  pause: "Pause",
  resume: "Resume",
  allSeverities: "All Severities",
  allTypes: "All Types",
  allRegions: "All Regions",
  allStatuses: "All Statuses",
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  open: "Open",
  closed: "Closed",
  congested: "Congested",
  military: "Military",
  slow: "Slow",
  unknown: "Unknown",
  active: "Active",
  inactive: "Inactive",
  stale: "Stale",
  crowded: "Crowded",
  verified: "Verified",
  unverified: "Unverified",
  justNow: "Just now",
  minutesAgo: "m ago",
  hoursAgo: "h ago",
  location: "Location",
  region: "Region",
  timestamp: "Timestamp",
  confidence: "Confidence",
  details: "Details",
  coordinates: "Coordinates",
  viewRawJson: "View Raw JSON",
  hideRawJson: "Hide Raw JSON",
  noAlertsFound: "No alerts matching criteria.",
  noCheckpointsFound: "No checkpoints found.",
  alertsBySeverity: "Alerts by Severity",
  alertsByType: "Alerts by Type",
  alertsByRegion: "Alerts by Region",
  all: "All",
  filter: "Filter",
  legend: "Legend",
  alertMarker: "Active Alert",
  shooting: "Shooting",
  closure: "Closure",
  idfOperation: "IDF Operation",
  settlerViolence: "Settler Violence",
  injury: "Injury",
  flyingCheckpoint: "Flying Checkpoint",
  wbAlert: "WB Alert",
  protest: "Protest",
  demolition: "Demolition",
  arrestCampaign: "Arrest Campaign",
  lastVerified: "Last Verified",
  checkpointsGrid: "Checkpoints Grid",
  statusSummary: "Status Summary",
  sortBy: "Sort",
  nameAZ: "Name A-Z",
  nameZA: "Name Z-A",
  byStatus: "By Status",
  byRegion: "By Region",
  newestFirst: "Newest First",
  oldestFirst: "Oldest First",
  crowdedOnly: "Crowded Only",
  staleOnly: "Stale Only",
  results: "results",
  regionalAttack: "Regional Attack",
  warNews: "War News",
  checkpointUpdate: "Checkpoint Update",
  rocketAttack: "Rocket Attack",
  airstrike: "Airstrike",
  explosion: "Explosion",
  general: "General",
  roadClosure: "Road Closure",
  routeStatus: "Route Status",
  selectRegion: "Select Region",
  clearRoute: "Clear",
  blockedCheckpoints: "Blocked",
  allClear: "Route Clear",
  updatedAgo: "Updated",
  onYourRoute: "On Your Route",
  dangerZone: "Danger",
  safeToPass: "Clear",
  noData: "No Data",
  freshData: "Fresh",
  checkpointsClear: "All checkpoints clear",
  checkpointsBlocked: "Blocked checkpoints on your route",
  northZone: "North",
  middleZone: "Middle",
  southZone: "South",
  idfRaid: "IDF Raid",
  settlerAttack: "Settler Attack",
  injuryReport: "Injury Report",
  westBankSiren: "WB Siren",
  routes: "Routes",
  selectRoute: "Select Route",
  browseRoutes: "Browse Routes",
  routeDescription: "Select a route to see checkpoint status and real-time updates",
  enableLocation: "Enable Location",
  nextCheckpoint: "Next Checkpoint",
  onRoute: "On Your Route",
  distance: "Distance",
  estimatedTime: "Estimated Time",
  home: "Home",
  settings: "Settings",
  pushNotifications: "Push Notifications",
  language: "Language",
  safeRoutes: "Safe Routes",
  fastest: "Fastest",
  alternate: "Alternate",
  currentLocation: "Current Location",
  whereTo: "Where to?",
  nodes: "Nodes",
  safetyAlerts: "Safety Alerts",
  startNavigation: "Start Navigation",
  viewOnMap: "Locate on Map",
};

interface LangContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
  dir: "rtl" | "ltr";
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("ar");

  const value: LangContextValue = {
    lang,
    setLang,
    t: lang === "ar" ? AR : EN,
    dir: lang === "ar" ? "rtl" : "ltr",
  };

  return (
    <LangContext.Provider value={value}>
      <div dir={value.dir} lang={lang} className="h-full">
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

export function formatRelativeTime(date: Date | string, t: Translations, lang: Language = "en"): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - dateObj.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return t.justNow;
  if (lang === "ar") {
    // Arabic: "منذ X د" — number stays readable in RTL context
    if (hours < 1) return `منذ ${mins} ${t.minutesAgo}`;
    return `منذ ${hours} ${t.hoursAgo}`;
  }
  if (hours < 1) return `${mins}${t.minutesAgo} ago`;
  return `${hours}${t.hoursAgo} ago`;
}

export function getTypeLabel(type: string, t: Translations): string {
  const map: Record<string, string> = {
    shooting: t.shooting,
    closure: t.closure,
    idf_operation: t.idfOperation,
    settler_violence: t.settlerViolence,
    injury: t.injury,
    flying_checkpoint: t.flyingCheckpoint,
    wb_alert: t.wbAlert,
    protest: t.protest,
    west_bank_siren: t.westBankSiren,
    regional_attack: t.regionalAttack,
    idf_raid: t.idfRaid,
    settler_attack: t.settlerAttack,
    rocket_attack: t.rocketAttack,
    airstrike: t.airstrike,
    explosion: t.explosion,
    general: t.general,
    road_closure: t.roadClosure,
    demolition: t.demolition,
    arrest_campaign: t.arrestCampaign,
    injury_report: t.injuryReport,
  };
  return map[type] || type;
}

export function getStatusLabel(status: string, t: Translations): string {
  const map: Record<string, string> = {
    open: t.open,
    closed: t.closed,
    congested: t.congested,
    military: t.military,
    slow: t.slow,
    unknown: t.unknown,
  };
  return map[status] || status;
}
