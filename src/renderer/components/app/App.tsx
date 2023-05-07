/* eslint-disable react/sort-comp */
import * as React from 'react';
import RecordingPanel from 'renderer/components/recordingpanel/RecordingPanel';
import './App.scss';
import { AppSettings } from 'common/AppSettings';
import SettingsStorage from 'common/SettingsStorage';
import {
  Monitor,
  RecordableDevices,
  IsSupportedMonitor,
  Microphone,
} from 'common/RecordableDevices';
import RecordingService from 'renderer/ipc/RecordingService';
import { VideoSettings } from 'common/VideoSettings';
import NotificationService from 'common/NotificationService';
import TelemetryService from 'common/TelemetryService';
import AppWindow from 'renderer/ipc/AppWindow';
import { DisplaySelectionPanel } from 'renderer/components/displayselectionpanel/DisplaySelectionPanel';
import SVG from 'react-inlinesvg';
import HotKeyService from 'renderer/ipc/HotKeyService';
import { ResolutionOption } from 'common/ResolutionOption';
import { BitrateOption } from 'common/BitrateOption';
import { SettingsPanel } from 'renderer/components/settingspanel/SettingsPanel';
import ConfigService from 'common/ConfigService';
import { MonitorRotation } from 'common/MonitorRotation';
import { VideoPreviewPanel } from 'renderer/components/videopreviewpanel/VideoPreviewPanel';
import { MicrophoneSelectionPanel } from 'renderer/components/microphoneselectionpanel/MicrophoneSelectionPanel';
import { IpcEventsFromMain } from 'common/IpcApi';
import XFigureSVGPath from '../../../../assets/x.svg';

interface AppProps {}

interface AppState extends AppSettings {
  isRecording: boolean;
  isRecordingBlocked: boolean;
  recordableDevices: RecordableDevices;
  isSettingsPanelShown: boolean;
  isDisplayPanelShown: boolean;
  isVideoPreviewPanelShown: boolean;
  isMicrophonePanelShown: boolean;
}

class App extends React.Component<AppProps, AppState> {
  readonly RecordingStateChangeDelay: number = 3000;

  lastToggleTime: number;

  offDisplaysChanged: () => void;

  offScaleChanged: () => void;

  offDiplaysModified: () => void;

  constructor(props: AppProps) {
    super(props);
    this.onAppSettingsChanged = this.onAppSettingsChanged.bind(this);
    this.onAppSettingChanging = this.onAppSettingChanging.bind(this);
    this.onAppSettingBlur = this.onAppSettingBlur.bind(this);
    this.applySettings = this.applySettings.bind(this);
    this.applyHotKeySetting = this.applyHotKeySetting.bind(this);
    this.onRecordableDevicesChanged =
      this.onRecordableDevicesChanged.bind(this);
    this.onHotKeyPressed = this.onHotKeyPressed.bind(this);
    this.toggleRecording = this.toggleRecording.bind(this);
    this.toggleSettingsPanel = this.toggleSettingsPanel.bind(this);
    this.toggleDisplaySelectionPanel =
      this.toggleDisplaySelectionPanel.bind(this);
    this.toggleMicrophoneSelectionPanel =
      this.toggleMicrophoneSelectionPanel.bind(this);
    this.showVideoPreviewPanel = this.showVideoPreviewPanel.bind(this);
    this.onRecordingStateChanged = this.onRecordingStateChanged.bind(this);
    this.onResetSettingsClicked = this.onResetSettingsClicked.bind(this);
    this.onDisplaySelected = this.onDisplaySelected.bind(this);
    this.onMicrophoneSelected = this.onMicrophoneSelected.bind(this);
    this.onCloseButtonClicked = this.onCloseButtonClicked.bind(this);
    this.offDiplaysModified = () => {};
    this.offDisplaysChanged = () => {};
    this.offScaleChanged = () => {};
    const settings: AppSettings = SettingsStorage.getSettings();
    this.state = {
      ...settings,
      recordableDevices: { monitors: [], microphones: [] },
      isRecording: false,
      isRecordingBlocked: true,
      isSettingsPanelShown: false,
      isDisplayPanelShown: false,
      isMicrophonePanelShown: false,
      isVideoPreviewPanelShown: false,
    };
    this.lastToggleTime = 0;
  }

