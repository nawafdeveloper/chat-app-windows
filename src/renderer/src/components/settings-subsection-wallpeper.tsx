import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { Stack, Typography, Box } from '@mui/material';
import { useEffect } from 'react';
import SettingsSubsectionHeader from './settings-subsection-header';
import { authClient } from '../lib/auth-client';
import { useWallpaperStore } from '../store/use-update-wallpaper';

type ItemTheme = {
    key: string;
    label: string;
    darkColor: string;
    lightColor: string;
};

export default function SettingsSubsectionWallpeper() {
    const { data: session } = authClient.useSession();

    const {
        selectedKey,
        previewKey,
        isSaving,
        setSelected,
        setPreview,
        setSaving,
    } = useWallpaperStore();

    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const translations = {
        en: {
            title: 'Theme',
            subtitle: 'Select your preferred theme',
            default: 'Default',
            azure: 'Azure',
            slate: 'Slate',
            indigo: 'Indigo',
            lavender: 'Lavender',
            violet: 'Violet',
            rose: 'Rose',
            blush: 'Blush',
            sand: 'Sand',
            sage: 'Sage',
        },
        ar: {
            title: 'المظهر',
            subtitle: 'اختر المظهر المفضل لديك',
            default: 'افتراضي',
            azure: 'أزرق',
            slate: 'رمادي',
            indigo: 'نيلي',
            lavender: 'لافندر',
            violet: 'بنفسجي',
            rose: 'وردي',
            blush: 'خدودي',
            sand: 'رملي',
            sage: 'مريمي',
        },
    };

    const t = translations[locale === 'ar' ? 'ar' : 'en'];

    const itemTheme: ItemTheme[] = [
        { key: 'wallpaper-1', label: t.default, darkColor: '#242525', lightColor: '#EAE1D6' },
        { key: 'wallpaper-2', label: t.azure, darkColor: '#242526', lightColor: '#D6E1E1' },
        { key: 'wallpaper-3', label: t.slate, darkColor: '#242428', lightColor: '#D6DCE1' },
        { key: 'wallpaper-4', label: t.indigo, darkColor: '#242428', lightColor: '#D6D6E1' },
        { key: 'wallpaper-5', label: t.lavender, darkColor: '#252428', lightColor: '#DCD6E1' },
        { key: 'wallpaper-6', label: t.violet, darkColor: '#252424', lightColor: '#E1D6E1' },
        { key: 'wallpaper-7', label: t.rose, darkColor: '#252424', lightColor: '#E1D6DC' },
        { key: 'wallpaper-8', label: t.blush, darkColor: '#252424', lightColor: '#E1D6D6' },
        { key: 'wallpaper-9', label: t.sand, darkColor: '#242525', lightColor: '#E1DCD6' },
        { key: 'wallpaper-10', label: t.sage, darkColor: '#242626', lightColor: '#DCE1D6' },
    ];

    useEffect(() => {
        if (session?.user?.chatWallpaper && !selectedKey) {
            setSelected(session.user.chatWallpaper);
        }
    }, [session]);

    const handleSelect = async (key: string) => {
        if (isSaving) return;

        try {
            setSaving(true);
            setSelected(key);

            await authClient.updateUser({
                chatWallpaper: key,
            });

        } finally {
            setSaving(false);
        }
    };

    return (
        <Stack spacing={4} className="px-5 pt-5" sx={{ width: '100%' }} dir={isRTL ? 'rtl' : 'ltr'}>
            <SettingsSubsectionHeader title={t.title} />

            <Typography
                variant="body2"
                sx={{
                    color: '#25D366',
                    width: '100%',
                    textAlign: isRTL ? 'right' : 'left',
                }}
            >
                {t.subtitle}
            </Typography>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 2,
                }}
            >
                {itemTheme.map((item) => {
                    const isSelected = selectedKey === item.key;
                    const isHovered = previewKey === item.key;

                    return (
                        <Box
                            key={item.key}
                            onMouseEnter={() => setPreview(item.key)}
                            onMouseLeave={() => setPreview(null)}
                            onClick={() => handleSelect(item.key)}
                            sx={{
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.6 : 1,
                                pointerEvents: isSaving ? 'none' : 'auto',
                            }}
                        >
                            <Box
                                sx={(theme) => ({
                                    height: 70,
                                    borderRadius: 3,
                                    background: theme.palette.mode === 'dark' ? item.darkColor : item.lightColor,
                                    border: isSelected
                                        ? '2px solid #25D366'
                                        : isHovered
                                            ? `2px solid ${theme.palette.mode === 'dark' ? '#363636' : '#B8B8B8'}`
                                            : '2px solid transparent',
                                    transition: 'all 0.2s ease',
                                })}
                            />
                            <Typography
                                variant="caption"
                                sx={{
                                    mt: 1,
                                    display: 'block',
                                    textAlign: 'center',
                                }}
                            >
                                {item.label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Stack>
    );
}