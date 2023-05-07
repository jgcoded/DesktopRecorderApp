import React from "react";
import RecordingService from "renderer/ipc/RecordingService";
//import { RecordingChildProcess } from "main/RecordingChildProcess";
import SVG from 'react-inlinesvg'

import FolderOpenSVGPath from '../../../../assets/folder-open-solid.svg';
import EditSVGPath from '../../../../assets/edit-solid.svg';
import './VideoPreviewPanel.scss';
import ConfigService from "common/ConfigService";
import TelemetryService from "common/TelemetryService";

export interface VideoPreviewPanelProps {
}

export interface VideoPreviewPanelState {
    filePath: string;
    fileSharingToken: string;
    metadataString: string;
    videoLoadAttempts: number;
}

const VideoLoadAttemptsWarningThreshold: number = 7;
const VideoLoadAttemptIntervalMs: number = 5000;

export class VideoPreviewPanel extends React.Component<VideoPreviewPanelProps, VideoPreviewPanelState> {
    constructor(props: VideoPreviewPanelProps) {
        super(props);
        this.state = {
            filePath: '',
            fileSharingToken: '',
            metadataString: 'Loading Video...',
            videoLoadAttempts: 0
        };
        this.launchWindowsPhotoApp = this.launchWindowsPhotoApp.bind(this);
        this.revealInExplorer = this.revealInExplorer.bind(this);
        this.onVideoMetadataLoaded = this.onVideoMetadataLoaded.bind(this);
        this.onVideoLoadError = this.onVideoLoadError.bind(this);
    }

    async launchWindowsPhotoApp() {
        //https://docs.microsoft.com/en-us/windows/uwp/launch-resume/launch-default-app#photos-app-uri-scheme
        TelemetryService.startTrackEvent('launch-photos');
        let photosAppUri = ConfigService.getWindowsPhotoProtocolLauncherURLFormat()
            .replace('{0}', this.state.fileSharingToken);
            await window.electron.ipcRenderer.OpenExternalApp(photosAppUri).then(() => {
            TelemetryService.stopTrackEvent('launch-photos');
        })
        .catch((error: Error) => {
            TelemetryService.trackException(error);
        });
    }

    async revealInExplorer() {
        await window.electron.ipcRenderer.ShowItemInFolder(this.state.filePath);
    }

    componentDidMount() {
        TelemetryService.startTrackEvent('loading-video');
        let filePath = RecordingService.getInstance().getMostRecentFilePath();
        this.setState({ filePath: filePath, videoLoadAttempts: 0 }, () => {
            let video = document.getElementById('video-preview') as any;
            video.load();
        });
    }

    onVideoLoadError() {
        let video = document.getElementById('video-preview') as any;
        this.setState({ videoLoadAttempts: this.state.videoLoadAttempts + 1 }, () => {
            setTimeout(() => {
                video.src = this.state.filePath;
                video.load();
            }, VideoLoadAttemptIntervalMs);
        })
    }

    async onVideoMetadataLoaded() {
        let video = document.getElementById('video-preview') as any;

        window.electron.ipcRenderer.LaunchAndGetFileSharingToken(this.state.filePath)
            .then(token => this.setState({ fileSharingToken: token }));

        let stats = await window.electron.ipcRenderer.GetFileStats(this.state.filePath);

        if (stats) {
            let resolutionString = `${video.videoWidth}x${video.videoHeight}`;
            let fileSizeString = `${Math.floor((stats.size / 1024 / 1024) * 100) / 100}MB`;
            let metadataString = `${resolutionString} ${fileSizeString}`;
            let loadAttempts = this.state.videoLoadAttempts;
            this.setState({ metadataString: metadataString, videoLoadAttempts: 0 }, () => {
                TelemetryService.stopTrackEvent('loading-video',
                    {
                        attempts: loadAttempts.toString(),
                        duration: video.duration.toString(),
                        fileSize: stats.size.toString(),
                    });
            });
        }
    }

    render() {
        return <div className="video-preview-panel">
            {
                this.state.videoLoadAttempts >= VideoLoadAttemptsWarningThreshold ?
                    <h3 className="error-text">Sorry, something may be wrong.</h3>
                    :
                    <h3>Preview</h3>
            }
            {
                this.state.videoLoadAttempts >= VideoLoadAttemptsWarningThreshold &&
                <p>
                    The video is not loading. Please try restarting your computer, or &nbsp;
                    <a
                        title="Ask for help from the person that made the app"
                        href={ConfigService.getDeveloperContactURL()}>
                        contact support
                    </a>.
                </p>
            }
            <div className="info-container">
                <p className="details">{this.state.metadataString}</p>
                <div>
                    <button
                        className="svg-button"
                        onClick={this.revealInExplorer}>
                        <SVG src={FolderOpenSVGPath}
                            title="Reveal in File Explorer" />
                    </button>

                    <button
                        className="svg-button"
                        disabled={this.state.fileSharingToken.length === 0}
                        onClick={this.launchWindowsPhotoApp}>
                        <SVG src={EditSVGPath}
                            title="Edit Video with Windows Photo" />
                    </button>

                </div>
            </div>

            <video
                id="video-preview"
                controls
                preload="metadata"
                onError={this.onVideoLoadError}
                onLoadedMetadata={this.onVideoMetadataLoaded}
                controlsList="nofullscreen"
                src={this.state.filePath}>
            </video>
        </div>
    }
}