  public render(): React.ReactNode {
    const {
      isSettingsPanelShown,
      isDisplayPanelShown,
      recordableDevices,
      monitor,
      isRecording,
      isMicrophonePanelShown,
      audioEndpoint,
      isVideoPreviewPanelShown,
      isMuted,
      isRecordingBlocked,
    } = this.state;

    return (
      <div>
        {isSettingsPanelShown && (
          <div className="settings-panel-container">
            <SettingsPanel
              appSettings={this.state}
              onAppSettingBlur={this.onAppSettingBlur}
              onAppSettingChanging={this.onAppSettingChanging}
              onAppSettingsChanged={this.onAppSettingsChanged}
              onResetClicked={this.onResetSettingsClicked}
            />
          </div>
        )}
        {isDisplayPanelShown && (
          <div className="display-selection-panel-container">
            <DisplaySelectionPanel
              displays={recordableDevices.monitors}
              currentDisplay={monitor}
              onDisplaySelected={this.onDisplaySelected}
              selectionDisabled={isRecording}
            />
          </div>
        )}
        {isMicrophonePanelShown && (
          <div className="microphone-selection-panel-container">
            <MicrophoneSelectionPanel
              microphones={recordableDevices.microphones}
              currentMicrophoneEndpoint={audioEndpoint}
              onMicrophoneSelected={this.onMicrophoneSelected}
              selectionDisabled={isRecording}
            />
          </div>
        )}
        {isVideoPreviewPanelShown && (
          <div className="video-preview-panel-container">
            <VideoPreviewPanel />
          </div>
        )}
        <div className="recording-panel-container">
          <RecordingPanel
            isMuted={isMuted}
            isRecording={isRecording}
            isRecordingBlocked={isRecordingBlocked}
            onMicrophoneButtonClicked={this.toggleMicrophoneSelectionPanel}
            onRecordingButtonClicked={this.toggleRecording}
            onSettingsButtonClicked={this.toggleSettingsPanel}
            onDisplayButtonClicked={this.toggleDisplaySelectionPanel}
          />
          <button
            type="button"
            className="close-button svg-button"
            onClick={this.onCloseButtonClicked}
            title="Close Desktop Recorder"
          >
            <SVG src={XFigureSVGPath} />
          </button>
        </div>
      </div>
    );
  }

  async componentDidMount() {
    this.onAppSettingsChanged(this.state);

    RecordingService.getInstance().on(
      'recording-state-changed',
      this.onRecordingStateChanged
    );
    this.offDisplaysChanged = window.electron.ipcRenderer.on(
      IpcEventsFromMain.DisplaysChanged,
      this.onRecordableDevicesChanged
    );
    this.offScaleChanged = window.electron.ipcRenderer.on(
      IpcEventsFromMain.ScaleChanged,
      this.onRecordableDevicesChanged
    );
    this.offDiplaysModified = window.electron.ipcRenderer.on(
      IpcEventsFromMain.DisplaysModified,
      this.onRecordableDevicesChanged
    );
    navigator.mediaDevices.ondevicechange = this.onRecordableDevicesChanged;
    window.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    this.onRecordableDevicesChanged();

    await AppWindow.updateToInitialMainWindowSize();
  }

  async componentWillUnmount() {
    const { isRecording } = this.state;
    if (isRecording) {
      await RecordingService.getInstance().stopRecording();
    }

    HotKeyService.UnregisterAllGlobalHotKeys();
    RecordingService.getInstance().off(
      'recording-state-changed',
      this.onRecordingStateChanged
    );
    this.offDiplaysModified();
    this.offDisplaysChanged();
    this.offScaleChanged();
    navigator.mediaDevices.ondevicechange = null;
  }

