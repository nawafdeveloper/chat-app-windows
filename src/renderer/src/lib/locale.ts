import { Locale } from "./i18n";

const VALID: Locale[] = ['ar', 'en'];
const KEY = 'yhla_lang_pref';
const COOKIE_KEY = 'yhla_web_lang_pref';

function isLocale(value: string | null): value is Locale {
  return value === 'ar' || value === 'en';
}

export function getLocale(): Locale {
  const stored = localStorage.getItem(KEY);
  if (isLocale(stored)) {
    return stored;
  }

  const cookieMatch = document.cookie.match(new RegExp(`${COOKIE_KEY}=([^;]+)`));
  const cookieLocale = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  if (isLocale(cookieLocale)) {
    localStorage.setItem(KEY, cookieLocale);
    return cookieLocale;
  }

  return 'en';
}

export function setLocale(locale: Locale): void {
  if (!VALID.includes(locale)) {
    return;
  }

  localStorage.setItem(KEY, locale);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(locale)}; path=/; max-age=31536000`;
  window.dispatchEvent(new Event('localeChanged'));
}
