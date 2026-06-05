import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { useCreateGroupChat } from '../hooks/use-create-group-chat';
import { useGroupSidebarStore } from '../store/use-group-sidebar-store';
import { useNewGroupStore } from '../store/use-new-group-store';
import { AddAPhoto, ArrowBackOutlined, ArrowForwardOutlined, Group } from '@mui/icons-material';
import { Alert, Avatar, Box, Button, CircularProgress, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import React, { useRef } from 'react'

export default function CreateGroupInformationLargeSidebar() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { setGroupSidebarState } = useGroupSidebarStore();
    const { groupName, groupAvatar, setGroupName, setGroupAvatar } = useNewGroupStore();
    const { createGroupChat, isCreating, error } = useCreateGroupChat();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const localUrl = URL.createObjectURL(file);
        setGroupAvatar(localUrl, file);

        event.target.value = '';
    };

    const profileFieldSx = (theme: { palette: { mode: string } }) => ({
        width: "100%",
        "& .MuiInput-underline:after": {
            borderBottomColor: theme.palette.mode === "dark" ? "#25D366" : "#15603E",
        },
        "& .MuiInputLabel-root.Mui-focused": {
            color: theme.palette.mode === "dark" ? "#25D366" : "#15603E",
        },
        "& .MuiInputBase-input.Mui-disabled": {
            WebkitTextFillColor:
                theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(0,0,0,0.8)",
        },
        "& .MuiInputLabel-root": {
            left: isRTL ? "unset" : 0,
            right: isRTL ? 0 : "unset",
            transformOrigin: isRTL ? "top right" : "top left",
            "&.MuiInputLabel-standard": {
                transform: "translate(0px, 20px) scale(1)",
            },
            "&.MuiInputLabel-standard.MuiInputLabel-shrink": {
                transform: "translate(0px, -1.5px) scale(0.75)",
            },
        },
        "& .MuiInputBase-input": {
            textAlign: isRTL ? "right" : "left",
        },
        "& .MuiInputAdornment-root": {
            marginLeft: isRTL ? 0 : "unset",
            marginRight: isRTL ? "unset" : 0,
        },
    });

    return (
        <div
            className={`flex flex-col space-y-4 w-full bg-white dark:bg-[#161717] ${isRTL ? "border-l" : "border-r"
                } dark:border-neutral-700 border-neutral-300 overflow-y-auto pt-5`}
        >
            <div className="flex h-full flex-col gap-y-3 px-5">
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
                            onClick={() => setGroupSidebarState(false)}
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
                    <p className='font-semibold'>{isRTL ? 'إنشاء المجموعة' : 'Create group'}</p>
                </div>
                <div className='flex flex-col items-center justify-center w-full space-y-4 mt-8 px-5'>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleFileChange}
                    />
                    <Avatar
                        onClick={handleAvatarClick}
                        src={groupAvatar ?? undefined}
                        sx={(theme) => ({
                            width: '110px',
                            height: '110px',
                            backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'filter 0.2s ease',
                            '&:hover .overlay': {
                                opacity: 1,
                            },
                        })}
                    >
                        {!groupAvatar && (
                            <Group
                                sx={(theme) => ({
                                    width: '54px',
                                    height: '54px',
                                    color: theme.palette.mode === 'dark' ? '#5a5a5a' : '#b0b0b0',
                                })}
                            />
                        )}
                        <Box
                            className="overlay"
                            sx={(theme) => ({
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                backgroundColor: theme.palette.mode === 'dark'
                                    ? 'rgba(0, 0, 0, 0.65)'
                                    : 'rgba(0, 0, 0, 0.45)',
                                opacity: 0,
                                transition: 'opacity 0.2s ease',
                            })}
                        >
                            <AddAPhoto
                                sx={{
                                    width: '22px',
                                    height: '22px',
                                    color: '#ffffff',
                                }}
                            />
                            <Typography
                                sx={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: '#ffffff',
                                    textAlign: 'center',
                                    lineHeight: 1.2,
                                    px: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                {isRTL ? 'أضف صورة' : 'Add Photo'}
                            </Typography>
                        </Box>
                    </Avatar>
                    <TextField
                        id="first-name"
                        label={isRTL ? "إسم المجموعة" : "Group name"}
                        variant="standard"
                        // disabled={}
                        // error={}
                        // helperText=""
                        sx={profileFieldSx}
                        value={groupName}
                        onChange={(event) => {
                            setGroupName(event.target.value);
                        }}
                    />
                    <Button
                        variant="outlined"
                        disabled={!groupName.trim() || isCreating}
                        onClick={() => void createGroupChat()}
                        sx={{
                            marginTop: 4,
                            width: "100%",
                            borderRadius: 99,
                            paddingY: "10px",
                            border: "none",
                            backgroundColor: "#25D366",
                            textTransform: "none",
                            color: "#1C1E21",
                            "&:hover": {
                                backgroundColor: "#1E9A4D",
                                border: "none",
                            },
                            "&.Mui-disabled": {
                                backgroundColor: "#25D36660",
                                color: "#1C1E2180",
                                border: "none",
                            },
                        }}
                    >
                        {isRTL ? 'إنشاء المجموعة' : 'Create group'}
                    </Button>
                    {isCreating ? (
                        <CircularProgress size={20} sx={{ color: "#25D366" }} />
                    ) : null}
                    {error ? (
                        <Alert severity="error" sx={{ width: "100%" }}>
                            {error}
                        </Alert>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