  private async onCloseButtonClicked(): Promise<void> {
    const { isRecording } = this.state;
    if (isRecording) {
      return;
    }
    await window.electron.ipcRenderer.CloseWindow();
  }

  private onDisplaySelected(display: Monitor) {
    this.onAppSettingsChanged({ monitor: display.index });
  }

  private onMicrophoneSelected(microphone: Microphone) {
    const { audioEndpoint } = this.state;
    const isDeselect: boolean = microphone.endpoint === audioEndpoint;
    const newEndpoint = isDeselect ? '' : microphone.endpoint;
    const isMuted = isDeselect;
    this.onAppSettingsChanged({
      audioEndpoint: newEndpoint,
      isMuted,
    });
  }

  private toggleDisplaySelectionPanel() {
    const {
      isSettingsPanelShown,
      isVideoPreviewPanelShown,
      isMicrophonePanelShown,
      isDisplayPanelShown,
    } = this.state;
    const showDisplayPanel = !isDisplayPanelShown;
    this.setState(
      {
        isDisplayPanelShown: showDisplayPanel,
        isSettingsPanelShown: showDisplayPanel ? false : isSettingsPanelShown,
        isVideoPreviewPanelShown: showDisplayPanel
          ? false
          : isVideoPreviewPanelShown,
        isMicrophonePanelShown: showDisplayPanel
          ? false
          : isMicrophonePanelShown,
      },
      async () => {
        await AppWindow.updateMainWindowSize();
      }
    );
  }

  private toggleMicrophoneSelectionPanel() {
    const {
      isSettingsPanelShown,
      isVideoPreviewPanelShown,
      isMicrophonePanelShown,
      isDisplayPanelShown,
    } = this.state;
    const showMicrophonePanel = !isMicrophonePanelShown;
    this.setState(
      {
        isMicrophonePanelShown: showMicrophonePanel,
        isSettingsPanelShown: showMicrophonePanel
          ? false
          : isSettingsPanelShown,
        isVideoPreviewPanelShown: showMicrophonePanel
          ? false
          : isVideoPreviewPanelShown,
        isDisplayPanelShown: showMicrophonePanel ? false : isDisplayPanelShown,
      },
      async () => {
        await AppWindow.updateMainWindowSize();
      }
    );
  }

  private toggleSettingsPanel() {
    const {
      isSettingsPanelShown,
      isVideoPreviewPanelShown,
      isMicrophonePanelShown,
      isDisplayPanelShown,
    } = this.state;
    const showSettingsPanel = !isSettingsPanelShown;
    this.setState(
      {
        isSettingsPanelShown: showSettingsPanel,
        isDisplayPanelShown: showSettingsPanel ? false : isDisplayPanelShown,
        isVideoPreviewPanelShown: showSettingsPanel
          ? false
          : isVideoPreviewPanelShown,
        isMicrophonePanelShown: showSettingsPanel
          ? false
          : isMicrophonePanelShown,
      },
      async () => {
        await AppWindow.updateMainWindowSize();
      }
    );
  }

  private showVideoPreviewPanel() {
    this.setState(
      {
        isVideoPreviewPanelShown: true,
        isDisplayPanelShown: false,
        isSettingsPanelShown: false,
        isMicrophonePanelShown: false,
      },
      async () => {
        await AppWindow.updateMainWindowSize();
      }
    );
  }

  private onResetSettingsClicked() {
    const { recordableDevices } = this.state;
    const defaultSettings = SettingsStorage.getDefaultSettings();
    defaultSettings.audioEndpoint =
      recordableDevices.microphones[0]?.endpoint || '';
    this.onAppSettingsChanged(defaultSettings);
  }

