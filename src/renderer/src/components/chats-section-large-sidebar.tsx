import ChatsHeaderLargeSideBar from './chats-header-large-sidebar';
import ChatsSideBarContent from './chats-sidebar-content';
import ChatsSearchHeaderLargeSidebar from './chats-search-header-large-sidebar';
import { useState } from 'react';
import NotificationServicesPermissionAlert from './notification-services-permission-alert';
import Fab from '@mui/material/Fab';
import { Add } from '@mui/icons-material';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';

type Props = {
    logout: () => void;
}

export default function ChatsSectionLargeSideBar({ logout }: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const [activeChatTab, setActiveChatTab] = useState<'all' | 'unread' | 'favourites' | 'groups'>('all');

    return (
        <div className={`flex flex-col space-y-4 h-full max-h-full min-h-full w-full ${isRTL ? 'border-l' : 'border-r'} dark:border-neutral-700 border-neutral-300`}>
            <div className='px-5 pt-5 flex flex-col space-y-4'>
                <ChatsHeaderLargeSideBar logout={logout}/>
                <ChatsSearchHeaderLargeSidebar
                    activeChatTab={activeChatTab}
                    setActiveChatTab={setActiveChatTab}
                />
                <NotificationServicesPermissionAlert />
            </div>
            <ChatsSideBarContent
                activeChatTab={activeChatTab}
            />
            <div className='absolute bottom-6 left-6 right-6 z-50 flex md:hidden justify-end'>
                <Fab color="success" sx={{ backgroundColor: "#25D366" }} aria-label="add">
                    <Add />
                </Fab>
            </div>
        </div>
    )
}
