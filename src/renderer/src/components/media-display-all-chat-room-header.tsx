import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { useMediaDisplayAllStore } from '../store/use-media-display-all-store';
import { ArrowBackOutlined, ArrowForwardOutlined } from '@mui/icons-material';
import { Box, IconButton, Tab, Tabs, Tooltip } from '@mui/material';
import React from 'react'

type Props = {
    value: number;
    handleChange: (event: React.SyntheticEvent<Element, Event>, newValue: number) => void;
}

function a11yProps(index: number) {
    return {
        id: `media-tab-${index}`,
        'aria-controls': `media-tabpanel-${index}`,
    };
}

export default function MediaDisplayAllChatRoomHeader({ value, handleChange }: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const { close } = useMediaDisplayAllStore();

    return (
        <div className="flex flex-col items-start gap-y-3 w-full">
            <div className='app-region-drag flex items-start pt-4 px-4'>
                <Tooltip
                    title={isRTL ? "خلف" : "Back"}
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
                        {isRTL ? <ArrowForwardOutlined fontSize="inherit" /> : <ArrowBackOutlined fontSize="inherit" />}
                    </IconButton>
                </Tooltip>
            </div>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label={isRTL ? "الوسائط" : "Media"} {...a11yProps(0)} sx={{ flex: 1 }} />
                    <Tab label={isRTL ? "الملفات" : "Docs"} {...a11yProps(1)} sx={{ flex: 1 }} />
                </Tabs>
            </Box>
        </div>
    )
}
