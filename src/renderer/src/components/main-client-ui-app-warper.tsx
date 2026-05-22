import { useEffect, useState } from 'react';
import GlobalLoading from './global-loading';
import { AnimatePresence, motion } from "framer-motion";
import SmallSideBar from './small-sidebar';
import LargeSideBar from './large-sidebar';
import useMediaPreviewStore from '../store/media-preview-store';
import MediaPreviewWarper from './media-preview-warper';
import DetailedLargeSidebar from './detailed-large-sidebar';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { useDetailedSidebarStore } from '../store/use-detailed-sidebar-store';
import { useLogout } from '../hooks/use-logout';
import { Snackbar } from '@mui/material';
import { Info } from '@mui/icons-material';
import { useChatRealtime } from '../hooks/use-chat-realtime';
import { useSyncProfileImageRecipients } from '../hooks/use-sync-profile-image-recipients';
import { useMediaDisplayAllStore } from '../store/use-media-display-all-store';
import MediaDisplayAllChatRoom from './media-display-all-chat-room';
import Notification from './notification';
import { useRightSideContactCreateStore } from '../store/use-right-side-contact-create-store';
import RightSideContactCreate from './right-side-contact-create';

export default function MainClientUIAppWrapper({ children, country }: { children: React.ReactNode, country: string | null; }) {
    const { isOpen } = useMediaPreviewStore();
    const { isOpen: isDetailedSidebarOpen } = useDetailedSidebarStore();
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const {
        loading: logoutLoading,
        isError,
        setIsError,
        errorMsg,
        logout
    } = useLogout(isRTL);
    useChatRealtime();
    const { isRightSideContactCreateActive } = useRightSideContactCreateStore();
    useSyncProfileImageRecipients();
    const { isOpen: isMediaAllOpen } = useMediaDisplayAllStore();

    const customEasing: [number, number, number, number] = [0.32, 0, 0.67, 0];

    const [isLoaded, setIsLoaded] = useState(false);
    const [activeNav, setActiveNav] = useState<'chats' | 'settings' | 'profile' | 'archive'>('chats');

    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            setIsLoaded(true);
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    if (!isLoaded || logoutLoading) return <GlobalLoading />;

    return (
        <>
            <Notification />
            {isOpen && <MediaPreviewWarper />}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    duration: 0.35,
                    ease: "easeOut",
                }}
                style={{ height: "100%" }}
            >
                <div className="relative flex h-full flex-col overflow-hidden">
                    <main className="relative flex min-h-0 flex-1 flex-row items-start overflow-y-hidden overflow-x-hidden dark:bg-[#1d1f1f] bg-[#f7f5f3]">
                        <SmallSideBar
                            activeNav={activeNav}
                            setActiveNav={setActiveNav}
                        />
                        <LargeSideBar country={country} logout={logout} />
                        <div className="flex h-full min-h-0 flex-1 w-full border-t dark:border-neutral-700 border-neutral-300">
                            {children}
                        </div>
                        <motion.div
                            initial={false}
                            animate={{
                                width: isDetailedSidebarOpen ? '100%' : 0,
                                opacity: 1,
                                x: isDetailedSidebarOpen ? 0 : (isRTL ? '-100%' : '100%'),
                            }}
                            transition={{ duration: 0.2, ease: customEasing }}
                            className="relative z-10 flex h-full shrink-0 overflow-hidden w-full max-w-[18rem] sm:max-w-[20rem] xl:max-w-115"
                            style={{
                                pointerEvents: isDetailedSidebarOpen ? 'auto' : 'none',
                            }}
                        >
                            <DetailedLargeSidebar />
                            <AnimatePresence mode="wait">
                                {isMediaAllOpen && (
                                    <motion.div
                                        initial={{ x: isRTL ? '-100%' : '100%', opacity: 1 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: isRTL ? '-100%' : '100%', opacity: 1 }}
                                        transition={{ duration: 0.15, ease: customEasing }}
                                        className="absolute inset-0 bg-white dark:bg-[#161717] z-20"
                                    >
                                        <MediaDisplayAllChatRoom />
                                    </motion.div>
                                )}
                                {isRightSideContactCreateActive && (
                                    <motion.div
                                        initial={{ x: isRTL ? '-100%' : '100%', opacity: 1 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: isRTL ? '-100%' : '100%', opacity: 1 }}
                                        transition={{ duration: 0.15, ease: customEasing }}
                                        className="absolute inset-0 bg-white dark:bg-[#161717] z-30"
                                    >
                                        <RightSideContactCreate />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </main>
                </div>
            </motion.div>
            <Snackbar
                open={isError}
                autoHideDuration={6000}
                onClose={() => setIsError(false)}
                message={errorMsg}
                anchorOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'bottom' }}
                ContentProps={{
                    sx: (theme) => ({
                        borderRadius: '99px',
                        bgcolor: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                        color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                        fontWeight: 500,
                        paddingRight: '24px',
                        boxShadow: 'none'
                    }),
                }}
                action={
                    <Info />
                }
            />
        </>
    );
}
