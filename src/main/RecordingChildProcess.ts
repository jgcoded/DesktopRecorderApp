/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import * as path from 'path';
import * as fs from 'fs';
import { Readable, Writable } from 'stream';
import { spawn, ChildProcess } from 'child_process';
import RecordingSettings from 'common/RecordingSettings';
import { RecordableDevices } from 'common/RecordableDevices';
import StartRecording from './commands/StartRecording';
import StopRecording from './commands/StopRecording';
import GetRecordableDevices from './commands/GetRecordableDevices';
import * as GetFileSharingToken from './commands/GetFileSharingToken';

export default class RecordingChildProcess {
  private recordingChildProcess: ChildProcess;

  private constructor(childProcess: ChildProcess) {
    this.recordingChildProcess = childProcess;
  }

  public static async LaunchAndStartRecording(
    recordingSettings: RecordingSettings
  ): Promise<RecordingChildProcess> {
    const childProcess = await this.SpawnVideoService();
    const data = new StartRecording(recordingSettings).Serialize();
    await this.WriteDataToStream(childProcess.stdin, data);

    return new RecordingChildProcess(childProcess);
  }

  public async SendStopRecording() {
    if (this.recordingChildProcess == null) {
      throw Error('No child process');
    }

    const stream = this.recordingChildProcess.stdin;
    const data = new StopRecording().Serialize();
    await RecordingChildProcess.WriteDataToStream(stream, data);
  }

  public running() {
    return (
      this.recordingChildProcess && this.recordingChildProcess.exitCode == null
    );
  }

  public once(
    _event: 'exit',
    callback: (code?: number, signal?: NodeJS.Signals) => void
  ) {
    this.recordingChildProcess.once('exit', callback);
  }

  public off(
    _event: 'exit',
    callback: (code?: number, signal?: NodeJS.Signals) => void
  ) {
    this.recordingChildProcess.off('exit', callback);
  }

  public static async LaunchAndGetRecordableDevices(): Promise<RecordableDevices> {
    const childProcess = await this.SpawnVideoService();

    const data = new GetRecordableDevices().Serialize();
    await RecordingChildProcess.WriteDataToStream(childProcess.stdin, data);

    const response = RecordingChildProcess.ReadDataFromStream(
      childProcess.stdout
    );
    return JSON.parse(await response);
  }

  public static async LaunchAndGetFileSharingToken(
    filePath: string
  ): Promise<GetFileSharingToken.GetFileSharingTokenResponse> {
    const childProcess = await this.SpawnVideoService();

    const data = new GetFileSharingToken.GetFileSharingToken(
      filePath
    ).Serialize();
    await RecordingChildProcess.WriteDataToStream(childProcess.stdin, data);

    const response = RecordingChildProcess.ReadDataFromStream(
      childProcess.stdout
    );
    return JSON.parse(await response);
  }

  private static SpawnVideoService(): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      const searchDirs = [
        process.resourcesPath,
        process.cwd(),
        path.resolve(process.cwd(), 'resources'),
      ];

      let exePath: string = '';
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < searchDirs.length; i++) {
        const dir = searchDirs[i];
        const currentPath = path.resolve(dir, 'VideoService.exe');
        console.log('Checking for VideoService.exe in', currentPath);
        if (fs.existsSync(currentPath)) {
          exePath = currentPath;
          break;
        }
      }

      if (exePath === '') {
        const error = 'Could not find video service';
        reject(error);
        return;
      }

      resolve(
        spawn(`${exePath}`, [], {
          stdio: 'pipe',
        })
      );
    });
  }

  private static WriteDataToStream(
    stream: Writable | null,
    data: string
  ): Promise<void> {
    if (stream == null) {
      const error = 'cannot write data to null stream';
      return Promise.reject(error);
    }

    return new Promise((resolve, reject) => {
      stream.once('error', (error) => reject(error));
      const needsDrain = !stream.write(data);
      if (needsDrain) {
        stream.once('drain', resolve);
      } else {
        resolve();
      }
    });
  }

  private static ReadDataFromStream(stream: Readable | null): Promise<string> {
    if (stream == null) {
      const error = 'cannot read data from null stream';
      return Promise.reject(error);
    }

    return new Promise((resolve, reject) => {
      stream.once('error', (error) => reject(error));
      stream.once('data', (data: Buffer) => {
        resolve(data.toString());
      });
    });
  }
}
