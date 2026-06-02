import { getLocaleFromCookie, isRTLClient } from '@/lib/locale-client';
import { useSidebarStore } from '@/store/use-active-sidebar-store';
import { AddCommentOutlined, GroupAddOutlined, PersonAddAltOutlined } from '@mui/icons-material';

export default function EmptyStartChating() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { setActiveSideBar } = useSidebarStore();

    return (
        <div className='flex flex-col items-center justify-center h-full w-full gap-y-8 dark:bg-[#1d1f1f] bg-[#f7f5f3]'>
            <div className='flex flex-row items-center gap-x-6'>
                <button onClick={() => setActiveSideBar('create-chat')} className='flex flex-col items-center justify-center space-y-2 text-sm font-semibold cursor-pointer group'>
                    <div className='flex justify-center items-center px-4 py-2 rounded-full bg-[#efecea] dark:bg-[#2c2e2e] group-hover:bg-[#e0dbd8] dark:group-hover:bg-[#3a3d3d] transition-colors duration-200'>
                        <PersonAddAltOutlined fontSize="medium" className='dark:text-white' />
                    </div>
                    <p className='dark:text-white'>Contact</p>
                </button>
                <button onClick={() => setActiveSideBar('create-chat')} className='flex flex-col items-center justify-center space-y-2 text-sm font-semibold cursor-pointer group'>
                    <div className='flex justify-center items-center px-4 py-2 rounded-full bg-[#efecea] dark:bg-[#2c2e2e] group-hover:bg-[#e0dbd8] dark:group-hover:bg-[#3a3d3d] transition-colors duration-200'>
                        <GroupAddOutlined fontSize="medium" className='dark:text-white' />
                    </div>
                    <p className='dark:text-white'>Group</p>
                </button>
            </div>
            <label className='flex flex-col gap-y-4 text-center w-full md:max-w-xl md:mx-auto'>
                <p className='text-[#636261] dark:text-[#A5A5A5]'>
                    {isRTL ? 'ابدأ محادثة جديدة بالضغط على زر' : 'Start a new conversation by tapping the'}
                    {' '}
                    <AddCommentOutlined fontSize="inherit" />
                    {' '}
                    {isRTL ? 'وتواصل مع أصدقائك أو جهات اتصالك.' : 'button and connect with your friends or contacts.'}
                </p>
            </label>
        </div>
    )
}