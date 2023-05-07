import * as React from 'react';
import './RecordingPanel.scss';
import SVG from 'react-inlinesvg';

import MutedSvgPath from '../../../../assets/muted.svg';
import MicrophoneSvgPath from '../../../../assets/microphone.svg';
import ScreenshotSVGPath from '../../../../assets/screenshot.svg';
import StartRecordingSVGPath from '../../../../assets/startrecording.svg';
import StopRecordingSVGPath from '../../../../assets/stoprecording.svg';
import DisplaySVGPath from '../../../../assets/display.svg';
import EllipsesSVGPath from '../../../../assets/ellipsis.svg';

interface RecordingProps {
  isRecording: boolean;
  isRecordingBlocked: boolean;
  isMuted: boolean;
  onMicrophoneButtonClicked: () => void;
  onRecordingButtonClicked: () => void;
  onSettingsButtonClicked: () => void;
  onDisplayButtonClicked: () => void;
}

export default class RecordingPanel extends React.Component<RecordingProps> {
  private static async onScreenshotButtonClicked() {
    await window.electron.ipcRenderer.HideWindow();
    await window.electron.ipcRenderer.OpenExternalApp('ms-screenclip:snip');

    setTimeout(async () => {
      await window.electron.ipcRenderer.ShowWindow();
    }, 60);
  }

  render() {
    const {
      isMuted,
      isRecording,
      isRecordingBlocked,
      onMicrophoneButtonClicked,
      onRecordingButtonClicked,
      onDisplayButtonClicked,
      onSettingsButtonClicked,
    } = this.props;
    return (
      <div className="recording-panel">
        <button
          type="button"
          className="svg-button"
          title="Microphone"
          onClick={onMicrophoneButtonClicked}
        >
          <span hidden={isMuted}>
            <SVG
              className="svg-button"
              src={MicrophoneSvgPath}
              title="Select Microphone to Record"
            />
          </span>

          <span hidden={!isMuted}>
            <SVG
              className="svg-button"
              src={MutedSvgPath}
              title="No Microphone Selected - Muted"
            />
          </span>
          <div className="display-text">⏷</div>
        </button>
        <button
          type="button"
          className="svg-button"
          title="Screenshot"
          onClick={RecordingPanel.onScreenshotButtonClicked}
        >
          <SVG src={ScreenshotSVGPath} />
        </button>
        <button
          type="button"
          className="svg-button"
          disabled={isRecordingBlocked}
          onClick={onRecordingButtonClicked}
        >
          <span hidden={!isRecording}>
            <SVG
              className="recording-button-svg"
              title="Stop Recording"
              src={StopRecordingSVGPath}
            />
          </span>
          <span hidden={isRecording}>
            <SVG
              className="recording-button-svg"
              title="Start Recording"
              src={StartRecordingSVGPath}
            />
          </span>
        </button>
        <button
          type="submit"
          className="svg-button"
          onClick={onDisplayButtonClicked}
        >
          <SVG src={DisplaySVGPath} title="Select Display to Record" />
          <div className="display-text">⏷</div>
        </button>
        <button
          type="submit"
          onClick={onSettingsButtonClicked}
          className="svg-button"
          title="Settings"
        >
          <SVG src={EllipsesSVGPath} />
        </button>
      </div>
    );
  }
}
