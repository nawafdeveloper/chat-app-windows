import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { useDetailedSidebarStore } from '../store/use-detailed-sidebar-store';
import { Close } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

export default function DetailedLargeSidebarHeader() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const {close} = useDetailedSidebarStore();

    return (
        <div className="app-region-drag flex flex-row items-center gap-x-3 w-full">
            <Tooltip
                title={isRTL ? "إغلاق" : "Close"}
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
                    onClick={close}
                    sx={(theme) => ({
                        "&:hover": {
                            backgroundColor:
                                theme.palette.mode === "dark"
                                    ? "#333333"
                                    : "#e5e5e5",
                        },
                        display: { xs: "none", sm: "flex" }
                    })}
                >
                    <Close fontSize="inherit" />
                </IconButton>
            </Tooltip>
            <p className='font-semibold'>{isRTL ? 'تفاصيل جهة الإتصال' : 'Contact information'}</p>
        </div>
    )
}
