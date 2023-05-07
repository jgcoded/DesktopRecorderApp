/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app,
  BrowserWindow,
  screen,
  shell,
  ipcMain,
  globalShortcut,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { statSync } from 'fs';
import RecordingSettings from 'common/RecordingSettings';
import { RendererIpcCommands, IpcEventsFromMain } from '../common/IpcApi';
import { resolveHtmlPath } from './util';
import RecordingChildProcess from './RecordingChildProcess';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let recordingChildProcess: RecordingChildProcess | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

function getCurrentDisplay(window: BrowserWindow) {
  const curPos = window.getPosition();
  return screen.getDisplayNearestPoint({
    x: curPos[0] + window.getSize()[0] / 2,
    y: curPos[1],
  });
}

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 0,
    height: 0,
    frame: false,
    transparent: true,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    x: 0,
    y: 0,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  let previousScale = getCurrentDisplay(mainWindow).scaleFactor;
  console.log('current display scale factor', previousScale);
  mainWindow.on('move', () => {
    const display = getCurrentDisplay(mainWindow!);
    if (display.scaleFactor !== previousScale) {
      console.log('emitting scale-changed');
      mainWindow?.webContents.send(IpcEventsFromMain.ScaleChanged);
      previousScale = display.scaleFactor;
    }
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    screen.on('display-added', () => {
      mainWindow?.webContents.send(IpcEventsFromMain.DisplaysModified);
    });

    screen.on('display-removed', () => {
      mainWindow?.webContents.send(IpcEventsFromMain.DisplaysModified);
    });

    screen.on('display-metrics-changed', () => {
      mainWindow?.webContents.send(IpcEventsFromMain.DisplaysModified);
    });

    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

ipcMain.handle(RendererIpcCommands.GetWindowSize, async () => {
  return mainWindow?.getSize();
});

ipcMain.handle(RendererIpcCommands.SetWindowSize, (_event, width, height) => {
  mainWindow?.setSize(width, height);
});

ipcMain.handle(RendererIpcCommands.GetPrimaryDisplayWorkArea, () => {
  return screen.getPrimaryDisplay().workArea;
});

ipcMain.handle(RendererIpcCommands.SetWindowPosition, (_event, x, y) => {
  mainWindow?.setPosition(x, y);
});

ipcMain.handle(RendererIpcCommands.SetWindowShape, (_event, shapes) => {
  mainWindow?.setShape(shapes);
});

ipcMain.handle(RendererIpcCommands.RegisterGlobalHotkey, (_event, hotkey) => {
  return globalShortcut.register(hotkey, () => {
    mainWindow?.webContents.send(RendererIpcCommands.OnGlobalHotkey, hotkey);
  });
});

ipcMain.handle(RendererIpcCommands.UnregisterAllGlobalHotkeys, () => {
  globalShortcut.unregisterAll();
});

ipcMain.handle(RendererIpcCommands.GetFolderPath, (_event, name) => {
  return app.getPath(name);
});

ipcMain.handle(RendererIpcCommands.GetLocale, () => {
  return app.getLocale();
});

ipcMain.handle(RendererIpcCommands.SetWindowAlwaysOnTop, (_event, value) => {
  mainWindow?.setAlwaysOnTop(value);
});

ipcMain.handle(RendererIpcCommands.HideWindow, () => {
  mainWindow?.hide();
});

ipcMain.handle(RendererIpcCommands.ShowWindow, () => {
  mainWindow?.show();
});

ipcMain.handle(RendererIpcCommands.CloseWindow, () => {
  mainWindow?.close();
});

ipcMain.handle(RendererIpcCommands.OpenExternalApp, async (_event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle(RendererIpcCommands.ShowItemInFolder, (_event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle(RendererIpcCommands.LaunchAndGetRecordableDevices, async () => {
  return RecordingChildProcess.LaunchAndGetRecordableDevices();
});

ipcMain.handle(
  RendererIpcCommands.LaunchAndStartRecording,
  async (_event, settings: RecordingSettings) => {
    console.log('sending start recording', settings);

    recordingChildProcess = await RecordingChildProcess.LaunchAndStartRecording(
      settings
    );
    recordingChildProcess.once('exit', async (code, signal) => {
      console.log('recording child exit', code, signal);
      recordingChildProcess = null;
      mainWindow?.webContents.send(
        IpcEventsFromMain.OnRecordingChildProcessExit,
        code,
        signal
      );
    });
  }
);

ipcMain.handle(RendererIpcCommands.StopRecording, async () => {
  console.log('sending stop recording');
  await recordingChildProcess?.SendStopRecording();
});

ipcMain.handle(RendererIpcCommands.JoinPath, (_event, paths: string[]) => {
  console.log('joining paths: ', paths);
  return path.join(...paths);
});

ipcMain.handle(RendererIpcCommands.GetFileStats, (_event, filePath: string) => {
  return statSync(filePath);
});
