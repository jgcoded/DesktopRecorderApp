/* eslint-disable no-undef */
/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */

import { RecordableDevices } from 'common/RecordableDevices';
import RecordingSettings from 'common/RecordingSettings';

export enum RendererIpcCommands {
  GetWindowSize = 'get-window-size',
  SetWindowSize = 'set-window-size',
  SetWindowPosition = 'set-window-position',
  SetWindowShape = 'set-window-shape',
  GetPrimaryDisplayWorkArea = 'get-primary-display-workarea',
  RegisterGlobalHotkey = 'register-global-hotkey',
  UnregisterAllGlobalHotkeys = 'unregister-all-global-hotkeys',
  OnGlobalHotkey = 'on-global-hotkey',
  GetFolderPath = 'get-folder-path',
  GetLocale = 'get-locale',
  SetWindowAlwaysOnTop = 'set-window-always-on-top',
  HideWindow = 'hide-window',
  ShowWindow = 'show-window',
  CloseWindow = 'close-window',
  OpenExternalApp = 'open-external-app',
  ShowItemInFolder = 'show-item-in-folder',
  LaunchAndGetRecordableDevices = 'launch-and-get-recordable-devices',
  LaunchAndStartRecording = 'launch-and-start-recording',
  LaunchAndGetFileSharingToken = 'launch-and-get-filesharing-token',
  StopRecording = 'send-stop-recording',
  JoinPath = 'join-path',
  GetFileStats = 'get-file-stats',
}

export enum IpcEventsFromMain {
  ScaleChanged = 'scale-changed',
  DisplaysChanged = 'displays-changed',
  DisplaysModified = 'displays-modified',
  OnGlobalHotkey = 'on-global-hotkey',
  OnRecordingChildProcessExit = 'on-recording-child-process-exit',
}

export interface IpcApi {
  getWindowSize: () => Promise<number[]>;
  setWindowSize: (width: number, height: number) => Promise<void>;
  GetPrimaryDisplayWorkArea: () => Promise<Electron.Rectangle>;
  SetWindowPosition: (x: number, y: number) => Promise<void>;
  SetWindowShape: (shapes: Electron.Rectangle[]) => Promise<void>;
  RegisterGlobalHotkey: (hotkey: Electron.Accelerator) => Promise<boolean>;
  UnregisterAllGlobalHotkeys: () => Promise<void>;
  GetFolderPath: (path: 'videos') => Promise<string>;
  GetLocale: () => Promise<string>;
  SetAlwaysOnTop: (flag: boolean) => Promise<void>;
  HideWindow: () => Promise<void>;
  ShowWindow: () => Promise<void>;
  CloseWindow: () => Promise<void>;
  OpenExternalApp: (url: string) => Promise<void>;
  ShowItemInFolder: (filePath: string) => Promise<void>;
  LaunchAndGetRecordableDevices: () => Promise<RecordableDevices>;
  LaunchAndStartRecording: (settings: RecordingSettings) => Promise<void>;
  LaunchAndGetFileSharingToken: (filePath: string) => Promise<string>;
  StopRecording: () => Promise<void>;
  JoinPath: (paths: string[]) => Promise<string>;
  GetFileStats: (filePath: string) => Promise<any>;
  on: (
    channel: IpcEventsFromMain,
    func: (...args: unknown[]) => void
  ) => () => void;
  once: (
    channel: IpcEventsFromMain,
    func: (...args: unknown[]) => void
  ) => void;
  off: (channel: IpcEventsFromMain, func: (...args: unknown[]) => void) => void;
}
