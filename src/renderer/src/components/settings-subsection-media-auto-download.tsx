import { authClient } from '../lib/auth-client';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { ListItem, ListItemButton, ListItemText, Radio, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import SettingsSubsectionHeader from './settings-subsection-header';

type ItemList = {
    key: string;
    label: string;
    value: boolean;
};

export default function SettingsSubsectionMediaAutoDownload() {
    const { data: session } = authClient.useSession();

    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const translations = {
        en: {
            title: 'Media auto download',
            subtitle: 'Change auto download settings for media',
            on: 'Activate auto download',
            off: 'Disable auto download',

            files: 'Photos',
            videos: 'Videos',
            voice: 'Voice messages',
        },
        ar: {
            title: 'تنزيل الوسائط التلقائي',
            subtitle: 'تغيير إعدادات التنزيل التلقائي للوسائط',
            on: 'تفعيل التنزيل التلقائي',
            off: 'إيقاف التنزيل التلقائي',

            files: 'الصور',
            videos: 'الفيديوهات',
            voice: 'الرسائل الصوتية',
        },
    };

    const t = translations[locale === 'ar' ? 'ar' : 'en'];

    const options: ItemList[] = [
        { key: 'on', label: t.on, value: true },
        { key: 'off', label: t.off, value: false },
    ];

    const [fileValue, setFileValue] = useState(session?.user?.fileMediaAutoDownload || false);
    const [videoValue, setVideoValue] = useState(session?.user?.videoMediaAutoDownload || false);
    const [voiceValue, setVoiceValue] = useState(session?.user?.voiceMediaAutoDownload || false);

    const [loading, setLoading] = useState(false);

    const updateSetting = async (
        type: 'file' | 'video' | 'voice',
        value: boolean
    ) => {
        if (loading) return;
        setLoading(true);

        const prev =
            type === 'file' ? fileValue :
                type === 'video' ? videoValue :
                    voiceValue;

        if (type === 'file') setFileValue(value);
        if (type === 'video') setVideoValue(value);
        if (type === 'voice') setVoiceValue(value);

        try {
            await authClient.updateUser({
                fileMediaAutoDownload:
                    type === 'file' ? value : undefined,
                videoMediaAutoDownload:
                    type === 'video' ? value : undefined,
                voiceMediaAutoDownload:
                    type === 'voice' ? value : undefined,
            });
        } catch (err) {
            if (type === 'file') setFileValue(prev);
            if (type === 'video') setVideoValue(prev);
            if (type === 'voice') setVoiceValue(prev);
        } finally {
            setLoading(false);
        }
    };

    const Section = ({
        title,
        value,
        onChange,
    }: {
        title: string;
        value: boolean;
        onChange: (val: boolean) => void;
    }) => (
        <Stack spacing={1}>
            <Typography sx={{ fontWeight: 500 }}>{title}</Typography>

            {options.map((item) => (
                <ListItemButton
                    key={item.key}
                    onClick={() => onChange(item.value)}
                    disabled={loading}
                    sx={{
                        borderRadius: 3,
                        opacity: loading ? 0.6 : 1,
                    }}
                >
                    <ListItem sx={{ gap: 2 }}>
                        <Radio
                            checked={value === item.value}
                            disableRipple
                            sx={{
                                '&.Mui-checked': { color: '#25D366' },
                            }}
                        />
                        <ListItemText primary={item.label} />
                    </ListItem>
                </ListItemButton>
            ))}
        </Stack>
    );

    return (
        <Stack spacing={4} className="px-5 pt-5" sx={{ width: '100%' }} dir={isRTL ? 'rtl' : 'ltr'}>
            <SettingsSubsectionHeader title={t.title} />

            <Typography variant="body2" sx={{ color: '#25D366' }}>
                {t.subtitle}
            </Typography>

            {/* SECTION 1 */}
            <Section
                title={t.files}
                value={fileValue}
                onChange={(v) => updateSetting('file', v)}
            />

            {/* SECTION 2 */}
            <Section
                title={t.videos}
                value={videoValue}
                onChange={(v) => updateSetting('video', v)}
            />

            {/* SECTION 3 */}
            <Section
                title={t.voice}
                value={voiceValue}
                onChange={(v) => updateSetting('voice', v)}
            />
        </Stack>
    );
}