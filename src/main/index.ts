import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Notification,
  nativeImage,
  shell,
} from "electron";
import { createCanvas, type Canvas } from "@napi-rs/canvas";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
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
const PACKAGED_APP_IDENTITY_NAME = "YaHla.YaHla";
const PACKAGED_APP_APPLICATION_ID = "YaHla";
const NATIVE_BADGE_UPDATE_TIMEOUT_MS = 5000;
const TASKBAR_BADGE_BACKGROUND = "#4CC2FF";
const TASKBAR_BADGE_TEXT = "#000000";
const TASKBAR_BADGE_BASE_SIZE = 16;
const TASKBAR_BADGE_RENDER_SCALE = 5;
const TASKBAR_BADGE_REPRESENTATIONS = [
  { scaleFactor: 1, size: TASKBAR_BADGE_BASE_SIZE },
  { scaleFactor: 1.25, size: 20 },
  { scaleFactor: 1.5, size: 24 },
  { scaleFactor: 2, size: 32 },
  { scaleFactor: 2.5, size: 40 },
  { scaleFactor: 3, size: 48 },
  { scaleFactor: 4, size: 64 },
  { scaleFactor: 5, size: 80 },
  { scaleFactor: 6, size: 96 },
  { scaleFactor: 8, size: 128 },
  { scaleFactor: 16, size: 256 },
] as const;
const activeNotifications = new Set<Notification>();
const taskbarBadgeIconCache = new Map<string, Electron.NativeImage>();
const execFileAsync = promisify(execFile);
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
  const normalizedCount = Math.max(0, Math.floor(count));

  return normalizedCount > 99 ? "+99" : String(normalizedCount);
}

function getTaskbarBadgeFontSize(label: string): number {
  if (label.length <= 1) {
    return 42;
  }

  if (label.length === 2) {
    return 31;
  }

  return 22;
}

function getWindowsPowerShellPath(): string {
  const systemRoot = process.env.SystemRoot ?? "C:\\Windows";

  return join(
    systemRoot,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe"
  );
}

function getPowerShellString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function hasWindowsPackageIdentity(): boolean {
  return (
    process.platform === "win32" &&
    (process as NodeJS.Process & { windowsStore?: boolean }).windowsStore ===
      true
  );
}

function getNativeWindowsBadgeScript(count: number): string {
  const explicitAppUserModelIds = [APP_USER_MODEL_ID].map(getPowerShellString);
  const packagedAppIdPattern = getPowerShellString(
    `${PACKAGED_APP_IDENTITY_NAME}_*!${PACKAGED_APP_APPLICATION_ID}`
  );
  const packagedAppName = getPowerShellString(APP_NAME);

  return `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.UI.Notifications.BadgeUpdateManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.UI.Notifications.BadgeTemplateType, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.UI.Notifications.BadgeNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null

$badgeCount = ${count}
$explicitAppUserModelIds = @(${explicitAppUserModelIds.join(", ")})
$appUserModelIds = New-Object System.Collections.Generic.List[string]
$errors = New-Object System.Collections.Generic.List[string]

function Add-YahlaBadgeCandidate([string]$appUserModelId) {
  if ([string]::IsNullOrWhiteSpace($appUserModelId)) {
    return
  }

  if (-not $appUserModelIds.Contains($appUserModelId)) {
    $appUserModelIds.Add($appUserModelId) | Out-Null
  }
}

function Update-YahlaNativeBadge($updater) {
  if ($badgeCount -le 0) {
    $updater.Clear()
    return
  }

  $badgeXml = [Windows.UI.Notifications.BadgeUpdateManager]::GetTemplateContent([Windows.UI.Notifications.BadgeTemplateType]::BadgeNumber)
  $badgeElement = $badgeXml.SelectSingleNode('/badge')
  $badgeElement.SetAttribute('value', [string]$badgeCount)
  $badgeNotification = [Windows.UI.Notifications.BadgeNotification]::new($badgeXml)
  $updater.Update($badgeNotification)
}

try {
  Get-StartApps |
    Where-Object {
      $_.AppID -like ${packagedAppIdPattern} -or
      $_.Name -eq ${packagedAppName} -or
      $_.AppID -in $explicitAppUserModelIds
    } |
    Sort-Object @{ Expression = { if ($_.AppID -like ${packagedAppIdPattern}) { 0 } elseif ($_.Name -eq ${packagedAppName}) { 1 } else { 2 } } }, Name |
    ForEach-Object { Add-YahlaBadgeCandidate $_.AppID }
} catch {
  $errors.Add("Start app discovery: $($_.Exception.Message)") | Out-Null
}

foreach ($appUserModelId in $explicitAppUserModelIds) {
  Add-YahlaBadgeCandidate $appUserModelId
}

try {
  $updater = [Windows.UI.Notifications.BadgeUpdateManager]::CreateBadgeUpdaterForApplication()
  Update-YahlaNativeBadge $updater
  exit 0
} catch {
  $errors.Add("packaged identity: $($_.Exception.Message)") | Out-Null
}

foreach ($appUserModelId in $appUserModelIds) {
  try {
    $updater = [Windows.UI.Notifications.BadgeUpdateManager]::CreateBadgeUpdaterForApplication($appUserModelId)
    Update-YahlaNativeBadge $updater
    exit 0
  } catch {
    $errors.Add(($appUserModelId + ": " + $_.Exception.Message)) | Out-Null
  }
}

throw "Native Windows badge update failed. $($errors -join '; ')"
`.trim();
}

