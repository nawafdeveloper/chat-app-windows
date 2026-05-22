import { CheckCircle, CheckOutlined, ContentCopy, EditOutlined, Person, Phone, PhotoCameraOutlined } from "@mui/icons-material";
import { IconButton, ListItem, ListItemIcon, ListItemText, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { ABOUT_MAX_LENGTH, useUpdateUser } from "../hooks/use-update-user";
import { authClient } from "../lib/auth-client";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import SettingsHeader from "./settings-header";
import { useState } from "react";
import DecryptedProfileImage from "./decrypted-profile-image";

export default function SettingsSectionProfile() {
    const { data: session } = authClient.useSession();
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const {
        aboutState,
        fileInputRef,
        handleOpenProfileImagePicker,
        handleSaveProfile,
        handleSelectProfileImage,
        handleStartEditing,
        isEditing,
        isError,
        errorMsg,
        loading,
        nameInputRef,
        nameState,
        profileImageSrc: originalProfileImageSrc,
        setAboutState,
        setNameState,
    } = useUpdateUser({
        name: session?.user.name ?? "",
        image: session?.user.image,
        aboutCiphertext: session?.user.aboutCiphertext,
        aboutEncryptedAesKey: session?.user.aboutEncryptedAesKey,
        aboutIv: session?.user.aboutIv,
        isRTL,
    });

    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async (phone: string) => {
        await navigator.clipboard.writeText(phone);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 3000);
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
                theme.palette.mode === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.8)",
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
        <>
            <Stack
                spacing={4}
                alignItems={"center"}
                className="px-5 pt-5"
                sx={{
                    width: "100%",
                }}
            >
                <SettingsHeader title={isRTL ? "الملف الشخصي" : "Profile"} />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    hidden
                    onChange={handleSelectProfileImage}
                />
                <button
                    className="cursor-pointer relative"
                    onClick={handleOpenProfileImagePicker}
                    type="button"
                >
                    <DecryptedProfileImage
                        imageUrl={originalProfileImageSrc}
                        fallback={<Person className="size-16!" />}
                        sx={(theme) => ({
                            width: 120,
                            height: 120,
                            backgroundColor: theme.palette.mode === "dark" ? "#103529" : "#D9FDD3",
                            color: theme.palette.mode === "dark" ? "#25D366" : "#1F4E2E",
                            border: `1px solid ${theme.palette.mode === "dark" ? "#24453B" : "#C4DCC0"}`,
                        })}
                    />
                    <span className="absolute left-1/2 -translate-x-1/2 gap-x-2 flex flex-row items-center -bottom-3 dark:bg-background bg-white border dark:border-neutral-700 border-neutral-300 px-5 py-2.5 rounded-full dark:text-[#25D366] text-[#15603E]">
                        <PhotoCameraOutlined className="size-5!" />
                        <p className="text-sm">{isRTL ? "تعديل" : "Edit"}</p>
                    </span>
                </button>
                <TextField
                    id="user-full-name"
                    label={isRTL ? "الإسم كامل" : "Full name"}
                    variant="standard"
                    disabled={!isEditing || loading}
                    error={isError}
                    helperText={isError ? errorMsg : " "}
                    inputRef={nameInputRef}
                    sx={profileFieldSx}
                    value={nameState}
                    onChange={(event) => setNameState(event.target.value)}
                    InputProps={{
                        endAdornment: !isEditing ? (
                            <IconButton
                                size="small"
                                onClick={handleStartEditing}
                                disabled={loading}
                            >
                                <EditOutlined />
                            </IconButton>
                        ) : (
                            <IconButton
                                size="small"
                                onClick={handleSaveProfile}
                                disabled={loading}
                            >
                                <CheckOutlined />
                            </IconButton>
                        ),
                    }}
                />
                <TextField
                    id="user-about"
                    label={isRTL ? "نبذة" : "About"}
                    variant="standard"
                    disabled={!isEditing || loading}
                    sx={profileFieldSx}
                    value={aboutState}
                    onChange={(event) => setAboutState(event.target.value)}
                    helperText={" "}
                    inputProps={{
                        maxLength: ABOUT_MAX_LENGTH,
                    }}
                    InputProps={{
                        endAdornment: (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "text.secondary",
                                        minWidth: 40,
                                        textAlign: isRTL ? "left" : "right",
                                    }}
                                >
                                    {aboutState.length}/{ABOUT_MAX_LENGTH}
                                </Typography>
                                {!isEditing ? (
                                    <IconButton
                                        size="small"
                                        onClick={handleStartEditing}
                                        disabled={loading}
                                    >
                                        <EditOutlined />
                                    </IconButton>
                                ) : (
                                    <IconButton
                                        size="small"
                                        onClick={handleSaveProfile}
                                        disabled={loading}
                                    >
                                        <CheckOutlined />
                                    </IconButton>
                                )}
                            </Stack>
                        ),
                    }}
                />
                <ListItem
                    sx={{
                        direction: "ltr",
                    }}
                    secondaryAction={
                        <IconButton onClick={() => { if (session?.user.phoneNumber) handleCopy(session.user.phoneNumber); }} edge="end" aria-label="copy phone number">
                            <ContentCopy />
                        </IconButton>
                    }
                >
                    <ListItemIcon>
                        <Phone />
                    </ListItemIcon>
                    <ListItemText
                        primary={session?.user.phoneNumber || ""}
                    />
                </ListItem>
            </Stack>
            <Snackbar
                open={isCopied}
                autoHideDuration={6000}
                onClose={() => setIsCopied(false)}
                anchorOrigin={{ horizontal: isRTL ? "left" : "right", vertical: "bottom" }}
                message={isRTL ? "تم نسخ رقم الهاتف إلى الحافظة" : "Phone number copied to clipboard."}
                ContentProps={{
                    sx: (theme) => ({
                        borderRadius: "99px",
                        bgcolor: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                        color: theme.palette.mode === "dark" ? "#000000" : "#ffffff",
                        fontWeight: 500,
                        boxShadow: "none",
                        flexDirection: isRTL ? "row-reverse" : "row",
                        paddingRight: isRTL ? "16px" : "24px",
                        paddingLeft: isRTL ? "24px" : "16px",
                    }),
                }}
                action={
                    <CheckCircle />
                }
            />
        </>
    );
}
