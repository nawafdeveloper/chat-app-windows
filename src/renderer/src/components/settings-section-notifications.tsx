import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Typography,
    Switch,
} from '@mui/material';
import { useState } from 'react';
import SettingsHeader from './settings-header';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { authClient } from '../lib/auth-client';
import { GroupOutlined } from '@mui/icons-material';

const ChatIcon = () => (
    <svg className="text-gray-600 dark:text-gray-300" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M3.00208 9L0.942085 5.53C0.542171 4.86348 1.01478 4 1.79207 4H19.3355C20.8082 4 22.0021 5.19391 22.0021 6.66667V17.3333C22.0021 18.8061 20.8082 20 19.3355 20H5.66875C4.19599 20 3.00208 18.8061 3.00208 17.3333V9ZM5.00208 8.44603L3.53447 6H19.3355C19.7037 6 20.0021 6.29848 20.0021 6.66667V17.3333C20.0021 17.7015 19.7037 18 19.3355 18H5.66875C5.30056 18 5.00208 17.7015 5.00208 17.3333V8.44603Z" fill="currentColor" />
        <path d="M7 10C7 9.44772 7.44772 9 8 9H17C17.5523 9 18 9.44772 18 10C18 10.5523 17.5523 11 17 11H8C7.44772 11 7 10.5523 7 10Z" fill="currentColor" />
        <path d="M7 14C7 13.4477 7.44772 13 8 13H14C14.5523 13 15 13.4477 15 14C15 14.5523 14.5523 15 14 15H8C7.44772 15 7 14.5523 7 14Z" fill="currentColor" />
    </svg>
);

export default function SettingsSectionNotifications() {
    const { data: session } = authClient.useSession();

    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const [messages, setMessages] = useState(
        !session?.user?.disableMessagesNotifications
    );
    const [groups, setGroups] = useState(
        !session?.user?.disableGroupsNotifications
    );

    const [loading, setLoading] = useState(false);

    const updateSetting = async (
        type: 'messages' | 'groups',
        value: boolean
    ) => {
        if (loading) return;

        setLoading(true);

        const prev = type === 'messages' ? messages : groups;

        if (type === 'messages') setMessages(value);
        if (type === 'groups') setGroups(value);

        try {
            await authClient.updateUser({
                disableMessagesNotifications:
                    type === 'messages' ? !value : undefined,
                disableGroupsNotifications:
                    type === 'groups' ? !value : undefined,
            });
        } catch {
            if (type === 'messages') setMessages(prev);
            if (type === 'groups') setGroups(prev);
        } finally {
            setLoading(false);
        }
    };

    const itemsList = [
        {
            id: '1',
            primary: isRTL ? 'الرسائل' : 'Messages',
            secondary: isRTL ? 'إشعارات الرسائل' : 'Messages notifications',
            icon: ChatIcon,
            value: messages,
            type: 'messages' as const,
        },
        {
            id: '2',
            primary: isRTL ? 'المجموعات' : 'Groups',
            secondary: isRTL ? 'إشعارات المجموعات' : 'Groups notifications',
            icon: GroupOutlined,
            value: groups,
            type: 'groups' as const,
        },
    ];

    return (
        <Stack spacing={4} className="px-5 pt-5" sx={{ width: '100%' }}>
            <SettingsHeader title={isRTL ? 'الإشعارات' : 'Notifications'} />

            <Stack spacing={1} sx={{ width: '100%' }}>
                {itemsList.map((item) => (
                    <ListItemButton
                        key={item.id}
                        disableRipple
                        sx={{
                            width: '100%',
                            borderRadius: 0,
                            backgroundColor: 'transparent',
                            borderBottom: '1px solid #2C2C2C',
                        }}
                    >
                        <ListItem
                            sx={{
                                width: '100%',
                                padding: isRTL ? '8px 0 8px 16px' : '8px 16px 8px 0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <ListItemIcon>
                                <item.icon />
                            </ListItemIcon>

                            <ListItemText
                                primary={item.primary}
                                secondary={item.secondary}
                                sx={{
                                    textAlign: isRTL ? 'right' : 'left',
                                }}
                            />
                            <Switch
                                checked={item.value}
                                disabled={loading}
                                onChange={() =>
                                    updateSetting(item.type, !item.value)
                                }
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#25D366',
                                        '&:hover': {
                                            backgroundColor: 'rgba(37, 211, 102, 0.08)',
                                        },
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                                    {
                                        backgroundColor: '#25D366',
                                    },
                                }}
                            />
                        </ListItem>
                    </ListItemButton>
                ))}
            </Stack>

            <Typography
                variant="body2"
                sx={{
                    color: '#A5A5A5',
                    textAlign: isRTL ? 'right' : 'left',
                }}
            >
                {isRTL
                    ? 'للحصول على الإشعارات، تأكد من تفعيلها في إعدادات الجهاز والمتصفح.'
                    : 'To receive notifications, make sure they are enabled in your device and browser settings.'}
            </Typography>
        </Stack>
    );
}