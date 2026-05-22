import { useCryptoKeys } from "../context/crypto";
import { encryptContactPayload, sha256Hex } from "../lib/contact-crypto";
import { buildFullPhoneNumber } from "../lib/contact-utils";
import { countries } from "../lib/countries-code";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { useSubsidebarStore } from "../store/use-active-subsidebar-store";
import type { ContactCheckResponse } from "../types/contacts.type";
import { CheckCircleOutlined } from "@mui/icons-material";
import {
    Button,
    CircularProgress,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import CreateContactHeaderLargeSidebar from "./create-contact-header-large-sidebar";

type Props = {
    country: string | null;
};

type AccountStatus =
    | "idle"
    | "checking"
    | "exists"
    | "missing"
    | "duplicate"
    | "error";

export default function CreateNewContactSection({ country }: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { isReady } = useCryptoKeys();
    const { setActiveSubsideBar } = useSubsidebarStore();

    const defaultCountry =
        countries.find((item) => item.alpha2 === country) ||
        countries.find((item) => item.alpha2 === "SA");

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dialCode, setDialCode] = useState(defaultCountry?.dialCode || "+966");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [linkedUserId, setLinkedUserId] = useState<string | null>(null);
    const [accountStatus, setAccountStatus] = useState<AccountStatus>("idle");

    const [isCreating, setIsCreating] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const fullPhoneNumber = buildFullPhoneNumber(dialCode, phoneNumber);

    useEffect(() => {
        if (!fullPhoneNumber || phoneNumber.replace(/\D/g, "").length < 5) {
            setLinkedUserId(null);
            setAccountStatus("idle");
            return;
        }

        let isActive = true;
        const timeoutId = window.setTimeout(async () => {
            try {
                setAccountStatus("checking");

                const response = await fetch(
                    `https://halabakk-web.nawaf-alhasosah.workers.dev//api/contacts/check?phone=${encodeURIComponent(fullPhoneNumber)}`,
                    {
                        cache: "no-store",
                        credentials: "same-origin",
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to verify this phone number.");
                }

                const result = (await response.json()) as ContactCheckResponse;

                if (!isActive) {
                    return;
                }

                if (!result.exists || !result.linkedUserId) {
                    setLinkedUserId(null);
                    setAccountStatus("missing");
                    return;
                }

                setLinkedUserId(result.linkedUserId);
                setAccountStatus(result.alreadyExists ? "duplicate" : "exists");
            } catch (error) {
                if (!isActive) {
                    return;
                }

                setLinkedUserId(null);
                setAccountStatus("error");
                setIsError(true);
                setErrorMsg(
                    error instanceof Error
                        ? error.message
                        : "Failed to verify this phone number."
                );
            }
        }, 400);

        return () => {
            isActive = false;
            window.clearTimeout(timeoutId);
        };
    }, [fullPhoneNumber, phoneNumber]);

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

    const phoneHelperText = isError
        ? errorMsg
        : accountStatus === "exists"
            ? isRTL
                ? "هذا الرقم لديه حساب ويمكن إضافته."
                : "This number has an account and can be added."
            : accountStatus === "duplicate"
                ? isRTL
                    ? "جهة الاتصال هذه موجودة بالفعل."
                    : "This contact already exists."
                : accountStatus === "missing"
                    ? isRTL
                        ? "هذا الرقم غير موجود في قاعدة البيانات."
                        : "This number does not have an account."
                    : accountStatus === "error"
                        ? errorMsg
                        : " ";

    const canCreate =
        isReady &&
        accountStatus === "exists" &&
        Boolean(linkedUserId) &&
        Boolean(firstName.trim()) &&
        Boolean(fullPhoneNumber) &&
        !isCreating;

    const handleCreateContact = async () => {
        if (!firstName.trim()) {
            setIsError(true);
            setErrorMsg(
                isRTL ? "يرجى إدخال الاسم الأول." : "Please enter the first name."
            );
            return;
        }

        if (!linkedUserId || accountStatus !== "exists") {
            setIsError(true);
            setErrorMsg(
                isRTL
                    ? "تحقق من رقم الهاتف أولاً."
                    : "Please verify the phone number first."
            );
            return;
        }

        if (!isReady) {
            setIsError(true);
            setErrorMsg(
                isRTL
                    ? "افتح مفاتيح التشفير أولاً."
                    : "Unlock your encryption keys first."
            );
            return;
        }

        try {
            setIsCreating(true);
            setIsError(false);
            setErrorMsg("");

            const encryptedContact = await encryptContactPayload({
                contact_first_name: firstName.trim(),
                contact_second_name: lastName.trim() || undefined,
                contact_number: fullPhoneNumber,
            });
            const phoneHash = await sha256Hex(fullPhoneNumber);
            const response = await fetch("https://halabakk-web.nawaf-alhasosah.workers.dev//api/contacts", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    linkedUserId,
                    phoneHash,
                    encryptedContact,
                }),
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as
                    | { error?: string }
                    | null;
                throw new Error(payload?.error || "Failed to create contact.");
            }

            setFirstName("");
            setLastName("");
            setPhoneNumber("");
            setLinkedUserId(null);
            setAccountStatus("idle");
            window.dispatchEvent(new Event("contacts:changed"));
            setActiveSubsideBar(null);
        } catch (error) {
            setIsError(true);
            setErrorMsg(
                error instanceof Error
                    ? error.message
                    : "Failed to create contact."
            );
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div
            className={`flex flex-col space-y-4 w-full bg-white dark:bg-[#161717] ${isRTL ? "border-l" : "border-r"
                } dark:border-neutral-700 border-neutral-300 overflow-y-auto pt-5`}
        >
            <div className="flex h-full flex-col gap-y-3">
                <CreateContactHeaderLargeSidebar />
                <Stack
                    spacing={4}
                    alignItems={"center"}
                    className="px-8 pt-5"
                    sx={{
                        width: "100%",
                    }}
                >
                    <TextField
                        id="first-name"
                        label={isRTL ? "الإسم الأول" : "First name"}
                        variant="standard"
                        disabled={isCreating}
                        error={isError && !firstName.trim()}
                        helperText=" "
                        sx={profileFieldSx}
                        value={firstName}
                        onChange={(event) => {
                            setFirstName(event.target.value);
                            setIsError(false);
                            setErrorMsg("");
                        }}
                    />
                    <TextField
                        id="last-name"
                        label={isRTL ? "الإسم الأخير" : "Last name"}
                        variant="standard"
                        disabled={isCreating}
                        helperText=" "
                        sx={profileFieldSx}
                        value={lastName}
                        onChange={(event) => {
                            setLastName(event.target.value);
                            setIsError(false);
                            setErrorMsg("");
                        }}
                    />
                    <div className="flex w-full flex-row items-start gap-x-4">
                        <FormControl variant="standard" sx={{ minWidth: 120 }}>
                            <InputLabel id="country-selector">{isRTL ? 'الدولة' : 'Country'}</InputLabel>
                            <Select
                                labelId="country-selector"
                                id="country-selection"
                                value={dialCode}
                                onChange={(event) => setDialCode(event.target.value)}
                            >
                                {countries.map((item) => (
                                    <MenuItem
                                        key={`${item.alpha2}-${item.dialCode}`}
                                        value={item.dialCode}
                                    >
                                        {item.dialCode}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            id="phone-number"
                            label={isRTL ? "رقم الهاتف" : "Phone number"}
                            variant="standard"
                            disabled={isCreating}
                            error={isError || accountStatus === "error"}
                            helperText={phoneHelperText}
                            sx={profileFieldSx}
                            value={phoneNumber}
                            onChange={(event) => {
                                setPhoneNumber(event.target.value.replace(/\D/g, ""));
                                setIsError(false);
                                setErrorMsg("");
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {accountStatus === "checking" ? (
                                            <CircularProgress
                                                size={18}
                                                sx={{ color: "#25D366" }}
                                            />
                                        ) : accountStatus === "exists" ? (
                                            <CheckCircleOutlined
                                                sx={{ color: "#25D366" }}
                                            />
                                        ) : null}
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </div>

                    {accountStatus === "exists" && (
                        <Button
                            onClick={handleCreateContact}
                            variant="outlined"
                            disabled={!canCreate}
                            sx={{
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
                            {isCreating ? (
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
                            ) : isRTL ? (
                                "إضافة جهة الاتصال"
                            ) : (
                                "Create contact"
                            )}
                        </Button>
                    )}

                    {!isReady && (
                        <Typography
                            sx={{
                                width: "100%",
                                fontSize: 13,
                                color: (theme) =>
                                    theme.palette.mode === "dark"
                                        ? "#A5A5A5"
                                        : "#636261",
                            }}
                        >
                            {isRTL
                                ? "افتح مفاتيح التشفير حتى تتمكن من حفظ جهة الاتصال."
                                : "Unlock your encryption keys before saving a contact."}
                        </Typography>
                    )}
                </Stack>
            </div>
        </div>
    );
}
