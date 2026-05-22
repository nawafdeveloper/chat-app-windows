import ArchiveSectionLargeSidebar from "./archive-section-large-sidebar";
import ChatRoomSection from "./chat-room-section";
import ChatsSectionLargeSideBar from "./chats-section-large-sidebar";
import EmptyStartChating from "./empty-start-chating";
import SettingsSectionSideBar from "./settings-section-large-sidebar";
import WallpaperPreview from "./wallpeper-preview";
import { useLogout } from "../hooks/use-logout";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { useSettingsStore } from "../store/use-active-setting-store";
import { useSidebarStore } from "../store/use-active-sidebar-store";

export default function AppPage() {
    const { activeSideBar } = useSidebarStore();
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { logout } = useLogout(isRTL);
    const { activeSettingsSubsection } = useSettingsStore();
    const selectedChatId = useActiveChatStore((state) => state.selectedChatId);

    return (
        <div className="h-full max-h-full min-h-full w-full">
            <div className="flex md:hidden">
                {activeSideBar === "main-chat" && (
                    <ChatsSectionLargeSideBar logout={logout} />
                )}
                {activeSideBar === "main-setting" && <SettingsSectionSideBar />}
                {activeSideBar === "main-archive" && <ArchiveSectionLargeSidebar />}
            </div>
            <div className="hidden h-full w-full md:flex">
                {activeSettingsSubsection === "chat-wallpaper" ? (
                    <WallpaperPreview />
                ) : (
                    <>
                        {activeSideBar === "main-chat" || activeSideBar === "create-chat" ? (
                            selectedChatId ? <ChatRoomSection /> : <EmptyStartChating />
                        ) : (
                            <EmptyStartChating />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
