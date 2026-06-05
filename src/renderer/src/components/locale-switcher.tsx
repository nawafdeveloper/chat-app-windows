import {
    MenuItem,
    Select,
    SelectChangeEvent,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { useState, useTransition, useEffect } from 'react';
import { getLocaleDisplayName, getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { setLocale } from '../lib/locale';
import { Locale } from '../lib/i18n';

interface LocaleSwitcherProps {
    currentLocale: Locale;
}

export default function LocaleSwitcher({ currentLocale }: LocaleSwitcherProps) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const [selectedLocale, setSelectedLocale] = useState<Locale>(currentLocale);
    const [isPending, startTransition] = useTransition();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

    useEffect(() => {
        setSelectedLocale(currentLocale);
    }, [currentLocale]);

    const handleLocaleChange = async (event: SelectChangeEvent) => {
        const newLocale = event.target.value as Locale;
        if (newLocale === currentLocale) {
            setSelectedLocale(currentLocale);
            return;
        }

        setSelectedLocale(newLocale);
        setPendingLocale(newLocale);
        setIsConfirmOpen(true);
    };

    const handleConfirmChange = () => {
        if (!pendingLocale) return;
        setIsConfirmOpen(false);

        startTransition(async () => {
            try {
                await setLocale(pendingLocale);
                window.location.reload();
            } catch (error) {
                console.error('Failed to change locale:', error);
                setSelectedLocale(currentLocale);
            } finally {
                setPendingLocale(null);
            }
        });
    };

    const handleCancelChange = () => {
        setIsConfirmOpen(false);
        setPendingLocale(null);
        setSelectedLocale(currentLocale);
    };

    const locales = [
        { value: 'en' as Locale, label: getLocaleDisplayName('en') },
        { value: 'ar' as Locale, label: getLocaleDisplayName('ar') },
    ];

    return (
        <>
            <FormControl sx={{ width: '100%' }}>
                <InputLabel
                    id="locale-select-label"
                    sx={{
                        color: (theme) =>
                            theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                        '&.Mui-focused': {
                            color: '#25D366',
                        },
                        left: isRTL ? 'unset' : 0,
                        right: isRTL ? 0 : 'unset',
                        transformOrigin: isRTL ? 'top right' : 'top left',
                        '&.MuiInputLabel-outlined': {
                            transform: isRTL
                                ? 'translate(-14px, 16px) scale(1)'
                                : 'translate(14px, 16px) scale(1)',
                        },
                        '&.MuiInputLabel-outlined.MuiInputLabel-shrink': {
                            transform: isRTL
                                ? 'translate(-14px, -9px) scale(0.75)'
                                : 'translate(14px, -9px) scale(0.75)',
                        },
                    }}
                >
                    {isRTL ? 'اللغة' : 'Language'}
                </InputLabel>
                <Select
                    labelId="locale-select-label"
                    id="locale-select"
                    value={selectedLocale}
                    onChange={handleLocaleChange}
                    label={isRTL ? 'اللغة' : 'Language'}
                    IconComponent={ChevronRight}
                    disabled={isPending}
                    sx={{
                        borderRadius: '12px',
                        backgroundColor: (theme) =>
                            theme.palette.mode === "dark" ? "#2A2A2A" : "#F5F5F5",
                        opacity: isPending ? 0.7 : 1,
                        '& .MuiSelect-select': {
                            padding: '14px 16px',
                            paddingRight: isRTL ? '14px' : '32px',
                            paddingLeft: isRTL ? '32px' : '14px',
                            color: (theme) =>
                                theme.palette.mode === "dark" ? "#FFFFFF" : "#000000",
                        },
                        '& .MuiOutlinedInput-notchedOutline legend': {
                            textAlign: isRTL ? 'right' : 'left',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: (theme) =>
                                theme.palette.mode === "dark" ? "#3A3A3A" : "#E0E0E0",
                            borderWidth: '1px',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#25D366',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#25D366',
                            borderWidth: '2px',
                        },
                        '& .MuiSelect-icon': {
                            transform: isRTL ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            right: isRTL ? 'unset' : '7px',
                            left: isRTL ? '7px' : 'unset',
                            color: (theme) =>
                                theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                        },
                        '&.Mui-focused .MuiSelect-icon': {
                            transform: 'rotate(90deg)',
                        },
                    }}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                maxHeight: 48 * 4.5 + 8,
                                borderRadius: '12px',
                                marginTop: '8px',
                                marginRight: '8px',
                                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                                border: '1px solid',
                                borderColor: (theme) =>
                                    theme.palette.mode === "dark" ? "#3A3A3A" : "#E5E5E5",
                            },
                        },
                        anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                        },
                        transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                        },
                    }}
                >
                    {locales.map((locale) => (
                        <MenuItem
                            key={locale.value}
                            value={locale.value}
                            sx={{
                                borderRadius: '8px',
                                margin: '4px 8px',
                                padding: '8px 12px',
                                '&:hover': {
                                    backgroundColor: (theme) =>
                                        theme.palette.mode === "dark" ? "#2A2A2A" : "#F0F0F0",
                                },
                                '&.Mui-selected': {
                                    backgroundColor: (theme) =>
                                        theme.palette.mode === "dark" ? "#103529" : "#D9FDD3",
                                    color: (theme) =>
                                        theme.palette.mode === "dark" ? "#25D366" : "#1F4E2E",
                                    '&:hover': {
                                        backgroundColor: (theme) =>
                                            theme.palette.mode === "dark" ? "#1A4A3A" : "#C4E8C0",
                                    },
                                },
                            }}
                        >
                            {locale.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Dialog
                open={isConfirmOpen}
                onClose={handleCancelChange}
                aria-labelledby="locale-confirm-title"
                aria-describedby="locale-confirm-description"
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        minWidth: '450px',
                        padding: '4px',
                        backgroundColor: (theme) => theme.palette.mode === "dark" ? "#1d1f1f" : "#ffffff",
                        boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.08)',
                    },
                }}
            >
                <DialogTitle
                    id="locale-confirm-title"
                    sx={{
                        fontWeight: 700,
                        fontSize: '18px',
                        color: (theme) =>
                            theme.palette.mode === "dark" ? "#FFFFFF" : "#1C1C1C",
                        textAlign: isRTL ? 'right' : 'left',
                    }}
                >
                    {isRTL ? 'تغيير اللغة؟' : 'Change Language?'}
                </DialogTitle>
                <DialogContent sx={{ paddingTop: '4px' }}>
                    <Typography
                        id="locale-confirm-description"
                        sx={{
                            color: (theme) =>
                                theme.palette.mode === "dark" ? "#CFCFCF" : "#5A5A5A",
                            fontSize: '14px',
                            textAlign: isRTL ? 'right' : 'left',
                        }}
                    >
                        {isRTL
                            ? `هل تريد التبديل إلى ${pendingLocale ? getLocaleDisplayName(pendingLocale) : 'هذه اللغة'}؟`
                            : `Switch to ${pendingLocale ? getLocaleDisplayName(pendingLocale) : 'this language'}?`
                        }
                    </Typography>
                </DialogContent>
                <DialogActions sx={{
                    padding: '12px 16px 16px 16px',
                    gap: '8px',
                    ...(isRTL && { flexDirection: 'row-reverse' }),
                }}>
                    <Button
                        onClick={handleCancelChange}
                        variant="outlined"
                        sx={{
                            borderRadius: '99px',
                            borderColor: (theme) =>
                                theme.palette.mode === "dark" ? "#3A3A3A" : "#DCDCDC",
                            color: (theme) =>
                                theme.palette.mode === "dark" ? "#D8D8D8" : "#5A5A5A",
                            textTransform: 'none',
                            padding: '8px 16px'
                        }}
                    >
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                        onClick={handleConfirmChange}
                        variant="contained"
                        disabled={isPending}
                        sx={{
                            borderRadius: '99px',
                            backgroundColor: '#25D366',
                            color: '#0B1B12',
                            textTransform: 'none',
                            padding: '8px 16px',
                            boxShadow: '0px 0px 0px rgba(0, 0, 0, 0.0)',
                            '&:hover': {
                                backgroundColor: '#1FB75A',
                            },
                            '&.Mui-disabled': {
                                backgroundColor: (theme) =>
                                    theme.palette.mode === "dark" ? "#2D4035" : "#CFEFDB",
                                color: (theme) =>
                                    theme.palette.mode === "dark" ? "#A1B6A8" : "#6B8F7A",
                            },
                        }}
                    >
                        {isRTL ? 'تغيير' : 'Change'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
