/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-undef */
import * as React from 'react';
import './SettingsPanel.scss';
import { BitrateOption } from 'common/BitrateOption';
import { ResolutionOption } from '../../../common/ResolutionOption';
import { AppSettings } from '../../../common/AppSettings';
import { HotKeyInput } from '../hotkeyinput/HotKeyInput';
import ConfigService from '../../../common/ConfigService';
import { AudioQuality } from '../../../common/AudioQuality';

export interface SettingsProps {
  appSettings: AppSettings;
  // eslint-disable-next-line no-unused-vars
  onAppSettingChanging: (settingName: keyof AppSettings) => void;
  // eslint-disable-next-line no-unused-vars
  onAppSettingsChanged: (changedSettings: Partial<AppSettings>) => void;
  // eslint-disable-next-line no-unused-vars
  onAppSettingBlur: (settingName: keyof AppSettings) => void;
  onResetClicked: () => void;
}

export class SettingsPanel extends React.Component<SettingsProps> {
  private static enumToOptions(enumObject: any): JSX.Element[] {
    return Object.keys(enumObject)
      .map((key) => Number.parseInt(key, 10))
      .filter((key) => Number.isInteger(key))
      .map((key) => (
        <option key={key} value={key}>
          {enumObject[key]}
        </option>
      ));
  }

  private static async openPrivacyPolicyPage() {
    await window.electron.ipcRenderer.OpenExternalApp(
      ConfigService.getPrivacyPolicyURL()
    );
  }

  constructor(props: SettingsProps) {
    super(props);
    this.onHtmlElementChange = this.onHtmlElementChange.bind(this);
    this.onHtmlElementFocus = this.onHtmlElementFocus.bind(this);
    this.onHtmlElementBlur = this.onHtmlElementBlur.bind(this);
    this.onHotkeySet = this.onHotkeySet.bind(this);
  }

  private onHtmlElementChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const settingName: string = event.target.name;
    const { value } = event.target;

    if (!settingName || settingName === '') {
      throw Error('setting name is empty');
    }

    const newState: Partial<AppSettings> = {};
    const { appSettings, onAppSettingsChanged } = this.props;

    switch (typeof appSettings[settingName]) {
      case 'number':
        newState[settingName] = Number.parseInt(value, 10);
        break;
      case 'boolean':
        newState[settingName] = !appSettings[settingName];
        break;
      default:
        newState[settingName] = value;
        break;
    }

    onAppSettingsChanged(newState);
  }

  private onHtmlElementFocus(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const settingName: string = event.target.name;
    // eslint-disable-next-line react/destructuring-assignment
    this.props.onAppSettingChanging(settingName);
  }

  private onHtmlElementBlur(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const settingName: string = event.target.name;
    // eslint-disable-next-line react/destructuring-assignment
    this.props.onAppSettingBlur(settingName);
  }

  private onHotkeySet(hotkey: Electron.Accelerator) {
    // eslint-disable-next-line react/destructuring-assignment
    this.props.onAppSettingsChanged({ recordingHotkey: hotkey });
  }

  render() {
    const resolutionOptions: JSX.Element[] =
      SettingsPanel.enumToOptions(ResolutionOption);
    const bitrateOptions: JSX.Element[] =
      SettingsPanel.enumToOptions(BitrateOption);
    const audioQualities: JSX.Element[] =
      SettingsPanel.enumToOptions(AudioQuality);
    const { appSettings, onResetClicked } = this.props;
    return (
      <div className="settings-panel">
        <h3>Settings</h3>
        <label
          title="The resolution of the video file"
          className="setting-item-container"
        >
          Resolution
          <select
            name="resolutionOption"
            value={appSettings.resolutionOption}
            onChange={this.onHtmlElementChange}
          >
            {resolutionOptions}
          </select>
        </label>
        <label
          title="Determines video quality - A higher bitrate will make the video file size larger"
          className="setting-item-container"
        >
          Video Bitrate
          <select
            name="bitrateOption"
            value={appSettings.bitrateOption}
            onChange={this.onHtmlElementChange}
          >
            {bitrateOptions}
          </select>
        </label>
        <label
          title="Determines audio quality"
          className="setting-item-container"
        >
          Audio Quality
          <select
            name="audioQuality"
            value={appSettings.audioQuality}
            onChange={this.onHtmlElementChange}
          >
            {audioQualities}
          </select>
        </label>
        <label
          title="Click on the box and press a key combination to set a new hotkey. Not all combinations are supported."
          className="setting-item-container"
        >
          Hotkey
          <HotKeyInput
            name="recordingHotkey"
            onHotkeySet={this.onHotkeySet}
            onFocus={this.onHtmlElementFocus}
            onBlur={this.onHtmlElementBlur}
            hotKey={appSettings.recordingHotkey}
          />
        </label>
        <div className="setting-item-container">
          Frame Rate
          <div className="radio-button-group">
            <label>
              <input
                title="Video will be recorded at 30 frames per second"
                name="framerate"
                type="radio"
                value="30"
                checked={appSettings.framerate === 30}
                onChange={this.onHtmlElementChange}
              />
              30 fps
            </label>
            <label>
              <input
                title="Video will be recorded at 60 frame per second"
                name="framerate"
                type="radio"
                value="60"
                checked={appSettings.framerate === 60}
                onChange={this.onHtmlElementChange}
              />
              60 fps
            </label>
          </div>
        </div>
        {(appSettings.framerate === 60 ||
          appSettings.resolutionOption === ResolutionOption.Uhd4320p ||
          appSettings.bitrateOption === BitrateOption.High) && (
          <div className="warning">
            Warning - the settings you have chosen require a powerful computer
            and may not be suitable for all users.
          </div>
        )}
        <hr />
        <label>
          <input
            name="notifyRecordingStarted"
            type="checkbox"
            checked={appSettings.notifyRecordingStarted}
            onChange={this.onHtmlElementChange}
            title="Display a notifcation when the video recording starts"
          />
          Always notify when recording starts
        </label>
        <label>
          <input
            name="hideAppWhenRecording"
            type="checkbox"
            checked={appSettings.hideAppWhenRecording}
            onChange={this.onHtmlElementChange}
            title="Hide the app when recording"
          />
          Hide app when recording
        </label>
        <label>
          <input
            name="alwaysOnTop"
            type="checkbox"
            checked={appSettings.alwaysOnTop}
            onChange={this.onHtmlElementChange}
            title="Keep the app always on top of other windows"
          />
          App always on top
        </label>
        <label>
          <input
            name="telemetryEnabled"
            type="checkbox"
            checked={appSettings.telemetryEnabled}
            onChange={this.onHtmlElementChange}
            title="Help improve the app by providing anonymized usage data"
          />
          Upload usage and crash data
        </label>
        <hr />
        <p className="rate-app-text">
          Enjoying the app? Rate it ⭐⭐⭐⭐⭐ on the &nbsp;
          <a href={ConfigService.getRateAppURL()}>Microsoft Store!</a>
        </p>
        <hr />
        <div>
          <button
            type="submit"
            className="button settings-button"
            title="Reset to default settings"
            onClick={onResetClicked}
          >
            ⭮ Reset
          </button>

          <span className="extra-links">
            <a
              title="Privacy Policy"
              href="#"
              onClick={SettingsPanel.openPrivacyPolicyPage}
            >
              Privacy Policy
            </a>
            <a
              title="Ask for help from the person that made the app"
              href={ConfigService.getDeveloperContactURL()}
            >
              Contact Support
            </a>
          </span>
        </div>
      </div>
    );
  }
}
