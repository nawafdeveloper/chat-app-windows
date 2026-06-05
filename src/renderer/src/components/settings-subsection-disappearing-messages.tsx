import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { ListItem, ListItemButton, ListItemText, Radio, Stack, Typography } from '@mui/material';
import React, { useState, useEffect } from 'react';
import SettingsSubsectionHeader from './settings-subsection-header';
import { authClient } from '../lib/auth-client';

export default function SettingsSubsectionDisappearingMessages() {
    const { data: session } = authClient.useSession();
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const translations = {
        en: {
            title: 'Disappearing messages',
            subtitle: 'How much time to disappear messages',
            day: '24 Hours',
            sevenDays: '7 Days',
            ninetyDays: '90 Days',
        },
        ar: {
            title: 'الرسائل المؤقتة',
            subtitle: 'مدة بقاء الرسائل قبل الاختفاء',
            day: '24 ساعة',
            sevenDays: '7 أيام',
            ninetyDays: '90 يوماً'
        }
    };

    const t = translations[locale === 'ar' ? 'ar' : 'en'];

    const listSelection = [
        { key: '24h', label: t.day, value: '24h' },
        { key: '7d', label: t.sevenDays, value: '7d' },
        { key: '90d', label: t.ninetyDays, value: '90d' }
    ];

    const [selectedValue, setSelectedValue] = useState(session?.user?.defaultMessageTimer || '24h');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync with session when it loads
    useEffect(() => {
        if (session?.user?.defaultMessageTimer) {
            setSelectedValue(session.user.defaultMessageTimer);
        }
    }, [session]);

    const handleSelectionChange = async (newValue: string) => {
        if (loading) return;
        if (newValue === selectedValue) return;

        const previousValue = selectedValue;
        setSelectedValue(newValue);
        setLoading(true);
        setError(null);

        try {
            await authClient.updateUser({
                defaultMessageTimer: newValue
            });
        } catch (err) {
            setSelectedValue(previousValue);
            setError(err instanceof Error ? err.message : 'Failed to update disappearing time setting');
            console.error('Update failed:', err);
        } finally {
            setLoading(false);
        }
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
            {error && (
                <Typography color="error" variant="caption" sx={{ textAlign: 'center' }}>
                    {error}
                </Typography>
            )}
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
                        onClick={() => handleSelectionChange(item.value)}
                        disabled={loading}
                        sx={(theme) => ({
                            width: "100%",
                            borderRadius: 3,
                            padding: 0,
                            marginY: '2px',
                            backgroundColor: "transparent",
                            boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                            textTransform: "inherit",
                            color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                            opacity: loading ? 0.6 : 1,
                            pointerEvents: loading ? 'none' : 'auto',

                            "&:hover": {
                                boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                                backgroundColor: theme.palette.mode === "dark" ? "#353939" : "#eee",
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
                                checked={selectedValue === item.value}
                                disableRipple
                                disabled={loading}
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
                                }}
                            />
                        </ListItem>
                    </ListItemButton>
                ))}
            </Stack>
        </Stack>
    );
}