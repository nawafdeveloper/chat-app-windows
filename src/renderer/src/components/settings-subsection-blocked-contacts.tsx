import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { Stack, Typography } from '@mui/material';
import SettingsSubsectionHeader from './settings-subsection-header';

export default function SettingsSubsectionBlockedContacts() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const translations = {
        en: {
            title: 'Blocked contacts',
        },
        ar: {
            title: 'جهات الإتصال المحضورة',
        }
    };

    const t = translations[locale === 'ar' ? 'ar' : 'en'];

    return (
        <Stack
            spacing={4}
            alignItems={'center'}
            className='px-5 pt-5'
            sx={{
                width: '100%',
            }}
        >
            <SettingsSubsectionHeader title={t.title} />
            <Typography>Blocked contacts</Typography>
        </Stack>
    )
}