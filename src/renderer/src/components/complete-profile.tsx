import { authClient } from '../lib/auth-client';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { Button, Stack, TextField } from '@mui/material';
import { useUpdateUser } from "../hooks/use-update-user";
import DecryptedProfileImage from './decrypted-profile-image';
import { AdminPanelSettingsOutlined, Person, PhotoCameraOutlined } from '@mui/icons-material';

type CompleteProfileProps = {
    completeNewUserOnSave?: boolean;
};

export default function CompleteProfile({
    completeNewUserOnSave = false,
}: CompleteProfileProps) {
    const { data: session, refetch: refetchSession } = authClient.useSession();
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const handleCompleteNewUser = async () => {
        const { error } = await authClient.updateUser({
            isNewUser: false,
        });

        if (error) {
            throw new Error(
                error.message || "Something went wrong, please try again."
            );
        }

        await refetchSession();
    };

    const {
        fileInputRef,
        handleOpenProfileImagePicker,
        handleSaveProfile,
        handleSelectProfileImage,
        isError,
        errorMsg,
        loading,
        nameInputRef,
        nameState,
        profileImageSrc: originalProfileImageSrc,
        setNameState,
    } = useUpdateUser({
        name: session?.user.name ?? "",
        image: session?.user.image,
        aboutCiphertext: session?.user.aboutCiphertext,
        aboutEncryptedAesKey: session?.user.aboutEncryptedAesKey,
        aboutIv: session?.user.aboutIv,
        isRTL,
        onSaveSuccess: completeNewUserOnSave ? handleCompleteNewUser : undefined,
    });

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
        <Stack
            spacing={4}
            alignItems={"center"}
            className="px-5 pt-5 flex justify-center items-center w-full max-w-md mx-auto h-[80vh]"
        >
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
                    <p className="text-sm">{isRTL ? "إضافة" : "Add"}</p>
                </span>
            </button>
            <TextField
                id="user-full-name"
                label={isRTL ? "الإسم كامل" : "Full name"}
                variant="standard"
                disabled={loading}
                error={isError}
                helperText={isError ? errorMsg : " "}
                inputRef={nameInputRef}
                sx={profileFieldSx}
                value={nameState}
                onChange={(event) => setNameState(event.target.value)}
            />
            <Button
                onClick={handleSaveProfile}
                disabled={loading || !nameState}
                variant="outlined"
                sx={{
                    borderRadius: 99,
                    paddingY: "10px",
                    border: "none",
                    backgroundColor: "#25D366",
                    textTransform: "none",
                    color: "#1C1E21",
                    "&:hover": {
                        backgroundColor: "#1E9A4D",
                    },
                    "&.Mui-disabled": {
                        backgroundColor: "#25D36660",
                        color: "#1C1E2180",
                        border: "none",
                    },
                }}
                fullWidth
            >
                {loading ? (
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <g>
                            <rect x="11" y="1" width="2" height="5" opacity=".14" />
                            <rect x="11" y="1" width="2" height="5" transform="rotate(30 12 12)" opacity=".29" />
                            <rect x="11" y="1" width="2" height="5" transform="rotate(60 12 12)" opacity=".43" />
                            <rect x="11" y="1" width="2" height="5" transform="rotate(90 12 12)" opacity=".57" />
                            <rect x="11" y="1" width="2" height="5" transform="rotate(120 12 12)" opacity=".71" />
                            <rect x="11" y="1" width="2" height="5" transform="rotate(150 12 12)" opacity=".86" />
                            <rect x="11" y="1" width="2" height="5" transform="rotate(180 12 12)" />
                            <animateTransform attributeName="transform" type="rotate" calcMode="discrete" dur="0.75s" values="0 12 12;30 12 12;60 12 12;90 12 12;120 12 12;150 12 12;180 12 12;210 12 12;240 12 12;270 12 12;300 12 12;330 12 12;360 12 12" repeatCount="indefinite" />
                        </g>
                    </svg>
                ) : (
                    <>
                        {isRTL ? 'حفظ' : 'Save'}
                    </>
                )}
            </Button>
            <span className="flex flex-row items-start gap-x-1 text-sm text-gray-500">
                <AdminPanelSettingsOutlined
                    fontSize="inherit"
                    className="mt-0.5"
                />
                <p>
                    {isRTL
                        ? "\u0623\u0646\u0634\u0626 \u0631\u0642\u0645\u0643 \u0627\u0644\u0633\u0631\u064a"
                        : "Your information is protected in accordance with our Privacy Policy."}
                </p>
            </span>
        </Stack>
    )
}
