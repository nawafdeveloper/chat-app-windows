import { Stack } from '@mui/material';
import SettingsHeader from './settings-header';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';

export default function SettingsSectionHelp() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    return (
        <Stack
            spacing={4}
            alignItems={'center'}
            className='px-5 pt-5'
            sx={{
                width: '100%',
            }}
        >
            <SettingsHeader title={isRTL ? 'المساعدة' : 'Help & feedback'} />
        </Stack>
    )
}