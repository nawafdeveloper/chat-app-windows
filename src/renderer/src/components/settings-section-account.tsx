import { ListItem, ListItemButton, ListItemIcon, ListItemText, Stack } from '@mui/material';
import SettingsHeader from './settings-header';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { DescriptionOutlined, InfoOutlined } from '@mui/icons-material';
import { useSettingsStore } from '../store/use-active-setting-store';

export default function SettingsSectionAccount() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { navigateToSettings } = useSettingsStore();

    const subItemList = [
        {
            id: '1',
            title: isRTL ? 'طلب بيانات الحساب' : 'Request account information',
            icon: DescriptionOutlined,
            href: 'settings-account-information',
        },
        {
            id: '2',
            title: isRTL ? 'كيف أقوم بحذف حسابي' : 'How to delete my account',
            icon: InfoOutlined,
            href: 'settings-account-delete',
        },
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
            <SettingsHeader title={isRTL ? 'الحساب' : 'Account'} />
            <Stack
                sx={{
                    width: '100%',
                }}
            >
                {subItemList.map((item) => (
                    <ListItemButton
                        key={item.id}
                        onClick={() => navigateToSettings(item.href)}
                        sx={(theme) => ({
                            width: "100%",
                            borderRadius: 3,
                            padding: 0,
                            marginY: '2px',
                            backgroundColor: "transparent",
                            boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                            textTransform: "inherit",
                            color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",

                            "&:hover": {
                                boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                                backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
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
                            }}
                        >
                            <ListItemIcon>
                                <item.icon className='size-6! text-gray-600 dark:text-gray-300' />
                            </ListItemIcon>
                            <ListItemText
                                primary={item.title}
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
    )
}