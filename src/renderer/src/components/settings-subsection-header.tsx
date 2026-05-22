import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { useSettingsStore } from '../store/use-active-setting-store';
import { ArrowBackOutlined, ArrowForwardOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

type Props = {
    title: string;
}

export default function SettingsSubsectionHeader({ title }: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const { setActiveSettingsSubsection } = useSettingsStore();
    return (
        <div className="app-region-drag flex flex-row items-center gap-x-3 w-full">
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
                    onClick={() => setActiveSettingsSubsection(null)}
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
                    {isRTL ? <ArrowForwardOutlined fontSize="inherit" /> : <ArrowBackOutlined fontSize="inherit" />}
                </IconButton>
            </Tooltip>
            <p className='font-semibold'>{title}</p>
        </div>
    )
}
