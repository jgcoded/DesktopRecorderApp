import { VideoSettings } from 'common/VideoSettings';
import { EventEmitter } from 'events';
import RecordingSettings from 'common/RecordingSettings';
import { ResolutionOption } from 'common/ResolutionOption';
import { BitrateOption } from 'common/BitrateOption';
import ConfigService from 'common/ConfigService';
import { BitrateSetting } from 'common/BitrateSetting';
import { IpcEventsFromMain } from 'common/IpcApi';

type RecordingStateChangeCallback = (
  // eslint-disable-next-line no-unused-vars
  isRecording: boolean,
  // eslint-disable-next-line no-unused-vars
  error?: Error
) => void;

export default class RecordingService {
  // eslint-disable-next-line no-use-before-define
  static recordingService: RecordingService;

  eventEmitter: EventEmitter;

  isVideoServiceActiveAndRecording: boolean;

  mostRecentFileName: string;

  mostRecentFilePath: string;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.isVideoServiceActiveAndRecording = false;
    this.mostRecentFileName = '';
    this.mostRecentFilePath = '';
    this.cleanupAfterRecording = this.cleanupAfterRecording.bind(this);
    this.onRecordingChildProcessExit =
      this.onRecordingChildProcessExit.bind(this);
  }

  public static getInstance(): RecordingService {
    if (!this.recordingService) {
      this.recordingService = new RecordingService();
    }

    return this.recordingService;
  }

  public async toggleRecording(videoSettings: VideoSettings) {
    if (this.isRecording()) {
      await this.stopRecording();
    } else {
      await this.startRecording(videoSettings);
    }
  }

  public async startRecording(videoSettings: VideoSettings) {
    if (this.isRecording()) {
      throw new Error('Already recording');
    }

    const videosFolder: string =
      await window.electron.ipcRenderer.GetFolderPath('videos');
    this.mostRecentFileName = await RecordingService.GenerateFileName();
    this.mostRecentFilePath = await window.electron.ipcRenderer.JoinPath([
      videosFolder,
      this.mostRecentFileName,
    ]);

    const recordingSettings: RecordingSettings = {
      filename: this.mostRecentFilePath,
      bitrate: RecordingService.DetermineBitRate(
        videoSettings.resolutionOption,
        videoSettings.bitrateOption,
        videoSettings.framerate
      ),
      ...videoSettings,
    };

    window.electron.ipcRenderer.once(
      IpcEventsFromMain.OnRecordingChildProcessExit,
      this.onRecordingChildProcessExit
    );
    await window.electron.ipcRenderer.LaunchAndStartRecording(
      recordingSettings
    );
    this.isVideoServiceActiveAndRecording = true;
    this.emitEvent('recording-state-changed', this.isRecording());
  }

  public async stopRecording() {
    if (!this.isRecording()) {
      throw new Error('Currently not recording');
    }

    await window.electron.ipcRenderer.StopRecording();
  }

  private cleanupAfterRecording() {
    window.electron.ipcRenderer.off(
      IpcEventsFromMain.OnRecordingChildProcessExit,
      this.onRecordingChildProcessExit
    );
    this.isVideoServiceActiveAndRecording = false;
  }

  private onRecordingChildProcessExit(
    unknownCode?: number | unknown,
    // eslint-disable-next-line no-undef
    unknownSignal?: NodeJS.Signals | unknown
  ) {
    const code = (unknownCode ?? 0) as number;
    const signal = (unknownSignal ?? '') as string;
    if (!this.isRecording()) {
      return;
    }

    this.cleanupAfterRecording();

    // The child exited cleanly
    if (code === 0) {
      this.emitEvent('recording-state-changed', this.isRecording());
    } else {
      // either one of code or signal will be non-null
      const error = new Error(
        `recording error: code: 0x${code?.toString(16)} signal: ${signal}`
      );
      this.emitEvent('recording-state-changed', this.isRecording(), error);
    }
  }

  public isRecording(): boolean {
    return this.isVideoServiceActiveAndRecording;
  }

  public getMostRecentFileName(): string {
    return this.mostRecentFileName;
  }

  public getMostRecentFilePath(): string {
    return this.mostRecentFilePath;
  }

  public on(
    event: 'recording-state-changed',
    callback: RecordingStateChangeCallback
  ) {
    this.eventEmitter.on(event, callback);
  }

  public off(
    event: 'recording-state-changed',
    callback: RecordingStateChangeCallback
  ) {
    this.eventEmitter.off(event, callback);
  }

  private emitEvent(
    event: 'recording-state-changed',
    isRecording: boolean,
    error?: Error
  ) {
    this.eventEmitter.emit(event, isRecording, error);
  }

  private static async GenerateFileName(): Promise<string> {
    const locale: string = await window.electron.ipcRenderer.GetLocale();
    const timeString: string = new Date()
      .toLocaleTimeString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '-')
      .replace(/\\/g, '-')
      .replace(/:/g, '-')
      .replace(/,/g, '');

    return `${timeString}.mp4`;
  }

  // eslint-disable-next-line class-methods-use-this
  private static DetermineBitRate(
    resolutionOption: ResolutionOption,
    bitrateOption: BitrateOption,
    framerate: number
  ): number {
    // determine bit rate from resolution option, bitrate option, and framerate
    const bitrateSettings: BitrateSetting[] =
      ConfigService.getBitrateSettings();

    let bitrate: number = 0;
    let bestMatchCount: number = 0;

    bitrateSettings.forEach((bitrateSetting) => {
      let matchCount = 0;
      matchCount +=
        bitrateSetting.resolutionOption === resolutionOption ? 1 : 0;
      matchCount += bitrateSetting.bitrateOption === bitrateOption ? 1 : 0;
      // only consider framerate if both resolution option and bitrate option had matched
      // to avoid issues with selecting auto bitrate
      matchCount +=
        matchCount === 2 && bitrateSetting.framerate === framerate ? 1 : 0;

      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount;
        bitrate = bitrateSetting.bitrate;
      }
    });

    return bitrate;
  }
}
