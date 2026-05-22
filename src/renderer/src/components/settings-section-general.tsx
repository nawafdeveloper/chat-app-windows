import { ChevronRight } from '@mui/icons-material';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack } from '@mui/material';
import { useState, useEffect } from 'react';
import SettingsHeader from './settings-header';
import LocaleSwitcher from './locale-switcher';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { Locale } from '../lib/i18n';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

export default function SettingsSectionGeneral() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const [selectedFontSize, setSelectedFontSize] = useState<string>('100%');
    const [currentLocale, setCurrentLocale] = useState<Locale>('en');

    useEffect(() => {
        const locale = getLocaleFromCookie();
        if (locale) {
            setCurrentLocale(locale);
        }
    }, []);

    const handleFontSizeChange = (event: SelectChangeEvent) => {
        setSelectedFontSize(event.target.value);
        localStorage.setItem('fontSize', event.target.value);
    };

    const fontSizes = [
        { label: '80%', value: '80%' },
        { label: '90%', value: '90%' },
        { label: isRTL ? '100% (تلقائي)' : '100% (Default)', value: '100%' },
        { label: '110%', value: '110%' },
        { label: '125%', value: '125%' },
        { label: '135%', value: '135%' },
        { label: '150%', value: '150%' },
    ];

    return (
        <Stack
            spacing={4}
            alignItems={'center'}
            className='px-5 pt-5'
            sx={{
                width: '100%',
            }}
        >
            <SettingsHeader title={isRTL ? 'عام' : 'General'} />
            <LocaleSwitcher currentLocale={currentLocale} />
            <FormControl sx={{ width: '100%' }}>
                <InputLabel
                    id="font-size-select-label"
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
                    {isRTL ? 'حجم النصوص' : 'Font Size'}
                </InputLabel>
                <Select
                    labelId="font-size-select-label"
                    id="font-size-select"
                    value={selectedFontSize}
                    onChange={handleFontSizeChange}
                    label={isRTL ? 'حجم النصوص' : 'Font Size'}
                    IconComponent={ChevronRight}
                    sx={{
                        borderRadius: '12px',
                        backgroundColor: (theme) =>
                            theme.palette.mode === "dark" ? "#2A2A2A" : "#F5F5F5",
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
                                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                                borderRadius: '12px',
                                marginTop: '8px',
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
                    {fontSizes.map((size) => (
                        <MenuItem
                            key={size.value}
                            value={size.value}
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
                            {size.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Stack>
    );
}