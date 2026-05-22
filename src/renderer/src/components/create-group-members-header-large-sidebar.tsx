import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { useSubsidebarStore } from '../store/use-active-subsidebar-store';
import { useGroupMembersSearchStore } from '../store/use-group-memeber-search-store';
import { useGroupSidebarStore } from '../store/use-group-sidebar-store';
import { useNewGroupStore } from '../store/use-new-group-store';
import { ArrowBackOutlined, ArrowForwardOutlined, Check, CloseOutlined, SearchOutlined } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import { useRef } from 'react'

export default function CreateGroupMembersHeaderLargeSidebar() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { query, setQuery, clearQuery } = useGroupMembersSearchStore();
    const { setActiveSubsideBar } = useSubsidebarStore();
    const { setGroupSidebarState } = useGroupSidebarStore();
    const { selectedContacts } = useNewGroupStore();

    const inputRef = useRef<HTMLInputElement>(null);

    const handleClear = () => {
        clearQuery();
        inputRef.current?.blur();
    };

    const handleNext = () => {
        if (selectedContacts.length === 0) {
            return;
        }

        setGroupSidebarState(true);
    };

    return (
        <div className='flex flex-col space-y-4'>
            <div className='app-region-drag flex flex-row items-center justify-between px-5 w-full'>
                <div className="flex flex-row items-center gap-x-3">
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
                            onClick={() => setActiveSubsideBar(null)}
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
                    <p className='font-semibold'>{isRTL ? 'إضافة أعضاء المجموعة' : 'Add group members'}</p>
                </div>
                <IconButton
                    onClick={handleNext}
                    sx={{
                        backgroundColor: '#25D366',
                        "&:hover": {
                            backgroundColor: '#25D366',
                        },
                    }}
                    disabled={selectedContacts.length === 0}
                >
                    <Check fontSize='inherit' />
                </IconButton>
            </div>
            <TextField
                hiddenLabel
                id="filled-search-bar"
                variant="filled"
                size="small"
                placeholder={
                    isRTL ? "إبحث عن إسم أو رقم هاتف" : "Search name or number"
                }
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                inputRef={inputRef}
                sx={(theme) => ({
                    "& .MuiFilledInput-root": {
                        borderRadius: 8,
                        "&.Mui-focused": {
                            outline: "2px solid #25D366",
                            backgroundColor:
                                theme.palette.mode === "dark"
                                    ? "rgba(28,30,33,0)"
                                    : "#ffffff",
                        },
                    },
                    marginX: "20px",
                })}
                InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchOutlined
                                sx={{
                                    color: (theme) =>
                                        theme.palette.mode === "dark"
                                            ? "#A5A5A5"
                                            : "#636261",
                                    width: 20,
                                    height: 20,
                                }}
                            />
                        </InputAdornment>
                    ),
                    endAdornment: query ? (
                        <InputAdornment position="end">
                            <IconButton onClick={handleClear} size="small">
                                <CloseOutlined
                                    sx={{
                                        color: (theme) =>
                                            theme.palette.mode === "dark"
                                                ? "#A5A5A5"
                                                : "#636261",
                                        width: 18,
                                        height: 18,
                                    }}
                                />
                            </IconButton>
                        </InputAdornment>
                    ) : null,
                }}
            />
        </div>
    )
}
