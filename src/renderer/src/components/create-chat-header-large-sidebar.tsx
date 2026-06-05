import { ArrowBackOutlined, ArrowForwardOutlined } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CreateChatMoreInfoButton from './create-chat-more-info-button';
import { useSidebarStore } from '../store/use-active-sidebar-store';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';

export default function CreateChatHeaderLargeSidebar() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const { setActiveSideBar } = useSidebarStore();

    return (
        <div className="app-region-drag flex flex-row items-center justify-between w-full px-5">
            <div className="flex flex-row items-center gap-x-3 w-full">
                <Tooltip
                    title={isRTL ? "عودة" : "Back"}
                    placement="bottom"
                    slotProps={{
                        tooltip: {
                            sx: (theme) => ({
                                backgroundColor:
                                    theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                                color: theme.palette.mode === "dark" ? "#000000" : "#ffffff",
                            }),
                        },
                    }}
                >
                    <IconButton
                        onClick={() => setActiveSideBar('main-chat')}
                        sx={(theme) => ({
                            "&:hover": {
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "#353939"
                                        : "#e5e5e5",
                            },
                            display: { xs: "none", sm: "flex" }
                        })}
                    >
                        {isRTL ? <ArrowForwardOutlined fontSize="inherit" /> : <ArrowBackOutlined fontSize="inherit" />}
                    </IconButton>
                </Tooltip>
                <p className='font-semibold'>{isRTL ? 'محادثة جديدة' : 'New chat'}</p>
            </div>
            <CreateChatMoreInfoButton />
        </div>
    )
}
