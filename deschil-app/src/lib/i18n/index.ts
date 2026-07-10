import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import ar from "./ar.json";
import en from "./en.json";

let initialized = false;

export function initI18n(initialLocale?: string) {
  if (initialized) return i18n;
  const instance = i18n.use(initReactI18next);
  if (typeof window !== "undefined") {
    instance.use(LanguageDetector);
  }
  instance.init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: initialLocale ?? "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });
  initialized = true;
  return i18n;
}

export function isRtlLocale(locale: string): boolean {
  return locale.startsWith("ar") || locale.startsWith("he") || locale.startsWith("fa");
}

export { i18n };
