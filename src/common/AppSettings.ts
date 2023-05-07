import { VideoSettings } from 'common/VideoSettings';

export interface AppSettings extends VideoSettings {
  [key: string]: any;
  notifyRecordingStarted: boolean;
  hideAppWhenRecording: boolean;
  alwaysOnTop: boolean;
  telemetryEnabled: boolean;
  // eslint-disable-next-line no-undef
  recordingHotkey: Electron.Accelerator;
  isMuted: boolean;
}
