import { getLocaleFromCookie, isRTLClient } from '@/lib/locale-client';
import { useSidebarStore } from '@/store/use-active-sidebar-store';
import { AddCommentOutlined, GroupAddOutlined, PersonAddAltOutlined } from '@mui/icons-material';
import Image from './electron-image';

export default function EmptyStartChating() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { setActiveSideBar } = useSidebarStore();

    return (
        <div className='flex flex-col items-center justify-center h-full w-full gap-y-8 dark:bg-[#1d1f1f] bg-[#f7f5f3]'>
            <Image
                src='empty-image.svg'
                alt="YaHla Corp.©"
                width={200}
                height={200}
                className="w-auto h-36 object-contain"
            />
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
                    <svg className="inline align-middle" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.53279 12.9911H11.5086V14.9671C11.5086 15.3999 11.7634 15.8175 12.1762 15.9488C12.8608 16.1661 13.4909 15.6613 13.4909 15.009V12.9911H15.4672C15.9005 12.9911 16.3181 12.7358 16.449 12.3226C16.6659 11.6381 16.1606 11.0089 15.5086 11.0089H13.4909V9.03332C13.4909 8.60007 13.2361 8.18252 12.8233 8.05119C12.1391 7.83391 11.5086 8.33872 11.5086 8.991V11.0089H9.4909C8.83943 11.0089 8.33413 11.6381 8.55099 12.3226C8.68146 12.7358 9.09949 12.9911 9.53279 12.9911Z" fill="currentColor" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M0.944177 5.52617L2.99986 8.84848V17.3333C2.99986 18.8061 4.19377 20 5.66653 20H19.3332C20.806 20 21.9999 18.8061 21.9999 17.3333V6.66667C21.9999 5.19391 20.806 4 19.3332 4H1.79456C1.01114 4 0.531967 4.85997 0.944177 5.52617ZM4.99986 8.27977V17.3333C4.99986 17.7015 5.29833 18 5.66653 18H19.3332C19.7014 18 19.9999 17.7015 19.9999 17.3333V6.66667C19.9999 6.29848 19.7015 6 19.3332 6H3.58925L4.99986 8.27977Z" fill="currentColor" />
                    </svg>
                    {' '}
                    {isRTL ? 'وتواصل مع أصدقائك أو جهات اتصالك.' : 'button and connect with your friends or contacts.'}
                </p>
            </label>
        </div>
    )
}