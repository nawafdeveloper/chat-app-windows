import CreateChatSearchLargeSidebar from './create-chat-search-large-sidebar';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';

export default function CreateChatSectionLargeSideBar() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;


    return (
        <div className={`flex flex-col space-y-4 w-full bg-white dark:bg-[#161717] ${isRTL ? 'border-l' : 'border-r'} dark:border-neutral-700 border-neutral-300 overflow-y-auto pt-5`}>
            <CreateChatSearchLargeSidebar />
        </div>
    )
}