export const AUTH_BASE_URL = "https://halabakk-web.nawaf-alhasosah.workers.dev/";
export const AUTH_PROTOCOL_SCHEME = "com.yahla.windows";
export const AUTH_FETCH_CHANNEL = "yahla:auth-fetch";
export const AUTH_FLOW_GET_CHANNEL = "yahla:auth-flow:get";
export const AUTH_FLOW_RESET_CHANNEL = "yahla:auth-flow:reset";
export const AUTH_SEND_PHONE_OTP_CHANNEL = "yahla:auth-flow:send-phone-otp";
export const AUTH_VERIFY_PHONE_OTP_CHANNEL = "yahla:auth-flow:verify-phone-otp";

export type AuthFlowStep = "phoneForm" | "otpForm";

export type AuthFlowState = {
  currentStep: AuthFlowStep;
  phone: string;
  dialCode: string;
};

export type SendPhoneOtpRequest = {
  phone: string;
  dialCode: string;
};

export type VerifyPhoneOtpRequest = {
  otp: string;
  phone?: string;
  dialCode?: string;
};

export type AuthFetchRequest = {
  url: string;
  init?: {
    method?: string;
    headers?: [string, string][];
    body?: string | null;
    redirect?: RequestRedirect;
  };
};

export type AuthFetchResponse = {
  url: string;
  status: number;
  statusText: string;
  headers: [string, string][];
  body: string | null;
};

export type AuthFlowActionResponse = {
  session: unknown | null;
};
