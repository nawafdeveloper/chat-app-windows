import { authClient } from "../lib/auth-client";
import { refreshRenderer } from "../lib/renderer-navigation";
import { useState } from "react";

const SESSION_KEYS_STORAGE_KEY = "yhla_session_keys";

export const useLogout = (isRTL: boolean) => {
    const [loading, setLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const logout = async () => {
        setIsError(false);
        setErrorMsg('');

        try {
            setLoading(true);

            const { error } = await authClient.signOut();

            if (error) {
                setIsError(true);
                setErrorMsg(error.message || isRTL ? 'حدث خطأ ما, يرجى إعادة المحاولة.' : 'Something went wrong, please try again.');
                return;
            }
            
            localStorage.removeItem(SESSION_KEYS_STORAGE_KEY);
            
            refreshRenderer();
        } catch {
            setIsError(true);
            setErrorMsg(isRTL ? 'حدث خطأ ما, يرجى إعادة المحاولة.' : 'Something went wrong, please try again.')
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        isError,
        setIsError,
        errorMsg,
        logout
    }
};
