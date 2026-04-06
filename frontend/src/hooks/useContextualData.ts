/**
 * useContextualData — fetches market, weather, and prayer times.
 * All three are cached aggressively (data doesn't change minute-to-minute).
 */

import { useQuery } from "@tanstack/react-query";
import { getMarketData, getWeather, getPrayerTimes } from "@/lib/api/endpoints";
import type { MarketData, WeatherResponse, PrayerTimesResponse, PrayerCity } from "@/lib/api/types";

const PRAYER_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const PRAYER_AR: Record<string, string> = {
  Fajr: "الفجر", Sunrise: "الشروق", Dhuhr: "الظهر",
  Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء",
};

/** Find the next prayer from the Ramallah city prayers */
export function getNextPrayer(city: PrayerCity): { name: string; nameAr: string; time: string } | null {
  const now = new Date();
  const hhmm = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (const key of PRAYER_ORDER) {
    const t = city.prayers[key];
    if (!t) continue;
    if (hhmm(t) > nowMin) {
      return { name: key, nameAr: PRAYER_AR[key] || key, time: t };
    }
  }
  // After Isha — next is Fajr (tomorrow)
  const fajr = city.prayers["Fajr"];
  return fajr ? { name: "Fajr", nameAr: "الفجر", time: fajr } : null;
}

export function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ["market"],
    queryFn: getMarketData,
    staleTime: 15 * 60 * 1000,   // 15 min
    refetchInterval: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useWeatherData() {
  return useQuery<WeatherResponse>({
    queryKey: ["weather"],
    queryFn: getWeather,
    staleTime: 10 * 60 * 1000,   // 10 min
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });
}

export function usePrayerTimes() {
  return useQuery<PrayerTimesResponse>({
    queryKey: ["prayer-times"],
    queryFn: getPrayerTimes,
    staleTime: 60 * 60 * 1000,   // 1 hour (doesn't change)
    refetchInterval: 6 * 60 * 60 * 1000,
    retry: 1,
  });
}
