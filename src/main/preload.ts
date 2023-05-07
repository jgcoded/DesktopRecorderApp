// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IpcApi, RendererIpcCommands } from '../common/IpcApi';

const ipcApi: IpcApi = {
  getWindowSize: () => ipcRenderer.invoke(RendererIpcCommands.GetWindowSize),
  setWindowSize: (width, height) =>
    ipcRenderer.invoke(RendererIpcCommands.SetWindowSize, width, height),
  GetPrimaryDisplayWorkArea: () =>
    ipcRenderer.invoke(RendererIpcCommands.GetPrimaryDisplayWorkArea),
  SetWindowPosition: (x, y) =>
    ipcRenderer.invoke(RendererIpcCommands.SetWindowPosition, x, y),
  SetWindowShape: (shapes) =>
    ipcRenderer.invoke(RendererIpcCommands.SetWindowShape, shapes),
  RegisterGlobalHotkey: (hotkey) =>
    ipcRenderer.invoke(RendererIpcCommands.RegisterGlobalHotkey, hotkey),
  UnregisterAllGlobalHotkeys: () =>
    ipcRenderer.invoke(RendererIpcCommands.UnregisterAllGlobalHotkeys),
  GetFolderPath: (path) =>
    ipcRenderer.invoke(RendererIpcCommands.GetFolderPath, path),
  GetLocale: () => ipcRenderer.invoke(RendererIpcCommands.GetLocale),
  SetAlwaysOnTop: (flag) =>
    ipcRenderer.invoke(RendererIpcCommands.SetWindowAlwaysOnTop, flag),
  HideWindow: () => ipcRenderer.invoke(RendererIpcCommands.HideWindow),
  ShowWindow: () => ipcRenderer.invoke(RendererIpcCommands.ShowWindow),
  CloseWindow: () => ipcRenderer.invoke(RendererIpcCommands.CloseWindow),
  OpenExternalApp: (url) =>
    ipcRenderer.invoke(RendererIpcCommands.OpenExternalApp, url),
  ShowItemInFolder: (filePath) =>
    ipcRenderer.invoke(RendererIpcCommands.ShowItemInFolder, filePath),
  LaunchAndGetRecordableDevices: () =>
    ipcRenderer.invoke(RendererIpcCommands.LaunchAndGetRecordableDevices),
  LaunchAndStartRecording: (settings) =>
    ipcRenderer.invoke(RendererIpcCommands.LaunchAndStartRecording, settings),
  LaunchAndGetFileSharingToken: (filePath) =>
    ipcRenderer.invoke(
      RendererIpcCommands.LaunchAndGetFileSharingToken,
      filePath
    ),
  StopRecording: () => ipcRenderer.invoke(RendererIpcCommands.StopRecording),
  JoinPath: (paths) => ipcRenderer.invoke(RendererIpcCommands.JoinPath, paths),
  GetFileStats: (filePath) =>
    ipcRenderer.invoke(RendererIpcCommands.GetFileStats, filePath),
  on: (channel, func) => {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      func(...args);
    ipcRenderer.on(channel, subscription);

    return () => ipcRenderer.removeListener(channel, subscription);
  },
  once: (channel, func) =>
    ipcRenderer.once(channel, (_event, ...args) => func(...args)),
  off: (channel, func) => ipcRenderer.off(channel, func),
};

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcApi,
});
