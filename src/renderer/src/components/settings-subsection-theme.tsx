import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { ListItem, ListItemButton, ListItemText, Radio, Stack, Typography } from '@mui/material';
import SettingsSubsectionHeader from './settings-subsection-header';
import { appThemeVars, useAppTheme } from '../context/theme';

type ItemList = {
    key: string;
    label: string;
    value: "light" | "dark" | "system";
}

export default function SettingsSubsectionTheme() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { theme, setTheme } = useAppTheme();

    const translations = {
        en: {
            title: 'Theme',
            subtitle: 'Select your preferred theme',
            system: 'System theme',
            dark: 'Dark theme',
            light: 'Light theme'
        },
        ar: {
            title: 'المظهر',
            subtitle: 'اختر النمط الذي تفضله',
            system: 'نمط النظام',
            dark: 'الوضع الداكن',
            light: 'الوضع الفاتح'
        }
    };

    const t = translations[locale === 'ar' ? 'ar' : 'en'];

    const listSelection: ItemList[] = [
        { key: 'system', label: t.system, value: 'system' },
        { key: 'dark', label: t.dark, value: 'dark' },
        { key: 'light', label: t.light, value: 'light' }
    ];

    const handleSwitchTheme = (theme: "light" | "dark" | "system") => {
        setTheme(theme)
    };

    return (
        <Stack
            spacing={4}
            className='px-5 pt-5'
            sx={{
                width: '100%',
            }}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            <SettingsSubsectionHeader title={t.title} />
            <Typography
                variant='body2'
                sx={{
                    color: '#25D366',
                    width: '100%',
                    textAlign: isRTL ? 'right' : 'left',
                }}
            >
                {t.subtitle}
            </Typography>
            <Stack
                spacing={1}
                sx={{
                    width: '100%',
                }}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {listSelection.map((item) => (
                    <ListItemButton
                        key={item.key}
                        onClick={() => handleSwitchTheme(item.value)}
                        sx={(theme) => ({
                            width: "100%",
                            borderRadius: 3,
                            padding: 0,
                            marginY: '2px',
                            backgroundColor: "transparent",
                            boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                            textTransform: "inherit",
                            color: theme.palette.text.primary,

                            "&:hover": {
                                boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                                backgroundColor: theme.palette.action.hover,
                                "& .chat-badge": {
                                    transform: "translate(-28px, -50%)",
                                    opacity: 1,
                                },
                                "& .chat-hover-action": {
                                    transform: "translate(-50%, -50%)",
                                    opacity: 1,
                                    pointerEvents: "auto",
                                },
                                "& .MuiListItemText-secondary": {
                                    maxWidth: "calc(100% - 30px)",
                                },
                            },
                            "& .MuiListItemText-secondary": {
                                maxWidth: "100%",
                            },
                        })}
                    >
                        <ListItem
                            sx={{
                                paddingY: 1,
                                paddingX: 2,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <Radio
                                checked={theme === item.value}
                                onChange={() => setTheme(item.value)}
                                disableRipple
                                inputProps={{ readOnly: true }}
                                sx={{
                                    padding: 0,
                                    '& .MuiSvgIcon-root': {
                                        fontSize: 20,
                                    },
                                    '&.Mui-checked': {
                                        color: '#25D366',
                                    },
                                    '& .MuiRadio-root': {
                                        color: '#25D366',
                                    },
                                }}
                            />
                            <ListItemText
                                primary={item.label}
                                sx={{
                                    transition: "max-width 100ms ease",
                                    maxWidth: "75%",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                    display: "block",
                                    color: appThemeVars.foreground,
                                }}
                            />
                        </ListItem>
                    </ListItemButton>
                ))}
            </Stack>
        </Stack>
    )
}
