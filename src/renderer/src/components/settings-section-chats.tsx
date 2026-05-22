import { ListItem, ListItemButton, ListItemText, Stack, Typography } from '@mui/material';
import SettingsHeader from './settings-header';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { useSettingsStore } from '../store/use-active-setting-store';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

export default function SettingsSectionChats() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { navigateToSettings, navigateToSettingsSubsection } = useSettingsStore();

    const firstList = [
        {
            id: '1',
            primary: isRTL ? 'المظهر' : 'Theme',
            secondary: isRTL ? 'قم بتغيير لون المظهر للنظام' : 'Change your system theme color',
            href: 'chat-theme'
        },
        {
            id: '2',
            primary: isRTL ? 'الخلفيات' : 'Wallpaper',
            secondary: isRTL ? 'قم بتغيير خلفية غرفة المحادثة' : 'Change wallpaper of chat room',
            href: 'chat-wallpaper'
        },
    ];

    const secondList = [
        {
            id: '1',
            primary: isRTL ? 'جودة تحميل الوسائط' : 'Media upload quality',
            secondary: isRTL ? 'تعديل جودة تحميل الوسائط' : 'Adjust the quality of media upload',
            href: 'media-quality-upload'
        }
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
            <SettingsHeader title={isRTL ? 'المحادثات' : 'Chats'} />
            <Typography
                variant='body2'
                sx={{
                    color: (theme) =>
                        theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                    width: '100%',
                    textAlign: isRTL ? 'right' : 'left',
                }}
            >
                {isRTL ? 'العرض' : 'Display'}
            </Typography>
            <Stack
                spacing={1}
                sx={{
                    width: '100%',
                }}
            >
                {firstList.map((item) => (
                    <ListItemButton
                        key={item.id}
                        onClick={() => navigateToSettingsSubsection(item.href)}
                        sx={(theme) => ({
                            width: "100%",
                            borderRadius: 0,
                            padding: 0,
                            backgroundColor: "transparent",
                            boxShadow: "0px 0px 0px rgba(0,0,0,0)",
                            textTransform: "inherit",
                            color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                            borderBottom: `1px solid ${theme.palette.mode === "dark" ? "#2C2C2C" : "#E9E9E9"}`,
                            "&:hover": {
                                boxShadow: "0px 0px 0px rgba(0,0,0,0)",
                                backgroundColor: "transparent",
                            },
                            "& .MuiListItemText-secondary": {
                                maxWidth: "100%",
                            },
                        })}
                    >
                        <ListItem
                            sx={{
                                padding: isRTL ? '8px 0 8px 16px' : '8px 16px 8px 0',
                                justifyContent: 'space-between',
                            }}
                        >
                            <ListItemText
                                primary={item.primary}
                                sx={{
                                    display: "block",
                                    textAlign: isRTL ? 'right' : 'left',
                                }}
                                secondary={item.secondary}
                                secondaryTypographyProps={{
                                    sx: {
                                        display: "block",
                                        maxWidth: "100%",
                                        textAlign: isRTL ? 'right' : 'left',
                                    },
                                }}
                            />
                            {isRTL ? (
                                <ChevronLeftIcon
                                    sx={{
                                        color: (theme) =>
                                            theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                        fontSize: 24,
                                    }}
                                />
                            ) : (
                                <ChevronRightIcon
                                    sx={{
                                        color: (theme) =>
                                            theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                        fontSize: 24,
                                    }}
                                />
                            )}
                        </ListItem>
                    </ListItemButton>
                ))}
            </Stack>
            <Typography
                variant='body2'
                sx={{
                    color: (theme) =>
                        theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                    width: '100%',
                    textAlign: isRTL ? 'right' : 'left',
                }}
            >
                {isRTL ? 'إعدادات المحادثات' : 'Chat settings'}
            </Typography>
            <Stack
                spacing={1}
                sx={{
                    width: '100%',
                }}
            >
                {secondList.map((item) => (
                    <ListItemButton
                        key={item.id}
                        onClick={() => navigateToSettingsSubsection(item.href)}
                        sx={(theme) => ({
                            width: "100%",
                            borderRadius: 0,
                            padding: 0,
                            backgroundColor: "transparent",
                            boxShadow: "0px 0px 0px rgba(0,0,0,0)",
                            textTransform: "inherit",
                            color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                            borderBottom: `1px solid ${theme.palette.mode === "dark" ? "#2C2C2C" : "#E9E9E9"}`,
                            "&:hover": {
                                boxShadow: "0px 0px 0px rgba(0,0,0,0)",
                                backgroundColor: "transparent",
                            },
                            "& .MuiListItemText-secondary": {
                                maxWidth: "100%",
                            },
                        })}
                    >
                        <ListItem
                            sx={{
                                padding: isRTL ? '8px 0 8px 16px' : '8px 16px 8px 0',
                                justifyContent: 'space-between',
                            }}
                        >
                            <ListItemText
                                primary={item.primary}
                                sx={{
                                    display: "block",
                                    textAlign: isRTL ? 'right' : 'left',
                                }}
                                secondary={item.secondary}
                                secondaryTypographyProps={{
                                    sx: {
                                        display: "block",
                                        maxWidth: "100%",
                                        textAlign: isRTL ? 'right' : 'left',
                                    },
                                }}
                            />
                            {isRTL ? (
                                <ChevronLeftIcon
                                    sx={{
                                        color: (theme) =>
                                            theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                        fontSize: 24,
                                    }}
                                />
                            ) : (
                                <ChevronRightIcon
                                    sx={{
                                        color: (theme) =>
                                            theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                        fontSize: 24,
                                    }}
                                />
                            )}
                        </ListItem>
                    </ListItemButton>
                ))}
            </Stack>
        </Stack>
    )
}
