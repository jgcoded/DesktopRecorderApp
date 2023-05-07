import { BitrateOption } from 'common/BitrateOption';
import { ResolutionOption } from 'common/ResolutionOption';

export interface BitrateSetting {
  resolutionOption: ResolutionOption;
  bitrateOption?: BitrateOption;
  framerate?: number;
  bitrate: number;
}
