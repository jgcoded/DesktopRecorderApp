import { IpcEventsFromMain } from 'common/IpcApi';

export default class HotKeyService {
  static offOnGlobal: () => void;

  public static async RegisterGlobalHotKey(
    // eslint-disable-next-line no-undef
    hotkey: Electron.Accelerator,
    callback: () => void
  ) {
    if (this.offOnGlobal) {
      this.offOnGlobal();
    }
    this.offOnGlobal = window.electron.ipcRenderer.on(
      IpcEventsFromMain.OnGlobalHotkey,
      (triggeredHotKey) => {
        if (triggeredHotKey === hotkey) {
          callback();
        }
      }
    );
    return window.electron.ipcRenderer.RegisterGlobalHotkey(hotkey);
  }

  public static async UnregisterAllGlobalHotKeys() {
    await window.electron.ipcRenderer.UnregisterAllGlobalHotkeys();
  }
}
