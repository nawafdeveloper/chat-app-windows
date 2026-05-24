import { contextBridge, ipcRenderer } from "electron";
import {
  AUTH_FETCH_CHANNEL,
  AUTH_FLOW_GET_CHANNEL,
  AUTH_FLOW_RESET_CHANNEL,
  AUTH_SEND_PHONE_OTP_CHANNEL,
  AUTH_VERIFY_PHONE_OTP_CHANNEL,
  type AuthFlowState,
  type AuthFetchRequest,
  type AuthFetchResponse,
  type SendPhoneOtpRequest,
  type VerifyPhoneOtpRequest,
} from "../shared/auth-ipc";
import {
  WINDOW_CLOSE_CHANNEL,
  WINDOW_IS_MAXIMIZED_CHANNEL,
  WINDOW_MAXIMIZED_CHANGE_CHANNEL,
  WINDOW_MINIMIZE_CHANNEL,
  WINDOW_TOGGLE_MAXIMIZE_CHANNEL,
} from "../shared/window-ipc";
import {
  NOTIFICATION_CLICKED_CHANNEL,
  NOTIFICATION_REPLIED_CHANNEL,
  NOTIFICATION_SHOW_CHANNEL,
  type NativeNotificationClickPayload,
  type NativeNotificationPayload,
  type NativeNotificationReplyPayload,
} from "../shared/notification-ipc";

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
  onNativeNotificationClick: (
    callback: (payload: NativeNotificationClickPayload) => void
  ) => () => void;
  onNativeNotificationReply: (
    callback: (payload: NativeNotificationReplyPayload) => void
  ) => () => void;
};

const electronAPI: ElectronAPI = {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
  authFetch: (payload) => ipcRenderer.invoke(AUTH_FETCH_CHANNEL, payload),
  appFetch: (payload) => ipcRenderer.invoke(AUTH_FETCH_CHANNEL, payload),
  getAuthFlow: () => ipcRenderer.invoke(AUTH_FLOW_GET_CHANNEL),
  resetAuthFlow: () => ipcRenderer.invoke(AUTH_FLOW_RESET_CHANNEL),
  sendPhoneOtp: (payload) => ipcRenderer.invoke(AUTH_SEND_PHONE_OTP_CHANNEL, payload),
  verifyPhoneOtp: (payload) => ipcRenderer.invoke(AUTH_VERIFY_PHONE_OTP_CHANNEL, payload),
  minimizeWindow: () => ipcRenderer.invoke(WINDOW_MINIMIZE_CHANNEL),
  toggleMaximizeWindow: () => ipcRenderer.invoke(WINDOW_TOGGLE_MAXIMIZE_CHANNEL),
  closeWindow: () => ipcRenderer.invoke(WINDOW_CLOSE_CHANNEL),
  isWindowMaximized: () => ipcRenderer.invoke(WINDOW_IS_MAXIMIZED_CHANNEL),
  onWindowMaximizedChange: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => {
      callback(isMaximized);
    };

    ipcRenderer.on(WINDOW_MAXIMIZED_CHANGE_CHANNEL, listener);

    return () => {
      ipcRenderer.removeListener(WINDOW_MAXIMIZED_CHANGE_CHANNEL, listener);
    };
  },
  showNativeNotification: (payload) =>
    ipcRenderer.invoke(NOTIFICATION_SHOW_CHANNEL, payload),
  onNativeNotificationClick: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: NativeNotificationClickPayload
    ) => {
      callback(payload);
    };

    ipcRenderer.on(NOTIFICATION_CLICKED_CHANNEL, listener);

    return () => {
      ipcRenderer.removeListener(NOTIFICATION_CLICKED_CHANNEL, listener);
    };
  },
  onNativeNotificationReply: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: NativeNotificationReplyPayload
    ) => {
      callback(payload);
    };

    ipcRenderer.on(NOTIFICATION_REPLIED_CHANNEL, listener);

    return () => {
      ipcRenderer.removeListener(NOTIFICATION_REPLIED_CHANNEL, listener);
    };
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);