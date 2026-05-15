import React from 'react';
import SVG from 'react-inlinesvg';
import ConfigService from 'common/ConfigService';
import TelemetryService from 'common/TelemetryService';
import RecordingService from 'renderer/ipc/RecordingService';
import FolderOpenSVGPath from '../../../../assets/folder-open-solid.svg';
import EditSVGPath from '../../../../assets/edit-solid.svg';
import './VideoPreviewPanel.scss';

export interface VideoPreviewPanelProps {}

export interface VideoPreviewPanelState {
  filePath: string;
  fileSharingToken: string;
  metadataString: string;
  videoLoadAttempts: number;
}

const VideoLoadAttemptsWarningThreshold: number = 7;
const VideoLoadAttemptIntervalMs: number = 5000;

export class VideoPreviewPanel extends React.Component<
  VideoPreviewPanelProps,
  VideoPreviewPanelState
> {
  constructor(props: VideoPreviewPanelProps) {
    super(props);
    this.state = {
      filePath: '',
      fileSharingToken: '',
      metadataString: 'Loading Video...',
      videoLoadAttempts: 0,
    };
    this.launchWindowsPhotoApp = this.launchWindowsPhotoApp.bind(this);
    this.revealInExplorer = this.revealInExplorer.bind(this);
    this.onVideoMetadataLoaded = this.onVideoMetadataLoaded.bind(this);
    this.onVideoLoadError = this.onVideoLoadError.bind(this);
  }

  componentDidMount() {
    TelemetryService.startTrackEvent('loading-video');
    const filePath = RecordingService.getInstance().getMostRecentFilePath();
    this.setState({ filePath, videoLoadAttempts: 0 }, () => {
      const video = document.getElementById('video-preview') as any;
      video.load();
    });
  }

  onVideoLoadError() {
    const video = document.getElementById('video-preview') as any;
    this.setState(
      (prev) => ({ videoLoadAttempts: prev.videoLoadAttempts + 1 }),
      () => {
        setTimeout(() => {
          const { filePath } = this.state;
          video.src = filePath;
          video.load();
        }, VideoLoadAttemptIntervalMs);
      },
    );
  }

  async onVideoMetadataLoaded() {
    const video = document.getElementById('video-preview') as any;
    const { filePath, videoLoadAttempts } = this.state;

    window.electron.ipcRenderer
      .LaunchAndGetFileSharingToken(filePath)
      .then((token) => {
        this.setState({ fileSharingToken: token });
        return token;
      })
      .catch((error: Error) => {
        TelemetryService.trackException(error);
      });

    const stats = await window.electron.ipcRenderer.GetFileStats(filePath);

    if (stats) {
      const resolutionString = `${video.videoWidth}x${video.videoHeight}`;
      const fileSizeString = `${Math.floor((stats.size / 1024 / 1024) * 100) / 100}MB`;
      const metadataString = `${resolutionString} ${fileSizeString}`;
      this.setState({ metadataString, videoLoadAttempts: 0 }, () => {
        TelemetryService.stopTrackEvent('loading-video', {
          attempts: videoLoadAttempts.toString(),
          duration: video.duration.toString(),
          fileSize: stats.size.toString(),
        });
      });
    }
  }

  async launchWindowsPhotoApp() {
    // https://docs.microsoft.com/en-us/windows/uwp/launch-resume/launch-default-app#photos-app-uri-scheme
    TelemetryService.startTrackEvent('launch-photos');
    const { fileSharingToken } = this.state;
    const photosAppUri =
      ConfigService.getWindowsPhotoProtocolLauncherURLFormat().replace(
        '{0}',
        fileSharingToken,
      );
    await window.electron.ipcRenderer
      .OpenExternalApp(photosAppUri)
      .then(() => {
        TelemetryService.stopTrackEvent('launch-photos');
        return undefined;
      })
      .catch((error: Error) => {
        TelemetryService.trackException(error);
      });
  }

  async revealInExplorer() {
    const { filePath } = this.state;
    await window.electron.ipcRenderer.ShowItemInFolder(filePath);
  }

  render() {
    const { videoLoadAttempts, metadataString, fileSharingToken, filePath } =
      this.state;

    return (
      <div className="video-preview-panel">
        {videoLoadAttempts >= VideoLoadAttemptsWarningThreshold ? (
          <h3 className="error-text">Sorry, something may be wrong.</h3>
        ) : (
          <h3>Preview</h3>
        )}
        {videoLoadAttempts >= VideoLoadAttemptsWarningThreshold && (
          <p>
            The video is not loading. Please try restarting your computer, or
            &nbsp;
            <a
              title="Ask for help from the person that made the app"
              href={ConfigService.getDeveloperContactURL()}
            >
              contact support
            </a>
            .
          </p>
        )}
        <div className="info-container">
          <p className="details">{metadataString}</p>
          <div>
            <button
              type="button"
              className="svg-button"
              onClick={this.revealInExplorer}
            >
              <SVG src={FolderOpenSVGPath} title="Reveal in File Explorer" />
            </button>

            <button
              type="button"
              className="svg-button"
              disabled={fileSharingToken.length === 0}
              onClick={this.launchWindowsPhotoApp}
            >
              <SVG src={EditSVGPath} title="Edit Video with Windows Photo" />
            </button>
          </div>
        </div>

        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          id="video-preview"
          controls
          preload="metadata"
          onError={this.onVideoLoadError}
          onLoadedMetadata={this.onVideoMetadataLoaded}
          controlsList="nofullscreen"
          src={filePath}
        />
      </div>
    );
  }
}
