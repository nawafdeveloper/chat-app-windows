import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { DeleteForeverOutlined, ExpandMore, PushPinOutlined, ShortcutRounded, StarOutlined, TurnLeftOutlined } from '@mui/icons-material';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import React, { useState } from 'react'

type Props = {
    onReply?: () => void;
    onForward?: () => void;
    onPin?: () => void;
    onStar?: () => void;
};

export default function ChatRoomActionBubble({
    onReply,
    onForward,
    onPin,
    onStar,
}: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleReply = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        onReply?.();
        handleClose();
    };
    const handleForward = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        onForward?.();
        handleClose();
    };
    const handlePin = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        onPin?.();
        handleClose();
    };
    const handleStar = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        onStar?.();
        handleClose();
    };

    return (
        <div>
            <IconButton
                onClick={handleClick}
                aria-label="more"
                sx={(theme) => ({
                    pointerEvents: 'auto',
                    "&:hover": {
                        backgroundColor:
                            theme.palette.mode === "dark" ? "#222424" : "#ffffff",
                    },
                    padding: 0,
                    backgroundColor:
                        theme.palette.mode === "dark" ? "#222424" : "#ffffff",
                })}
            >
                <ExpandMore
                    fontSize="inherit"
                    sx={(theme) => ({
                        color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                    })}
                />
            </IconButton>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: (theme) => ({
                        backgroundColor: theme.palette.mode === "dark" ? "#222424" : "#ffffff",
                        borderRadius: 3,
                        boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
                        width: '170px'
                    }),
                }}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                    sx: {
                        padding: 1,
                    },
                }}
            >
                <MenuItem
                    onClick={handleReply}
                    sx={(theme) => ({
                        "&:hover": {
                            backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                        },
                        borderRadius: 2,
                        paddingY: 1,
                        paddingX: 1
                    })}
                >
                    <ListItemIcon>
                        <TurnLeftOutlined
                            fontSize="small"
                            sx={(theme) => ({
                                color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261"
                            })}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primaryTypographyProps={{
                            sx: (theme) => ({
                                color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                fontWeight: 500,
                                fontSize: "15px",
                            }),
                        }}
                    >{isRTL ? 'رد' : 'Reply'}</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={handleForward}
                    sx={(theme) => ({
                        "&:hover": {
                            backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                        },
                        borderRadius: 2,
                        paddingY: 1,
                        paddingX: 1
                    })}
                >
                    <ListItemIcon>
                        <ShortcutRounded
                            fontSize="small"
                            sx={(theme) => ({
                                color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261"
                            })}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primaryTypographyProps={{
                            sx: (theme) => ({
                                color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                fontWeight: 500,
                                fontSize: "15px",
                            }),
                        }}
                    >{isRTL ? 'إعادة توجيه' : 'Forward'}</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={handlePin}
                    sx={(theme) => ({
                        "&:hover": {
                            backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                        },
                        borderRadius: 2,
                        paddingY: 1,
                        paddingX: 1
                    })}
                >
                    <ListItemIcon>
                        <PushPinOutlined
                            fontSize="small"
                            sx={(theme) => ({
                                color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261"
                            })}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primaryTypographyProps={{
                            sx: (theme) => ({
                                color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                fontWeight: 500,
                                fontSize: "15px",
                            }),
                        }}
                    >{isRTL ? 'تثبيت' : 'Pin'}</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={handleStar}
                    sx={(theme) => ({
                        "&:hover": {
                            backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                        },
                        borderRadius: 2,
                        paddingY: 1,
                        paddingX: 1
                    })}
                >
                    <ListItemIcon>
                        <StarOutlined
                            fontSize="small"
                            sx={(theme) => ({
                                color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261"
                            })}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primaryTypographyProps={{
                            sx: (theme) => ({
                                color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                fontWeight: 500,
                                fontSize: "15px",
                            }),
                        }}
                    >{isRTL ? 'نجمة' : 'Star'}</ListItemText>
                </MenuItem>
            </Menu>
        </div>
    )
}