  onRecordableDevicesChanged() {
    this.setState({ isRecordingBlocked: true }, async () => {
      await window.electron.ipcRenderer
        .LaunchAndGetRecordableDevices()
        // eslint-disable-next-line promise/always-return
        .then((recordableDevices: RecordableDevices) => {
          this.setState(
            (state) => {
              const newState: Partial<AppState> = {
                recordableDevices,
                isRecordingBlocked: false,
              };

              // if the current monitor is no longer supported
              let supportedMonitorFound =
                state.monitor >= 0 &&
                state.monitor < recordableDevices.monitors.length &&
                IsSupportedMonitor(recordableDevices.monitors[state.monitor]);
              if (!supportedMonitorFound) {
                newState.monitor = -1;
                // eslint-disable-next-line no-plusplus
                for (let i = 0; i < recordableDevices.monitors.length; ++i) {
                  if (IsSupportedMonitor(recordableDevices.monitors[i])) {
                    newState.monitor = i;
                    supportedMonitorFound = true;
                  }
                }
              }

              const { isVideoPreviewPanelShown, audioEndpoint } = this.state;

              // If we didn't find a supported monitor, or if we changed the selected
              // monitor for the user, show the display panel to let the user know
              // but we also want to show the user how awesome we are that even though
              // the monitor rotation caused an issue their recording is saved, so
              // keep the preview panel showing
              if (!isVideoPreviewPanelShown) {
                if (
                  !supportedMonitorFound ||
                  (newState.monitor != null &&
                    newState.monitor !== state.monitor)
                ) {
                  // TODO make it so that in the future when new panels are added don't need to update here
                  newState.isDisplayPanelShown = true;
                  newState.isSettingsPanelShown = false;
                  newState.isVideoPreviewPanelShown = false;
                  newState.isMicrophonePanelShown = false;
                }
              }

              if (!supportedMonitorFound) {
                newState.isRecordingBlocked = true;
              }

              if (state.isMuted) {
                newState.audioEndpoint = '';
              } else {
                const isMicrophoneStillAvailable =
                  recordableDevices.microphones.find(
                    (m) => m.endpoint === state.audioEndpoint
                  );
                if (audioEndpoint === '' || !isMicrophoneStillAvailable) {
                  newState.audioEndpoint =
                    recordableDevices.microphones[0]?.endpoint || '';
                  newState.isMuted = newState.audioEndpoint === '';
                }
              }

              return newState;
            },
            async () => {
              SettingsStorage.storeSettings(this.state);
              await AppWindow.updateMainWindowSize();
            }
          );
        });
    });
  }

  private onRecordingStateChanged(isRecording: boolean, error?: Error) {
    this.setState(
      { isRecording, isVideoPreviewPanelShown: false },
      async () => {
        // The video preview panel may have been shown previously so update window
        await AppWindow.updateMainWindowSize();
        setTimeout(
          () => this.setState({ isRecordingBlocked: false }),
          this.RecordingStateChangeDelay
        );

        const {
          monitor,
          resolutionOption,
          bitrateOption,
          isMuted,
          framerate,
          recordableDevices,
          notifyRecordingStarted,
          recordingHotkey,
        } = this.state;

        if (isRecording) {
          TelemetryService.startTrackEvent('recording-video');
          if (notifyRecordingStarted) {
            NotificationService.notify(
              document.title,
              `Recording Started. Press ${recordingHotkey} to stop recording.`
            );
          }
        } else {
          const selectedMonitor =
            monitor < recordableDevices.monitors.length
              ? recordableDevices.monitors[monitor]
              : null;

          TelemetryService.stopTrackEvent('recording-video', {
            hasError: (error !== undefined).toString(),
            message: error?.message || '',
            name: error?.name || '',
            stacktrace: error?.stack || '',
            resolution: ResolutionOption[resolutionOption],
            bitRate: BitrateOption[bitrateOption],
            frameRate: framerate.toString(),
            recordAudio: (!isMuted).toString(),
            monitorWidth: (selectedMonitor == null
              ? 0
              : selectedMonitor.right - selectedMonitor.left
            ).toString(),
            monitorHeight: (selectedMonitor == null
              ? 0
              : selectedMonitor.bottom - selectedMonitor.top
            ).toString(),
            monitorRotation:
              selectedMonitor == null
                ? ''
                : MonitorRotation[selectedMonitor.rotation],
            adapter: selectedMonitor?.adapter || '',
            monitorCount: recordableDevices.monitors.length.toString(),
            microphoneCount: recordableDevices.microphones.length.toString(),
          });

          if (error) {
            TelemetryService.trackException(error);
            NotificationService.notify(
              document.title,
              'Recording Stopped. Sorry, something may be wrong.'
            );
          }

          this.showVideoPreviewPanel();

          await window.electron.ipcRenderer.ShowWindow();
        }
      }
    );
  }

