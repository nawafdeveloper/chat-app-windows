import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Notification,
  nativeImage,
  shell,
} from "electron";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { registerAuthIpc } from "./auth-ipc";
import {
  NOTIFICATION_CLICKED_CHANNEL,
  NOTIFICATION_REPLIED_CHANNEL,
  NOTIFICATION_SHOW_CHANNEL,
  type NativeNotificationPayload,
} from "../shared/notification-ipc";
import {
  WINDOW_CLOSE_CHANNEL,
  WINDOW_IS_MAXIMIZED_CHANNEL,
  WINDOW_MAXIMIZED_CHANGE_CHANNEL,
  WINDOW_MINIMIZE_CHANNEL,
  WINDOW_TOGGLE_MAXIMIZE_CHANNEL,
} from "../shared/window-ipc";

const isDev = !app.isPackaged;
const APP_NAME = "Yahla";
const APP_USER_MODEL_ID = "com.yahla.windows";
const activeNotifications = new Set<Notification>();

app.setName(APP_NAME);

function shouldUseWindowsAppUserModelId(): boolean {
  if (process.platform !== "win32" || !app.isPackaged) {
    return false;
  }

  const executablePath = process.execPath.toLowerCase();
  return (
    !process.env.PORTABLE_EXECUTABLE_FILE &&
    !executablePath.includes("\\temp\\") &&
    !executablePath.includes("\\release\\win-unpacked\\")
  );
}

if (shouldUseWindowsAppUserModelId()) {
  app.setAppUserModelId(APP_USER_MODEL_ID);
}

function getAppIconPath(): string | undefined {
  const candidates = [
    join(process.resourcesPath, "build/icon.ico"),
    join(process.cwd(), "build/icon.ico"),
    join(__dirname, "../../build/icon.ico"),
    join(__dirname, "../renderer/icon-512x512.png"),
    join(__dirname, "../renderer/icon-192x192.png"),
    join(process.cwd(), "src/renderer/public/icon-512x512.png"),
    join(process.cwd(), "src/renderer/public/icon-192x192.png"),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function getWindowFromSender(
  event: Electron.IpcMainInvokeEvent
): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

function makeCircularIcon(image: Electron.NativeImage): Electron.NativeImage {
  const size = 64;
  const { width, height } = image.getSize();

  // Resize to square first
  const resized = image.resize({
    width: size,
    height: size,
    quality: "best",
  });

  const pixels = resized.toBitmap(); // raw BGRA buffer

  // Paint pixels outside the circle as transparent
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - size / 2;
      const dy = y - size / 2;
      const isOutside = dx * dx + dy * dy > (size / 2) * (size / 2);

      if (isOutside) {
        const idx = (y * size + x) * 4;
        pixels[idx] = 0;       // B
        pixels[idx + 1] = 0;   // G
        pixels[idx + 2] = 0;   // R
        pixels[idx + 3] = 0;   // A (transparent)
      }
    }
  }

  // suppress unused variable warning
  void width;
  void height;

  return nativeImage.createFromBitmap(pixels, { width: size, height: size });
}

function resolveNotificationIcon(
  avatarDataUrl?: string
): Electron.NativeImage | string | undefined {
  if (avatarDataUrl?.startsWith("data:image/")) {
    try {
      const image = nativeImage.createFromDataURL(avatarDataUrl);
      return makeCircularIcon(image);
    } catch {
      // fall through to app icon
    }
  }
  return getAppIconPath();
}

function registerWindowIpc(): void {
  ipcMain.handle(WINDOW_MINIMIZE_CHANNEL, (event) => {
    getWindowFromSender(event)?.minimize();
  });

  ipcMain.handle(WINDOW_TOGGLE_MAXIMIZE_CHANNEL, (event) => {
    const window = getWindowFromSender(event);

    if (!window) {
      return false;
    }

    if (window.isMaximized()) {
      window.unmaximize();
      return false;
    }

    window.maximize();
    return true;
  });

  ipcMain.handle(WINDOW_CLOSE_CHANNEL, (event) => {
    getWindowFromSender(event)?.close();
  });

  ipcMain.handle(WINDOW_IS_MAXIMIZED_CHANNEL, (event) => {
    return getWindowFromSender(event)?.isMaximized() ?? false;
  });
}

function registerNotificationIpc(): void {
  ipcMain.handle(
    NOTIFICATION_SHOW_CHANNEL,
    (event, payload: NativeNotificationPayload) => {
      if (!Notification.isSupported() || !payload?.title?.trim()) {
        return false;
      }

      const window = getWindowFromSender(event);
      const icon = resolveNotificationIcon(payload.avatarDataUrl);

      const notification = new Notification({
        title: payload.title,
        body: payload.body,
        id: payload.id ?? payload.messageId ?? payload.tag,
        icon,
        silent: payload.silent,
        actions: [
          {
            type: "button" as Electron.NotificationAction["type"],
            text: "Reply…",
          },
        ],
        replyPlaceholder: "Write a reply…",
      });

      const cleanupNotification = (): void => {
        activeNotifications.delete(notification);
      };

      activeNotifications.add(notification);
      notification.on("close", cleanupNotification);
      notification.on("failed", cleanupNotification);

      notification.on("click", () => {
        cleanupNotification();

        if (window && !window.isDestroyed()) {
          if (window.isMinimized()) {
            window.restore();
          }

          window.show();
          window.focus();
          window.webContents.send(NOTIFICATION_CLICKED_CHANNEL, {
            conversationId: payload.conversationId,
            conversationType: payload.conversationType,
            messageId: payload.messageId,
            unreadCount: payload.unreadCount,
          });
        }
      });

      notification.on("action", (_event, index, value) => {
        const replyText = String(value ?? "").trim();

        if (index !== 0 || !replyText) {
          return;
        }

        cleanupNotification();

        if (window && !window.isDestroyed()) {
          window.webContents.send(NOTIFICATION_REPLIED_CHANNEL, {
            conversationId: payload.conversationId,
            conversationType: payload.conversationType,
            messageId: payload.messageId,
            unreadCount: payload.unreadCount,
            replyText,
          });
        }
      });

      notification.show();
      return true;
    }
  );
}

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: "Yahla",
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.removeMenu();
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const sendMaximizedState = (): void => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        WINDOW_MAXIMIZED_CHANGE_CHANNEL,
        mainWindow.isMaximized()
      );
    }
  };

  mainWindow.on("maximize", sendMaximizedState);
  mainWindow.on("unmaximize", sendMaximizedState);
  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
    sendMaximizedState();
  });
  mainWindow.webContents.once("did-finish-load", sendMaximizedState);

  const rendererUrl = process.env.ELECTRON_RENDERER_URL;

  if (isDev && rendererUrl) {
    mainWindow.loadURL(rendererUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }

  mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerAuthIpc();
  registerWindowIpc();
  registerNotificationIpc();

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});