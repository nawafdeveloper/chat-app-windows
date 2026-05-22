import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { AddCommentOutlined } from '@mui/icons-material';
import Image from './electron-image';

export default function EmptyStartChating() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    return (
        <div className='flex flex-col items-center justify-center h-full w-full gap-y-8 bg-white dark:bg-[#161717]'>
            <Image
                src={'start-chating.svg'}
                alt="YaaHalaa Corp.©"
                width={500}
                height={500}
                className="w-auto h-32 object-contain"
            />
            <label className='flex flex-col gap-y-4 text-center w-full md:max-w-xl md:mx-auto'>
                <h1 className='text-2xl font-semibold'>
                    {isRTL ? 'لم تبدأ أي محادثات بعد' : 'You Haven\'t Started Any Chats Yet'}
                </h1>
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
