import { app, BrowserWindow, ipcMain, Menu, shell } from "electron";
import { join } from "node:path";
import { registerAuthIpc } from "./auth-ipc";
import {
  WINDOW_CLOSE_CHANNEL,
  WINDOW_IS_MAXIMIZED_CHANNEL,
  WINDOW_MAXIMIZED_CHANGE_CHANNEL,
  WINDOW_MINIMIZE_CHANNEL,
  WINDOW_TOGGLE_MAXIMIZE_CHANNEL,
} from "../shared/window-ipc";

const isDev = !app.isPackaged;

function getWindowFromSender(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
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
