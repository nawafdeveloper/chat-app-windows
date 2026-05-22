'use client';

import { Locale } from "./i18n";
import { getLocale } from "./locale";

export function getLocaleDisplayName(locale: Locale): string {
    return locale === 'ar' ? 'العربية' : 'English';
}

export function isRTLClient(locale: Locale): boolean {
    return locale === 'ar';
}

export function getLocaleFromCookie(): Locale | null {
    if (typeof window === 'undefined') return null;
    const match = document.cookie.match(/yhla_web_lang_pref=([^;]+)/);
    return match ? (decodeURIComponent(match[1]) as Locale) : getLocale();
}
