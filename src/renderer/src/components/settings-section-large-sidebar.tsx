import SettingsSectionMain from './settings-section-main';
import { useSettingsStore } from '../store/use-active-setting-store';
import { AnimatePresence, motion } from 'framer-motion';
import SettingsSectionGeneral from './settings-section-general';
import SettingsSectionProfile from './settings-section-profile';
import SettingsSectionAccount from './settings-section-account';
import SettingsSectionPrivacy from './settings-section-privacy';
import SettingsSectionChats from './settings-section-chats';
import SettingsSectionNotifications from './settings-section-notifications';
import SettingsSectionHelp from './settings-section-help';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import SettingsSubsectionLastSeen from './settings-subsection-last-seen';
import SettingsSubsectionProfileSeen from './settings-subsection-profile-seen';
import SettingsSubsectionAboutSeen from './settings-subsection-about-seen';
import SettingsSubsectionStatusSeen from './settings-subsection-status-seen';
import SettingsSubsectionDisappearingMessages from './settings-subsection-disappearing-messages';
import SettingsSubsectionBlockedContacts from './settings-subsection-blocked-contacts';
import SettingsSubsectionLockApp from './settings-subsection-lock-app';
import SettingsSubsectionTheme from './settings-subsection-theme';
import SettingsSubsectionWallpeper from './settings-subsection-wallpeper';
import SettingsSubsectionMediaQuality from './settings-subsection-media-quality';
import SettingsSubsectionMediaAutoDownload from './settings-subsection-media-auto-download';

export default function SettingsSectionSideBar() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { activeSettingsSection, activeSettingsSubsection } = useSettingsStore();
    const customEasing: [number, number, number, number] = [0.32, 0, 0.67, 0];

    const isSubSettings = activeSettingsSection !== 'settings-main';

    const getSubSettingsComponent = () => {
        switch (activeSettingsSection) {
            case 'settings-general':
                return <SettingsSectionGeneral />;
            case 'settings-profile':
                return <SettingsSectionProfile />;
            case 'settings-account':
                return <SettingsSectionAccount />;
            case 'settings-privacy':
                return <SettingsSectionPrivacy />;
            case 'settings-chats':
                return <SettingsSectionChats />;
            case 'settings-notifications':
                return <SettingsSectionNotifications />;
            case 'settings-help':
                return <SettingsSectionHelp />;
            default:
                return null;
        }
    };

    const getSettingsSubsectionComponent = () => {
        switch (activeSettingsSubsection) {
            case 'last-seen':
                return <SettingsSubsectionLastSeen />
            case 'profile-seen':
                return <SettingsSubsectionProfileSeen />
            case 'about-seen':
                return <SettingsSubsectionAboutSeen />
            case 'status-seen':
                return <SettingsSubsectionStatusSeen />
            case 'messages-disappear':
                return <SettingsSubsectionDisappearingMessages />
            case 'blocked-contacts':
                return <SettingsSubsectionBlockedContacts />
            case 'close-app':
                return <SettingsSubsectionLockApp />
            case 'chat-theme':
                return <SettingsSubsectionTheme />
            case 'chat-wallpaper':
                return <SettingsSubsectionWallpeper />
            case 'media-quality-upload':
                return <SettingsSubsectionMediaQuality />
            case 'media-auto-download':
                return <SettingsSubsectionMediaAutoDownload />
        }
    };

    return (
        <div className={`relative flex flex-col h-full max-h-full min-h-full w-full ${isRTL ? 'border-l' : 'border-r'} dark:border-neutral-700 border-neutral-300 ${activeSettingsSubsection === null ? 'overflow-y-auto' : ''}`}>
            <div className="absolute inset-0">
                <SettingsSectionMain />
            </div>
            <AnimatePresence mode="wait">
                {isSubSettings && (
                    <motion.div
                        key={activeSettingsSection}
                        initial={{ x: isRTL ? '100%' : '-100%', opacity: 1 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: isRTL ? '100%' : '-100%', opacity: 1 }}
                        transition={{ duration: 0.15, ease: customEasing }}
                        className="absolute inset-0 bg-white dark:bg-[#161717] z-20"
                    >
                        {getSubSettingsComponent()}
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
                {activeSettingsSubsection !== null && (
                    <motion.div
                        key={activeSettingsSubsection}
                        initial={{ x: isRTL ? '100%' : '-100%', opacity: 1 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: isRTL ? '100%' : '-100%', opacity: 1 }}
                        transition={{ duration: 0.15, ease: customEasing }}
                        className="absolute inset-0 bg-white dark:bg-[#161717] z-30"
                    >
                        {getSettingsSubsectionComponent()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