  toggleRecording() {
    const {
      isRecording,
      hideAppWhenRecording,
      isRecordingBlocked,
      framerate,
      monitor,
      resolutionOption,
      audioQuality,
      bitrateOption,
      isMuted,
      audioEndpoint,
    } = this.state;
    if (
      isRecordingBlocked ||
      Date.now() - this.lastToggleTime <= this.RecordingStateChangeDelay
    ) {
      return;
    }

    this.lastToggleTime = Date.now();
    this.setState({ isRecordingBlocked: true }, async () => {
      if (!isRecording && hideAppWhenRecording) {
        await window.electron.ipcRenderer.HideWindow();
      }

      try {
        const defaultSetting = ConfigService.getDefaultAppSettings();
        const videoSettings: VideoSettings = {
          framerate: framerate ?? defaultSetting.framerate,
          monitor: monitor ?? defaultSetting.monitor,
          resolutionOption: resolutionOption ?? defaultSetting.resolutionOption,
          audioQuality: audioQuality ?? defaultSetting.audioQuality,
          bitrateOption: bitrateOption ?? defaultSetting.bitrateOption,
          audioEndpoint: isMuted ? '' : audioEndpoint,
        };

        await RecordingService.getInstance().toggleRecording(videoSettings);
      } catch (error: any) {
        TelemetryService.trackException(error);
      }
    });
  }

  onHotKeyPressed() {
    this.toggleRecording();
  }

  onAppSettingChanging(settingName: keyof AppSettings) {
    if (settingName === 'recordingHotkey') {
      this.setState({ isRecordingBlocked: true });
    }
  }

  onAppSettingBlur(settingName: keyof AppSettings) {
    if (settingName === 'recordingHotkey') {
      this.setState({ isRecordingBlocked: false });
    }
  }

  onAppSettingsChanged(changedSettings: Partial<AppSettings>) {
    this.setState(
      (prevState: AppState) => {
        return this.applySettings(changedSettings, prevState);
      },
      () => {
        SettingsStorage.storeSettings(this.state);
      }
    );
  }

  applySettings(settings: Partial<AppSettings>, oldSettings?: AppSettings) {
    if (settings.alwaysOnTop !== undefined) {
      window.electron.ipcRenderer.SetAlwaysOnTop(settings.alwaysOnTop);
    }

    if (settings.recordingHotkey) {
      const backupHotkey =
        oldSettings?.recordingHotkey ||
        SettingsStorage.getDefaultSettings().recordingHotkey;

      this.applyHotKeySetting(settings.recordingHotkey)
        .then((hotKeyApplied) => {
          if (!hotKeyApplied) {
            return this.applyHotKeySetting(backupHotkey);
          }
          return hotKeyApplied;
        })
        .then((backupApplied) => {
          if (!backupApplied) {
            this.setState({ recordingHotkey: '' });
          }
          return backupApplied;
        })
        .catch(() => {});
    }

    if (settings.telemetryEnabled !== undefined) {
      TelemetryService.setTelemetryEnabled(settings.telemetryEnabled);
    }

    return settings;
  }

  // eslint-disable-next-line no-undef
  async applyHotKeySetting(hotkey: Electron.Accelerator): Promise<boolean> {
    await HotKeyService.UnregisterAllGlobalHotKeys();
    return HotKeyService.RegisterGlobalHotKey(hotkey, this.onHotKeyPressed);
  }
}

const { telemetryEnabled } = SettingsStorage.getSettings();
export default TelemetryService.initializeWithReactComponent(
  App,
  telemetryEnabled
);
