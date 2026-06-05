import { countries } from '../lib/countries-code';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { ExpandMoreOutlined, Info } from '@mui/icons-material';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import TextField from '@mui/material/TextField';
import Image from './electron-image';
import { useEffect, useRef } from 'react'

type Props = {
    country: string | null;
    phone: string;
    setPhone: (value: string) => void;
    dialCode: string;
    setDialCode: (value: string) => void;
    sendOtp: () => void;
    loading: boolean;
    isError: boolean;
    errorMsg: string;
}

export default function AuthPhoneForm({
    country,
    phone,
    setPhone,
    dialCode,
    setDialCode,
    sendOtp,
    loading,
    isError,
    errorMsg
}: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const inputRef = useRef<HTMLInputElement>(null);

    const handleClear = () => {
        setPhone("");
        inputRef.current?.blur();
    };

    const defaultCountry = countries.find(c => c.alpha2 === country) || countries.find(c => c.alpha2 === "SA");

    useEffect(() => {
        setDialCode(defaultCountry?.dialCode || '+966');
    }, []);
    
    return (
        <div className='flex flex-col items-center justify-center w-full h-full p-4'>
            <div className='flex flex-col h-full max-h-1/2 justify-between w-full md:max-w-sm md:mx-auto'>
                <div className='flex flex-col items-center justify-center gap-y-4 md:gap-y-8 w-full'>
                    <Image
                        src={locale === 'ar' ? "yahla-arabic-brand.svg" : "yahla-english-brand.svg"}
                        alt="YaHla Corp.©"
                        width={200}
                        height={200}
                        className="w-auto h-7 object-contain"
                    />
                    <span className='flex flex-col gap-y-1'>
                        <h1 className='text-4xl text-center'>{isRTL ? 'أدخل رقم هاتفك' : 'Enter phone number'}</h1>
                        <p className='text-lg text-center text-gray-500'>{isRTL ? 'قم بإختيار مفتاح الدولة الخاصة بك و ادخل رقم الهاتف' : 'Select a country and enter your phone number.'}</p>
                    </span>
                    <div className='w-full flex flex-col gap-y-2'>
                        <Autocomplete
                            disablePortal
                            size="small"
                            popupIcon={<ExpandMoreOutlined fontSize="inherit" />}
                            options={countries}
                            getOptionLabel={(option) => option.name}
                            onChange={(event, value) => {
                                if (value) setDialCode(value.dialCode);
                            }}
                            defaultValue={defaultCountry}
                            sx={{
                                width: '100%',
                                direction: 'ltr',
                                verticalAlign: "middle",
                                "& .MuiFilledInput-root": {
                                    borderRadius: 8,
                                    paddingX: "24px",
                                    paddingY: 0,
                                    paddingTop: "6px",
                                    height: "46px",
                                    "&.Mui-focused": {
                                        outline: "2px solid #25D366",
                                    },
                                    "&:before, &:after": { display: "none" },
                                },
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="filled"
                                    InputProps={{
                                        ...params.InputProps,
                                        disableUnderline: true,
                                    }}
                                />
                            )}
                            PaperComponent={(props) => (
                                <Paper
                                    {...props}
                                    sx={{
                                        borderRadius: 4,
                                        boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
                                        marginTop: "4px",
                                        "& ul": {
                                            padding: 1,
                                            "& .MuiAutocomplete-option": {
                                                borderRadius: 2,
                                                padding: "8px 16px",
                                                fontSize: "14px",
                                                "&[aria-selected='true']": {
                                                    backgroundColor: "#25D366",
                                                    color: "#1C1E21",
                                                    "&:hover": {
                                                        backgroundColor: "#1ebe56",
                                                        color: "#1C1E21",
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                />
                            )}
                            PopperComponent={(props) => <Popper {...props} placement="bottom-start" />}
                        />
                        <TextField
                            hiddenLabel
                            id="phone-number-input"
                            variant="filled"
                            fullWidth
                            type="tel"
                            size="small"
                            value={phone}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                setPhone(value.slice(0, 9));
                            }}
                            inputRef={inputRef}
                            sx={{
                                direction: 'ltr',
                                "& .MuiFilledInput-root": {
                                    borderRadius: 8,
                                    paddingY: "3px",
                                    paddingX: "24px",
                                    "&.Mui-focused": {
                                        outline: "2px solid #25D366",
                                    },
                                }
                            }}
                            InputProps={{
                                disableUnderline: true,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        {dialCode ? dialCode : defaultCountry?.dialCode}
                                    </InputAdornment>
                                ),
                                endAdornment: phone ? (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleClear} size="small">
                                            <CloseOutlined
                                                sx={{
                                                    color: (theme) =>
                                                        theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                                                    width: 18,
                                                    height: 18,
                                                }}
                                            />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            }}
                        />
                    </div>
                </div>
                {isError && (
                    <span className='flex flex-row items-center gap-x-2 mt-1 mb-5 text-sm text-gray-500'>
                        <Info fontSize='small' />
                        <p>{errorMsg}</p>
                    </span>
                )}
                <div className='flex flex-col gap-y-2 w-full justify-center items-center'>
                    <Button
                        onClick={sendOtp}
                        variant="outlined"
                        disabled={!phone}
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
                                {isRTL ? 'التالي' : 'Next'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
