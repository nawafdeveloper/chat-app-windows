interface Translations {
    justNow: string;
    minute: string;
    hour: string;
    yesterday: string;
    days: string[];
    week: string;
    weeks: string;
    month: string;
    months: string;
    dateFormat: Intl.DateTimeFormatOptions;
    localeCode: string;
}

type Locale = "ar" | "en" | null;

const translations: Record<Exclude<Locale, null>, Translations> = {
    en: {
        justNow: 'just now',
        minute: 'm',
        hour: 'h',
        yesterday: 'yesterday',
        days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        week: 'week',
        weeks: 'weeks',
        month: 'month',
        months: 'months',
        dateFormat: { year: 'numeric', month: 'short', day: 'numeric' },
        localeCode: 'en-US'
    },
    ar: {
        justNow: 'الآن',
        minute: 'د',
        hour: 'س',
        yesterday: 'أمس',
        days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
        week: 'أسبوع',
        weeks: 'أسابيع',
        month: 'شهر',
        months: 'أشهر',
        dateFormat: { year: 'numeric', month: 'short', day: 'numeric' },
        localeCode: 'ar-EG'
    }
};

export function formatRelativeDate(
    dateInput: Date | string | number,
    locale: Locale = 'en'
): string {
    // Handle null locale by defaulting to 'en'
    const t = translations[locale ?? 'en'];
    const now = new Date();
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
        return t.justNow;
    }

    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
        return t.justNow;
    }

    if (diffMinutes < 60) {
        return `${diffMinutes}${t.minute}`;
    }

    if (diffHours < 24) {
        return `${diffHours}${t.hour}`;
    }

    if (diffDays === 1) {
        return t.yesterday;
    }

    if (diffDays < 7) {
        return t.days[date.getDay()];
    }

    if (diffWeeks < 4) {
        return `${diffWeeks} ${diffWeeks === 1 ? t.week : t.weeks}`;
    }

    if (diffMonths < 12) {
        return `${diffMonths} ${diffMonths === 1 ? t.month : t.months}`;
    }

    return date.toLocaleDateString(t.localeCode, t.dateFormat);
}