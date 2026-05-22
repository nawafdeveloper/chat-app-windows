import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { AccessTimeOutlined, CloseOutlined, DirectionsCarOutlined, DownhillSkiingOutlined, EmojiFoodBeverageOutlined, EmojiNatureOutlined, EmojiObjectsOutlined, EmojiSymbolsOutlined, FlagOutlined, InsertEmoticonOutlined, SearchOutlined, SportsBaseballOutlined } from "@mui/icons-material";
import {
    Box,
    Grow,
    IconButton,
    InputAdornment,
    Tab,
    Tabs,
    TextField,
} from "@mui/material";
import Popper from "@mui/material/Popper";
import React, { useRef, useState } from "react";
import rawEmojis from "unicode-emoji-json";

interface EmojiType {
    emoji: string;
    name: string;
    group: string;
}

interface UnicodeEmojiMeta {
    name: string;
    group: string;
    subgroup?: string;
    version?: number;
}

interface Props {
    messageInput: string;
    setMessageInput: (value: string) => void;
}

export default function ChatRoomInputEmojiButton({ setMessageInput, messageInput }: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [tab, setTab] = useState(0);
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const emojis = rawEmojis as Record<string, UnicodeEmojiMeta>;

    const emojiArray: EmojiType[] = Object.entries(emojis).map(
        ([emoji, meta]) => ({
            emoji,
            name: meta.name,
            group: meta.group,
        })
    );

    const categories = Array.from(
        new Set(emojiArray.map(e => e.group))
    );

    const emojisByCategory: Record<string, EmojiType[]> = {};
    categories.forEach(cat => {
        emojisByCategory[cat] = emojiArray.filter(e => e.group === cat);
    });

    const filteredEmojis = (emojisByCategory[categories[tab]] || []).filter(e =>
        e.name.toLowerCase().includes(value.toLowerCase())
    );

    const handleClear = () => {
        setValue("");
        inputRef.current?.blur();
    };

    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl((prev) => (prev ? null : event.currentTarget));
    };

    return (
        <Box>
            <Popper
                sx={{ zIndex: 1300 }}
                open={open}
                anchorEl={anchorEl}
                placement="top"
                transition
            >
                {({ TransitionProps }) => (
                    <Grow {...TransitionProps}>
                        <Box
                            sx={(theme) => ({
                                width: 600,
                                height: 500,
                                bgcolor: theme.palette.mode === "dark" ? "#1d1f1f" : "#f7f5f3",
                                borderRadius: 4,
                                mb: 2,
                                boxShadow: "0px 8px 30px rgba(0,0,0,0.15)",
                                overflow: "hidden"
                            })}
                        >
                            <Tabs
                                value={tab}
                                onChange={(_, v) => setTab(v)}
                                variant="scrollable"
                                scrollButtons="auto"
                                TabIndicatorProps={{ style: { display: "none" } }}
                                sx={{ minHeight: 56, width: 600 }}
                            >
                                {categories.map((item, index) => {
                                    let IconComponent;
                                    switch (item) {
                                        case "Recent":
                                            IconComponent = AccessTimeOutlined;
                                            break;
                                        case "Smileys & Emotion":
                                            IconComponent = InsertEmoticonOutlined;
                                            break;
                                        case "People & Body":
                                            IconComponent = DownhillSkiingOutlined;
                                            break;
                                        case "Food & Drink":
                                            IconComponent = EmojiFoodBeverageOutlined;
                                            break;
                                        case "Animals & Nature":
                                            IconComponent = EmojiNatureOutlined;
                                            break;
                                        case "Travel & Places":
                                            IconComponent = DirectionsCarOutlined;
                                            break;
                                        case "Activities":
                                            IconComponent = SportsBaseballOutlined;
                                            break;
                                        case "Objects":
                                            IconComponent = EmojiObjectsOutlined;
                                            break;
                                        case "Symbols":
                                            IconComponent = EmojiSymbolsOutlined;
                                            break;
                                        case "Flags":
                                            IconComponent = FlagOutlined;
                                            break;
                                        default:
                                            IconComponent = InsertEmoticonOutlined;
                                    }

                                    return (
                                        <Tab
                                            key={item}
                                            icon={<IconComponent sx={{ color: tab === index ? "#25D366" : "gray" }} />}
                                            sx={{
                                                minHeight: 56,
                                                minWidth: 60,
                                                borderBottom: tab === index ? "2px solid #25D366" : "2px solid transparent"
                                            }}
                                        />
                                    );
                                })}
                            </Tabs>
                            <Box sx={{ flex: 1, height: "100%" }}>
                                <div className="p-4">
                                    <TextField
                                        hiddenLabel
                                        id="filled-search-bar"
                                        variant="filled"
                                        fullWidth
                                        size="small"
                                        placeholder={isRTL ? "إبحث عن رمز تعبيري" : "Search emoji"}
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        inputRef={inputRef}
                                        sx={(theme) => ({
                                            "& .MuiFilledInput-root": {
                                                borderRadius: 8,
                                                "&.Mui-focused": {
                                                    outline: "2px solid #25D366",
                                                    backgroundColor: theme.palette.mode === "dark" ? "rgba(28,30,33,0)" : "#ffffff",
                                                },
                                            },
                                        })}
                                        InputProps={{
                                            disableUnderline: true,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchOutlined
                                                        sx={{
                                                            color: (theme) => (theme.palette.mode === "dark" ? "#A5A5A5" : "#636261"),
                                                            width: 20,
                                                            height: 20,
                                                        }}
                                                    />
                                                </InputAdornment>
                                            ),
                                            endAdornment: value ? (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={handleClear} size="small">
                                                        <CloseOutlined
                                                            sx={{
                                                                color: (theme) => (theme.palette.mode === "dark" ? "#A5A5A5" : "#636261"),
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
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(13, 40px)",
                                        gap: "4px",
                                        overflowY: "auto",
                                        overflowX: "hidden",
                                        height: "73%",
                                        paddingX: 2,
                                    }}
                                >
                                    {categories[tab] === "Recent" ? (
                                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                                            {/* No emojis yet */}
                                        </Box>
                                    ) : (
                                        filteredEmojis.map((e, index) => (
                                            <IconButton
                                                key={index}
                                                sx={{ width: 40, height: 40, p: 0, fontSize: "32px" }}
                                                onClick={() => {
                                                    // append emoji to existing chat input
                                                    setMessageInput(messageInput + e.emoji);
                                                }}
                                            >
                                                {e.emoji}
                                            </IconButton>
                                        ))
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Grow>
                )}
            </Popper>
            <IconButton size="medium" onClick={handleClick}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.5 10.25C9.32843 10.25 10 9.57842 10 8.75C10 7.92157 9.32843 7.25 8.5 7.25C7.67157 7.25 7 7.92157 7 8.75C7 9.57842 7.67157 10.25 8.5 10.25Z" fill="currentColor" />
                    <path d="M17 8.75C17 9.57842 16.3284 10.25 15.5 10.25C14.6715 10.25 14 9.57842 14 8.75C14 7.92157 14.6715 7.25 15.5 7.25C16.3284 7.25 17 7.92157 17 8.75Z" fill="currentColor" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M16.8221 19.9799C15.5379 21.2537 13.8087 21.9781 12 22H9.27273C5.25611 22 2 18.7439 2 14.7273V9.27273C2 5.25611 5.25611 2 9.27273 2H14.7273C18.7439 2 22 5.25611 22 9.27273V11.8141C22 13.7532 21.2256 15.612 19.8489 16.9776L16.8221 19.9799ZM14.7273 4H9.27273C6.36068 4 4 6.36068 4 9.27273V14.7273C4 17.6393 6.36068 20 9.27273 20H11.3331C11.722 19.8971 12.0081 19.5417 12.0058 19.1204L11.9935 16.8564C11.9933 16.8201 11.9935 16.784 11.9941 16.7479C11.0454 16.7473 10.159 16.514 9.33502 16.0479C8.51002 15.5812 7.84752 14.9479 7.34752 14.1479C7.24752 13.9479 7.25585 13.7479 7.37252 13.5479C7.48919 13.3479 7.66419 13.2479 7.89752 13.2479H13.5939C14.4494 12.481 15.5811 12.016 16.8216 12.0208L19.0806 12.0296C19.5817 12.0315 19.9889 11.6259 19.9889 11.1248V9.07648H19.9964C19.8932 6.25535 17.5736 4 14.7273 4ZM14.0057 19.1095C14.0066 19.2605 13.9959 19.4089 13.9744 19.5537C14.5044 19.3124 14.9926 18.9776 15.4136 18.5599L18.4405 15.5576C18.8989 15.1029 19.2653 14.5726 19.5274 13.996C19.3793 14.0187 19.2275 14.0301 19.0729 14.0295L16.8138 14.0208C15.252 14.0147 13.985 15.2837 13.9935 16.8455L14.0057 19.1095Z" fill="currentColor" />
                </svg>
            </IconButton>
        </Box>
    );
}
