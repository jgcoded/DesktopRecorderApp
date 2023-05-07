import { BitrateOption } from 'common/BitrateOption';
import { ResolutionOption } from 'common/ResolutionOption';
import { AudioQuality } from 'common/AudioQuality';

export interface VideoSettings {
  monitor: number;
  resolutionOption: ResolutionOption;
  audioQuality: AudioQuality;
  bitrateOption: BitrateOption;
  framerate: number;
  audioEndpoint: string;
}
