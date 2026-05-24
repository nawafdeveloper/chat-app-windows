import { CloseOutlined, SearchOutlined } from '@mui/icons-material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useRef } from 'react';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';

interface Props {
    activeChatTab: "all" | "unread" | "favourites" | "groups";
    setActiveChatTab: (value: "all" | "unread" | "favourites" | "groups") => void;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
}

export default function ChatsSearchHeaderLargeSidebar({
    activeChatTab,
    setActiveChatTab,
    searchQuery,
    setSearchQuery,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const handleClear = () => {
        setSearchQuery("");
        inputRef.current?.blur();
    };

    const handleSelectActiveChatTab = (tab: 'all' | 'unread' | 'favourites' | 'groups') => {
        setActiveChatTab(tab);
    };

    const getTabLabel = (tab: string) => {
        if (isRTL) {
            switch (tab) {
                case 'all': return 'الكل';
                case 'unread': return 'غير مقروء';
                case 'favourites': return 'المفضلة';
                case 'groups': return 'المجموعات';
                default: return tab;
            }
        }
        switch (tab) {
            case 'all': return 'All';
            case 'unread': return 'Unread';
            case 'favourites': return 'Favourites';
            case 'groups': return 'Groups';
            default: return tab;
        }
    };

    return (
        <div className='flex flex-col gap-y-3'>
            <TextField
                hiddenLabel
                id="filled-search-bar"
                variant="filled"
                size="small"
                placeholder={isRTL ? 'البحث عن جهة اتصال' : 'Search for contact'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                inputRef={inputRef}
                sx={{
                    "& .MuiFilledInput-root": {
                        borderRadius: 8,
                        "&.Mui-focused": {
                            outline: "2px solid #25D366",
                        },
                    }
                }}
                InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchOutlined
                                sx={{
                                    color: (theme) =>
                                        theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                    width: 20,
                                    height: 20,
                                }}
                            />
                        </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                        <InputAdornment position="end">
                            <IconButton onClick={handleClear} size="small">
                                <CloseOutlined
                                    sx={{
                                        color: (theme) =>
                                            theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                        width: 18,
                                        height: 18,
                                    }}
                                />
                            </IconButton>
                        </InputAdornment>
                    ) : null,
                }}
            />
            <div className='flex flex-row items-center gap-x-3'>
                <Button
                    onClick={() => handleSelectActiveChatTab('all')}
                    variant="outlined"
                    sx={(theme) => ({
                        borderRadius: 99,
                        borderColor: activeChatTab === 'all' ? theme.palette.mode === "dark" ? "#139443" : "#25D366" : theme.palette.mode === "dark" ? "#333" : "#e5e5e5",
                        color: activeChatTab === 'all' ? theme.palette.mode === "dark" ? "#139443" : "#25D366" : theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                        backgroundColor: activeChatTab === 'all' ? theme.palette.mode === "dark" ? "#103529" : "#D9FDD3" : "transparent",
                        textTransform: "none",
                        "&:hover": {
                            backgroundColor: activeChatTab === 'all' ? theme.palette.mode === "dark" ? "#18503E" : "#C1FFB7" : theme.palette.mode === "dark" ? "#333" : "#e5e5e5",
                        },
                    })}
                >
                    {getTabLabel('all')}
                </Button>
                <Button
                    onClick={() => handleSelectActiveChatTab('unread')}
                    variant="outlined"
                    sx={(theme) => ({
                        borderRadius: 99,
                        borderColor: activeChatTab === 'unread' ? theme.palette.mode === "dark" ? "#139443" : "#25D366" : theme.palette.mode === "dark" ? "#333" : "#e5e5e5",
                        color: activeChatTab === 'unread' ? theme.palette.mode === "dark" ? "#139443" : "#25D366" : theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                        backgroundColor: activeChatTab === 'unread' ? theme.palette.mode === "dark" ? "#103529" : "#D9FDD3" : "transparent",
                        textTransform: "none",
                        "&:hover": {
                            backgroundColor: activeChatTab === 'unread' ? theme.palette.mode === "dark" ? "#18503E" : "#C1FFB7" : theme.palette.mode === "dark" ? "#333" : "#e5e5e5",
                        },
                    })}
                >
                    {getTabLabel('unread')}
                </Button>
                <Button
                    onClick={() => handleSelectActiveChatTab('favourites')}
                    variant="outlined"
                    sx={(theme) => ({
                        borderRadius: 99,
                        borderColor: activeChatTab === 'favourites' ? theme.palette.mode === "dark" ? "#139443" : "#25D366" : theme.palette.mode === "dark" ? "#333" : "#e5e5e5",
                        color: activeChatTab === 'favourites' ? theme.palette.mode === "dark" ? "#139443" : "#25D366" : theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                        backgroundColor: activeChatTab === 'favourites' ? theme.palette.mode === "dark" ? "#103529" : "#D9FDD3" : "transparent",
                        textTransform: "none",
                        "&:hover": {
                            backgroundColor: activeChatTab === 'favourites' ? theme.palette.mode === "dark" ? "#18503E" : "#C1FFB7" : theme.palette.mode === "dark" ? "#333" : "#e5e5e5",
                        },
                    })}
                >
                    {getTabLabel('favourites')}
                </Button>
                <Button
                    onClick={() => handleSelectActiveChatTab('groups')}
                    variant="outlined"
                    sx={(theme) => ({
                        borderRadius: 99,
                        borderColor: activeChatTab === 'groups' ? theme.palette.mode === "dark" ? "#139443" : "#25D366" : theme.palette.mode === "dark" ? "#333" : "#e5e5e5",
                        color: activeChatTab === 'groups' ? theme.palette.mode === "dark" ? "#139443" : "#25D366" : theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                        backgroundColor: activeChatTab === 'groups' ? theme.palette.mode === "dark" ? "#103529" : "#D9FDD3" : "transparent",
                        textTransform: "none",
                        "&:hover": {
                            backgroundColor: activeChatTab === 'groups' ? theme.palette.mode === "dark" ? "#18503E" : "#C1FFB7" : theme.palette.mode === "dark" ? "#333" : "#e5e5e5",
                        },
                    })}
                >
                    {getTabLabel('groups')}
                </Button>
            </div>
        </div>
    )
}
