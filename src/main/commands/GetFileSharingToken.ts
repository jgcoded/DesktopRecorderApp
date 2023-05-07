import VideoServiceCommand from './VideoServiceCommand';

export class GetFileSharingToken extends VideoServiceCommand {
  constructor(filePath: string) {
    super();
    this.filePath = filePath;
  }

  command = 'getfilesharingtoken';

  filePath: string;
}

export interface GetFileSharingTokenResponse {
  fileSharingToken: string;
}
