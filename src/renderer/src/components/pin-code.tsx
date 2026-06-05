import { useCrypto } from "../context/crypto";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { AdminPanelSettingsOutlined, Info } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import { MuiOtpInput } from "mui-one-time-password-input";
import Image from "./electron-image";
import { useState } from "react";

const RTL_COPY = {
    title: "أدخل رمزك السري",
    subtitle:
        "رمز سري لأمان حسابك و خصوصيتك",
    incorrectPin:
        "الرمز السري غير صحيح",
    verify: "تحقق الآن",
    privacy:
        "يتم حماية معلوماتك وفقًا لسياسة الخصوصية الخاصة بنا.",
};

export default function PinCode() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { unlock, state } = useCrypto();

    const [pin, setPin] = useState("");
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const verifyPin = async () => {
        setIsError(false);
        setErrorMsg("");

        const success = await unlock(pin);

        if (!success) {
            setIsError(true);
            setErrorMsg(isRTL ? RTL_COPY.incorrectPin : "Incorrect passcode");
        }
    };

    const handleChange = (newValue: string) => {
        setPin(newValue);
        setIsError(false);
        setErrorMsg("");
    };

    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <div className="mx-auto flex h-full max-h-1/2 w-full flex-col justify-between md:max-w-sm">
                <div className="flex w-full flex-col items-center justify-center gap-y-4 md:gap-y-8">
                    <Image
                        src={locale === 'ar' ? "yahla-arabic-brand.svg" : "yahla-english-brand.svg"}
                        alt="YaHla Corp. (c)"
                        width={200}
                        height={200}
                        className="h-7 w-auto object-contain"
                    />
                    <span className="flex flex-col gap-y-1">
                        <h1 className="text-center text-4xl">
                            {isRTL ? RTL_COPY.title : "Enter Passcode"}
                        </h1>
                        <p className="text-center text-lg text-gray-500">
                            {isRTL ? RTL_COPY.subtitle : "Passcode for your account"}
                        </p>
                    </span>
                    <MuiOtpInput
                        value={pin}
                        onChange={handleChange}
                        length={6}
                        autoFocus
                        TextFieldsProps={{
                            type: "password",
                        }}
                        sx={(theme) => ({
                            "& .MuiOtpInput-TextField": {
                                borderRadius: 3,
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "#2B2C2C"
                                        : "#E8E7E5",
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderRadius: 3,
                                    border: "none",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#25D366",
                                    backgroundColor:
                                        theme.palette.mode === "dark"
                                            ? "#343535"
                                            : "#E1DFDD",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#25D366",
                                    borderWidth: 2,
                                },
                                input: {
                                    textAlign: "center",
                                },
                            },
                        })}
                    />
                    {isError && (
                        <span className="mt-1 mb-5 flex flex-row items-start gap-x-2 text-sm text-neutral-500">
                            <Info fontSize="small" />
                            <p>{errorMsg}</p>
                        </span>
                    )}
                </div>
                <div className="flex w-full flex-col items-center justify-center gap-y-2">
                    <Button
                        onClick={verifyPin}
                        disabled={pin.length < 6 || state.status === "loading"}
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
                        {state.status === "loading" ? (
                            <svg
                                width="24"
                                height="24"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <g>
                                    <rect x="11" y="1" width="2" height="5" opacity=".14" />
                                    <rect
                                        x="11"
                                        y="1"
                                        width="2"
                                        height="5"
                                        transform="rotate(30 12 12)"
                                        opacity=".29"
                                    />
                                    <rect
                                        x="11"
                                        y="1"
                                        width="2"
                                        height="5"
                                        transform="rotate(60 12 12)"
                                        opacity=".43"
                                    />
                                    <rect
                                        x="11"
                                        y="1"
                                        width="2"
                                        height="5"
                                        transform="rotate(90 12 12)"
                                        opacity=".57"
                                    />
                                    <rect
                                        x="11"
                                        y="1"
                                        width="2"
                                        height="5"
                                        transform="rotate(120 12 12)"
                                        opacity=".71"
                                    />
                                    <rect
                                        x="11"
                                        y="1"
                                        width="2"
                                        height="5"
                                        transform="rotate(150 12 12)"
                                        opacity=".86"
                                    />
                                    <rect
                                        x="11"
                                        y="1"
                                        width="2"
                                        height="5"
                                        transform="rotate(180 12 12)"
                                    />
                                    <animateTransform
                                        attributeName="transform"
                                        type="rotate"
                                        calcMode="discrete"
                                        dur="0.75s"
                                        values="0 12 12;30 12 12;60 12 12;90 12 12;120 12 12;150 12 12;180 12 12;210 12 12;240 12 12;270 12 12;300 12 12;330 12 12;360 12 12"
                                        repeatCount="indefinite"
                                    />
                                </g>
                            </svg>
                        ) : (
                            <Typography>
                                {isRTL ? RTL_COPY.verify : "Verify"}
                            </Typography>
                        )}
                    </Button>
                    <span className="flex flex-row items-start gap-x-1 text-sm text-gray-500">
                        <AdminPanelSettingsOutlined
                            fontSize="inherit"
                            className="mt-0.5"
                        />
                        <p>
                            {isRTL
                                ? RTL_COPY.privacy
                                : "Your information is protected in accordance with our Privacy Policy."}
                        </p>
                    </span>
                </div>
            </div>
        </div>
    );
}
