import { VideoSettings } from 'common/VideoSettings';

export default interface RecordingSettings extends VideoSettings {
  filename: string;
  bitrate: number;
}
