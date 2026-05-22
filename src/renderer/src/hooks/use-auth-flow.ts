import { useEffect, useState } from "react";
import type { AuthFlowStep } from "../../../shared/auth-ipc";
import { authClient } from "../lib/auth-client";

function getFriendlyAuthError(error: unknown, fallback: string): string {
    if (!(error instanceof Error)) {
        return fallback;
    }

    return error.message
        .replace(/^Error invoking remote method '[^']+': Error: /, "")
        .replace(/^Error invoking remote method '[^']+': /, "")
        || fallback;
}

export const useAuthFlow = (isRTL: boolean) => {
    const { refetch: refetchSession } = authClient.useSession();
    const [currentStep, setCurrentStep] = useState<AuthFlowStep>("phoneForm");
    const [phone, setPhone] = useState("");
    const [dialCode, setDialCode] = useState("");
    const [otp, setOtp] = useState("");

    const [isHydrated, setIsHydrated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function hydrateAuthFlow() {
            try {
                const state = await window.electronAPI.getAuthFlow();

                if (!isMounted) {
                    return;
                }

                setCurrentStep(state.currentStep);
                setPhone(state.phone);
                setDialCode(state.dialCode);
            } catch {
                if (isMounted) {
                    setCurrentStep("phoneForm");
                }
            } finally {
                if (isMounted) {
                    setIsHydrated(true);
                }
            }
        }

        void hydrateAuthFlow();

        return () => {
            isMounted = false;
        };
    }, []);

    const sendOtp = async () => {
        setIsError(false);
        setErrorMsg("");

        try {
            setLoading(true);

            if (!phone) {
                setIsError(true);
                setErrorMsg(isRTL ? "يرجى إدخال رقم الهاتف." : "Please enter your phone number.");
                return;
            }

            const nextState = await window.electronAPI.sendPhoneOtp({ phone, dialCode });
            setPhone(nextState.phone);
            setDialCode(nextState.dialCode);
            setCurrentStep(nextState.currentStep);
        } catch (error) {
            setIsError(true);
            setErrorMsg(
                getFriendlyAuthError(
                    error,
                    isRTL
                        ? "حدث خطأ ما في الخادم، أعد المحاولة."
                        : "Internal server error, please try again.",
                ),
            );
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        setIsError(false);
        setErrorMsg("");

        try {
            setLoading(true);

            if (!otp) {
                setIsError(true);
                setErrorMsg(isRTL ? "يرجى إدخال رمز التحقق المرسل." : "Please enter OTP you received.");
                return;
            }

            await window.electronAPI.verifyPhoneOtp({ otp, phone, dialCode });
            await refetchSession();
        } catch (error) {
            setIsError(true);
            setErrorMsg(
                getFriendlyAuthError(
                    error,
                    isRTL
                        ? "حدث خطأ ما في الخادم، أعد المحاولة."
                        : "Internal server error, please try again.",
                ),
            );
        } finally {
            setLoading(false);
        }
    };

    return {
        currentStep,
        setCurrentStep,
        phone,
        setPhone,
        dialCode,
        setDialCode,
        otp,
        setOtp,
        sendOtp,
        verifyOtp,
        isHydrated,
        loading,
        isError,
        setIsError,
        errorMsg,
    };
};
