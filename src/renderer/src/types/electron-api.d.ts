import type {
  AuthFetchRequest,
  AuthFetchResponse,
  AuthFlowState,
  SendPhoneOtpRequest,
  VerifyPhoneOtpRequest,
} from "../../../shared/auth-ipc";
import type {
  NativeNotificationBadgePayload,
  NativeNotificationClickPayload,
  NativeNotificationPayload,
  NativeNotificationReplyPayload,
} from "../../../shared/notification-ipc";

declare global {
  type ElectronAPI = {
    platform: string;
    versions: {
      chrome: string;
      electron: string;
      node: string;
    };
    authFetch: (payload: AuthFetchRequest) => Promise<AuthFetchResponse>;
    appFetch: (payload: AuthFetchRequest) => Promise<AuthFetchResponse>;
    getAuthFlow: () => Promise<AuthFlowState>;
    resetAuthFlow: () => Promise<AuthFlowState>;
    sendPhoneOtp: (payload: SendPhoneOtpRequest) => Promise<AuthFlowState>;
    verifyPhoneOtp: (payload: VerifyPhoneOtpRequest) => Promise<{ session: unknown | null }>;
    minimizeWindow: () => Promise<void>;
    toggleMaximizeWindow: () => Promise<boolean>;
    closeWindow: () => Promise<void>;
    isWindowMaximized: () => Promise<boolean>;
    onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
    showNativeNotification: (payload: NativeNotificationPayload) => Promise<boolean>;
    setNativeNotificationBadge: (
      payload: NativeNotificationBadgePayload
    ) => Promise<boolean>;
    onNativeNotificationClick: (
      callback: (payload: NativeNotificationClickPayload) => void
    ) => () => void;
    onNativeNotificationReply: (
      callback: (payload: NativeNotificationReplyPayload) => void
    ) => () => void;
  };

  interface Window {
    electronAPI: ElectronAPI;
  }
}

export { };
