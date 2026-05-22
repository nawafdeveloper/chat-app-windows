import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Image from "./electron-image";
import { useEffect, useState } from "react";

const COPYRIGHT_TEXT = {
    ar: "YaaHalaa. \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0642 \u0645\u062d\u0641\u0648\u0638\u0629. \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u062d\u062a\u0648\u064a\u0627\u062a \u0648\u0627\u0644\u0645\u0644\u0643\u064a\u0629 \u0627\u0644\u0641\u0643\u0631\u064a\u0629 \u062a\u0639\u0648\u062f \u0625\u0644\u0649 YaaHalaa. \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u063a\u064a\u0631 \u0627\u0644\u0645\u0635\u0631\u062d \u0628\u0647 \u0645\u062d\u0638\u0648\u0631.",
    en: "YaaHalaa. All rights reserved. All content and intellectual property belong to YaaHalaa. Unauthorized use is prohibited.",
} as const;

export default function GlobalLoading() {
    const locale = getLocaleFromCookie();
    const [isRTL, setIsRTL] = useState(false);

    useEffect(() => {
        const locale = getLocaleFromCookie();
        setIsRTL(locale ? isRTLClient(locale) : false);
    }, []);

    return (
        <div className="flex flex-col h-full max-h-full min-h-full w-full relative bg-white dark:bg-[#161717]">
            <div className="flex flex-col flex-1 h-full w-full justify-center items-center gap-y-6">
                <Image
                    src={locale === 'ar' ? "yahla-arabic-brand.svg" : "yahla-english-brand.svg"}
                    alt="YaaHalaa"
                    width={500}
                    height={500}
                    className="w-auto h-8 object-contain"
                />
                <Box sx={{ width: "200px" }}>
                    <LinearProgress
                        sx={(theme) => ({
                            height: 3,
                            borderRadius: 2,
                            backgroundColor:
                                theme.palette.mode === "dark"
                                    ? "rgba(37, 211, 102, 0.2)"
                                    : "rgba(37, 211, 102, 0.15)",
                            "& .MuiLinearProgress-bar": {
                                backgroundColor: "#25D366",
                                borderRadius: 2,
                            },
                        })}
                    />
                </Box>
            </div>
            <span className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-0 md:max-w-xl md:mx-auto pb-10 justify-center items-center text-center bg-transparent text-sm text-gray-500">
                <p>&copy; 2026 {isRTL ? COPYRIGHT_TEXT.ar : COPYRIGHT_TEXT.en}</p>
            </span>
        </div>
    );
}
