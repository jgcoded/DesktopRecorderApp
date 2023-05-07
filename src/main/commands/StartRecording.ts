import RecordingSettings from '../../common/RecordingSettings';
import VideoServiceCommand from './VideoServiceCommand';

export default class StartRecording extends VideoServiceCommand {
  constructor(settings: RecordingSettings) {
    super();
    this.settings = settings;
  }

  command = 'startrecording';

  settings: RecordingSettings;
}
