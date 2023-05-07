import { IpcApi } from 'common/IpcApi';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: {
      ipcRenderer: IpcApi;
    };
  }
}

export {};
