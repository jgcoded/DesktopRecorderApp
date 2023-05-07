export default class VideoServiceCommand {
  public readonly command: string = '';

  public Serialize(): string {
    return `${JSON.stringify(this)}\r\n`;
  }
}