async function updateNativeWindowsBadge(count: number): Promise<boolean> {
  if (process.platform !== "win32") {
    return false;
  }

  const script = getNativeWindowsBadgeScript(count);
  const encodedScript = Buffer.from(script, "utf16le").toString("base64");

  try {
    await execFileAsync(
      getWindowsPowerShellPath(),
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        encodedScript,
      ],
      {
        timeout: NATIVE_BADGE_UPDATE_TIMEOUT_MS,
        windowsHide: true,
      }
    );
    return true;
  } catch (error) {
    console.warn("Native Windows taskbar badge update failed.", error);
    return false;
  }
}

function drawTaskbarBadgeToCanvas(
  count: number,
  pixelSize: number
): Canvas {
  const label = getTaskbarBadgeLabel(count);
  const canvas = createCanvas(pixelSize, pixelSize);
  const context = canvas.getContext("2d");
  const scale = pixelSize / 64;
  const badgeX = 0.75 * scale;
  const badgeY = 7 * scale;
  const badgeWidth = 62.5 * scale;
  const badgeHeight = 50 * scale;
  const badgeRadius = 25 * scale;
  const textMaxWidth = (label.length > 2 ? 47 : 50) * scale;
  let fontSize = getTaskbarBadgeFontSize(label) * scale;

  context.clearRect(0, 0, pixelSize, pixelSize);
  context.fillStyle = TASKBAR_BADGE_BACKGROUND;
  context.beginPath();
  context.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeRadius);
  context.fill();

  context.fillStyle = TASKBAR_BADGE_TEXT;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.textRendering = "optimizeLegibility";
  context.fontKerning = "normal";

  do {
    context.font = `800 ${fontSize}px "Segoe UI Variable Text", "Segoe UI", Arial, sans-serif`;
    fontSize -= 0.5 * scale;
  } while (
    context.measureText(label).width > textMaxWidth &&
    fontSize > 12 * scale
  );

  context.fillText(label, 32 * scale, 34 * scale);

  return canvas;
}

async function createTaskbarBadgePng(
  count: number,
  size: number
): Promise<Buffer> {
  const renderSize = size * TASKBAR_BADGE_RENDER_SCALE;
  const sourceCanvas = drawTaskbarBadgeToCanvas(count, renderSize);

  if (renderSize === size) {
    return sourceCanvas.toBuffer("image/png");
  }

  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceCanvas, 0, 0, size, size);

  return canvas.toBuffer("image/png");
}

async function createTaskbarBadgeIcon(
  count: number
): Promise<Electron.NativeImage | null> {
  const cacheKey = getTaskbarBadgeLabel(count);
  const cachedIcon = taskbarBadgeIconCache.get(cacheKey);

  if (cachedIcon) {
    return cachedIcon;
  }

  const badgeRepresentations = await Promise.all(
    TASKBAR_BADGE_REPRESENTATIONS.map(async ({ scaleFactor, size }) => ({
      scaleFactor,
      png: await createTaskbarBadgePng(count, size),
    }))
  );
  const icon = nativeImage.createEmpty();

  for (const { scaleFactor, png } of badgeRepresentations) {
    icon.addRepresentation({
      scaleFactor,
      dataURL: `data:image/png;base64,${png.toString("base64")}`,
    });
  }

  if (icon.isEmpty()) {
    return null;
  }

  taskbarBadgeIconCache.set(cacheKey, icon);
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

  const description =
    normalizedCount > 0
      ? `${normalizedCount} unread message${normalizedCount === 1 ? "" : "s"}`
      : "No unread messages";
  const nativeBadgeUpdated = await updateNativeWindowsBadge(normalizedCount);

  if (updateId !== taskbarBadgeUpdateId) {
    return;
  }

  if (nativeBadgeUpdated && hasWindowsPackageIdentity()) {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) {
        window.setOverlayIcon(null, description);
      }
    }
    return;
  }

  const overlay =
    normalizedCount > 0
      ? await createTaskbarBadgeIcon(normalizedCount)
      : null;

  if (updateId !== taskbarBadgeUpdateId) {
    return;
  }

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
