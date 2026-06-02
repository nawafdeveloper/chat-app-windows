import { AnimatePresence, motion } from "framer-motion";
import ChatsSectionLargeSideBar from "./chats-section-large-sidebar";
import CreateChatSectionLargeSideBar from "./create-chat-section-large-sidebar";
import { useSidebarStore } from "../store/use-active-sidebar-store";
import SettingsSectionSideBar from "./settings-section-large-sidebar";
import ArchiveSectionLargeSidebar from "./archive-section-large-sidebar";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { useSubsidebarStore } from "../store/use-active-subsidebar-store";
import CreateNewContactSection from "./create-new-contact-section";
import CreateGroupMemebersListLargeSidebar from "./create-group-memebers-list-large-sidebar";
import { useGroupSidebarStore } from "../store/use-group-sidebar-store";
import CreateGroupInformationLargeSidebar from "./create-group-information-large-sidebar";

type Props = {
    logout: () => void;
    country: string | null;
};

export default function LargeSideBar({ logout, country }: Props) {
    const { activeSideBar } = useSidebarStore();
    const { activeSubsideBar } = useSubsidebarStore();
    const { groupSidebarState } = useGroupSidebarStore();
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const customEasing: [number, number, number, number] = [0.32, 0, 0.67, 0];

    return (
        <div className={`md:flex hidden flex-col w-full xl:max-w-117.5 sm:max-w-xs max-w-xs h-full bg-white dark:bg-[#161717] relative overflow-hidden ${isRTL ? 'rounded-tr-lg border-r' : 'rounded-tl-lg border-l'} border-t dark:border-neutral-700 border-neutral-300`}>
            <div className="absolute inset-0 z-10 overflow-hidden">
                {activeSideBar === 'main-chat' && (
                    <ChatsSectionLargeSideBar logout={logout} />
                )}
                {activeSideBar === 'main-setting' && (
                    <SettingsSectionSideBar />
                )}
                {activeSideBar === 'main-archive' && (
                    <ArchiveSectionLargeSidebar />
                )}
            </div>
            <AnimatePresence mode="popLayout">
                {activeSideBar !== 'main-chat' && (
                    <motion.div
                        key={activeSideBar}
                        initial={{ x: isRTL ? '100%' : '-100%', opacity: 1 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: isRTL ? '100%' : '-100%', opacity: 1 }}
                        transition={{ duration: 0.15, ease: customEasing }}
                        className="absolute inset-0 z-10 flex h-full w-full overflow-hidden"
                        style={{
                            pointerEvents: activeSideBar === 'create-chat' ? 'auto' : 'none'
                        }}
                    >
                        {activeSideBar === 'create-chat' && (
                            <CreateChatSectionLargeSideBar />
                        )}
                    </motion.div>
                )}
                {activeSideBar === 'create-chat' && activeSubsideBar && (
                    <motion.div
                        key={activeSubsideBar}
                        initial={{ x: isRTL ? '100%' : '-100%', opacity: 1 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: isRTL ? '100%' : '-100%', opacity: 1 }}
                        transition={{ duration: 0.15, ease: customEasing }}
                        className="absolute inset-0 z-20 flex h-full w-full overflow-hidden"
                        style={{
                            pointerEvents: (activeSubsideBar === 'new-contact' || activeSubsideBar === 'new-group') ? 'auto' : 'none'
                        }}
                    >
                        {activeSubsideBar === 'new-contact' && (
                            <CreateNewContactSection country={country} />
                        )}
                        {activeSubsideBar === 'new-group' && (
                            <CreateGroupMemebersListLargeSidebar />
                        )}
                    </motion.div>
                )}
                {groupSidebarState && (
                    <motion.div
                        key={'group-creation'}
                        initial={{ x: isRTL ? '100%' : '-100%', opacity: 1 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: isRTL ? '100%' : '-100%', opacity: 1 }}
                        transition={{ duration: 0.15, ease: customEasing }}
                        className="absolute inset-0 z-30 flex h-full w-full overflow-hidden"
                        style={{
                            pointerEvents: groupSidebarState ? 'auto' : 'none'
                        }}
                    >
                        <CreateGroupInformationLargeSidebar />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
