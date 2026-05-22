import React from 'react'
import AuthPhoneForm from './auth-phone-form';
import AuthOtpForm from './auth-otp-form';
import { useAuthFlow } from '../hooks/use-auth-flow';
import { Snackbar } from '@mui/material';
import { Info } from '@mui/icons-material';
import GlobalLoading from './global-loading';

interface Props {
    country: string | null;
    isRTL: boolean;
}

export default function AuthFlowSection({ country, isRTL }: Props) {
    const {
        currentStep,
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
        errorMsg
    } = useAuthFlow(isRTL);

    if (!isHydrated) {
        return <GlobalLoading />;
    }

    return (
        <div className='w-full h-full'>
            {currentStep === 'phoneForm' && (
                <AuthPhoneForm
                    country={country}
                    phone={phone}
                    setPhone={setPhone}
                    dialCode={dialCode}
                    setDialCode={setDialCode}
                    sendOtp={sendOtp}
                    loading={loading}
                    isError={isError}
                    errorMsg={errorMsg}
                />
            )}
            {currentStep === 'otpForm' && (
                <AuthOtpForm
                    otp={otp}
                    setOtp={setOtp}
                    verifyOtp={verifyOtp}
                    loading={loading}
                    isError={isError}
                    errorMsg={errorMsg}
                />
            )}
            <Snackbar
                open={isError}
                autoHideDuration={6000}
                onClose={() => setIsError(false)}
                message={errorMsg}
                ContentProps={{
                    sx: (theme) => ({
                        borderRadius: '99px',
                        bgcolor: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                        color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                        fontWeight: 500,
                        paddingRight: '24px',
                        boxShadow: 'none'
                    }),
                }}
                action={
                    <Info />
                }
            />
        </div>
    )
}
