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
import sharp from "sharp";
import { registerAuthIpc } from "./auth-ipc";
import {
  NOTIFICATION_BADGE_UPDATE_CHANNEL,
  NOTIFICATION_CLICKED_CHANNEL,
  NOTIFICATION_REPLIED_CHANNEL,
  NOTIFICATION_SHOW_CHANNEL,
  type NativeNotificationBadgePayload,
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
const TASKBAR_BADGE_BACKGROUND = "#4CC2FF";
const TASKBAR_BADGE_TEXT = "#000000";
const activeNotifications = new Set<Notification>();
const taskbarBadgeIconCache = new Map<number, Electron.NativeImage>();
let currentTaskbarBadgeCount = 0;
let taskbarBadgeUpdateId = 0;

app.setName(APP_NAME);

if (process.platform === "win32") {
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

function getBufferFromDataUrl(dataUrl: string): Buffer | null {
  const commaIndex = dataUrl.indexOf(",");

  if (commaIndex === -1) {
    return null;
  }

  const metadata = dataUrl.slice(0, commaIndex).toLowerCase();
  const data = dataUrl.slice(commaIndex + 1);

  return metadata.includes(";base64")
    ? Buffer.from(data, "base64")
    : Buffer.from(decodeURIComponent(data), "utf8");
}

async function createCircularAvatarIcon(
  avatarDataUrl: string
): Promise<Electron.NativeImage | null> {
  const size = 256;
  const inputBuffer = getBufferFromDataUrl(avatarDataUrl);

  if (!inputBuffer) {
    return null;
  }

  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>`
  );

  const pngBuffer = await sharp(inputBuffer)
    .resize(size, size, { fit: "cover", position: "center" })
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const image = nativeImage.createFromBuffer(pngBuffer);

  return image.isEmpty() ? null : image;
}

async function resolveNotificationIcon(
  avatarDataUrl?: string
): Promise<Electron.NativeImage | string | undefined> {
  if (avatarDataUrl?.startsWith("data:image/")) {
    try {
      const image = await createCircularAvatarIcon(avatarDataUrl);

      if (image) {
        return image;
      }
    } catch {
      // fall through to app icon
    }
  }
  return getAppIconPath();
}

function getTaskbarBadgeLabel(count: number): string {
  return String(Math.max(0, Math.floor(count)));
}

function getTaskbarBadgeFontSize(label: string): number {
  if (label.length <= 1) {
    return 42;
  }

  if (label.length === 2) {
    return 34;
  }

  if (label.length === 3) {
    return 27;
  }

  if (label.length === 4) {
    return 21;
  }

  return Math.max(12, 78 / label.length);
}

function createTaskbarBadgeSvg(count: number): string {
  const label = getTaskbarBadgeLabel(count);
  const fontSize = getTaskbarBadgeFontSize(label);
  const fitAttributes =
    label.length > 2
      ? ' textLength="53" lengthAdjust="spacingAndGlyphs"'
      : "";

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">',
    `<rect x="2" y="6" width="60" height="52" rx="26" fill="${TASKBAR_BADGE_BACKGROUND}"/>`,
    `<text x="32" y="34" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI, Arial, sans-serif" font-size="${fontSize}" font-weight="700" font-variant-numeric="tabular-nums" fill="${TASKBAR_BADGE_TEXT}"${fitAttributes}>${label}</text>`,
    "</svg>",
  ].join("");
}

async function createTaskbarBadgePng(
  count: number,
  size: number
): Promise<Buffer> {
  return sharp(Buffer.from(createTaskbarBadgeSvg(count)))
    .resize(size, size, { fit: "fill" })
    .png()
    .toBuffer();
}

async function createTaskbarBadgeIcon(
  count: number
): Promise<Electron.NativeImage | null> {
  const cachedIcon = taskbarBadgeIconCache.get(count);

  if (cachedIcon) {
    return cachedIcon;
  }

  const [standardPng, highDpiPng] = await Promise.all([
    createTaskbarBadgePng(count, 16),
    createTaskbarBadgePng(count, 32),
  ]);
  const icon = nativeImage.createFromBuffer(standardPng);

  icon.addRepresentation({
    scaleFactor: 2,
    dataURL: `data:image/png;base64,${highDpiPng.toString("base64")}`,
  });

  if (icon.isEmpty()) {
    return null;
  }

  taskbarBadgeIconCache.set(count, icon);
  return icon;
}

async function updateTaskbarBadge(count: number): Promise<void> {
  const normalizedCount = Number.isFinite(count)
    ? Math.max(0, Math.floor(count))
    : 0;
  currentTaskbarBadgeCount = normalizedCount;
  const updateId = ++taskbarBadgeUpdateId;

  if (process.platform !== "win32") {
    return;
  }

  const overlay =
    normalizedCount > 0
      ? await createTaskbarBadgeIcon(normalizedCount)
      : null;

  if (updateId !== taskbarBadgeUpdateId) {
    return;
  }

  const description =
    normalizedCount > 0
      ? `${normalizedCount} unread message${normalizedCount === 1 ? "" : "s"}`
      : "No unread messages";

  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.setOverlayIcon(overlay, description);
    }
  }
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
    NOTIFICATION_BADGE_UPDATE_CHANNEL,
    async (_event, payload: NativeNotificationBadgePayload) => {
      await updateTaskbarBadge(payload?.count ?? 0);
      return true;
    }
  );

  ipcMain.handle(
    NOTIFICATION_SHOW_CHANNEL,
    async (event, payload: NativeNotificationPayload) => {
      if (!Notification.isSupported() || !payload?.title?.trim()) {
        return false;
      }

      const window = getWindowFromSender(event);
      const icon = await resolveNotificationIcon(payload.avatarDataUrl);

      const notification = new Notification({
        title: payload.title,
        body: payload.body,
        id: payload.id ?? payload.messageId ?? payload.tag,
        icon,
        silent: payload.silent,
        hasReply: true,
        replyPlaceholder: "Write a reply...",
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

      notification.on("reply", (details, reply) => {
        const replyText = String(details.reply ?? reply ?? "").trim();

        if (!replyText) {
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
  const appIconPath = getAppIconPath();
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: "Yahla",
    frame: false,
    transparent: false,
    backgroundColor: "#161717",
    autoHideMenuBar: true,
    ...(appIconPath ? { icon: appIconPath } : {}),
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
    void updateTaskbarBadge(currentTaskbarBadgeCount);
  });
  mainWindow.on("show", () => {
    void updateTaskbarBadge(currentTaskbarBadgeCount);
  });
  mainWindow.on("restore", () => {
    void updateTaskbarBadge(currentTaskbarBadgeCount);
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
