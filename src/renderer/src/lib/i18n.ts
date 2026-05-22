export type Locale = 'ar' | 'en'

const dict = {
    ar: {
        welcome: 'مرحباً',
        dashboard: 'لوحة التحكم',
        settings: 'الإعدادات',
        logout: 'تسجيل الخروج',
        switchLang: 'English',
    },
    en: {
        welcome: 'Welcome',
        dashboard: 'Dashboard',
        settings: 'Settings',
        logout: 'Log out',
        switchLang: 'العربية',
    },
} as const

export type TKey = keyof typeof dict.en

export function getT(locale: Locale) {
    return (key: TKey): string => dict[locale][key]
}