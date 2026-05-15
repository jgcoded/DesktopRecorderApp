// Stubs out window.electron and navigator.mediaDevices so renderer components
// can mount inside jsdom without a real preload bridge.

const noopAsync = async () => undefined;
const noopUnsubscribe = () => () => undefined;

Object.defineProperty(window, 'electron', {
  configurable: true,
  writable: true,
  value: {
    ipcRenderer: {
      getWindowSize: async () => [0, 0],
      setWindowSize: noopAsync,
      GetPrimaryDisplayWorkArea: async () => ({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      }),
      SetWindowPosition: noopAsync,
      SetWindowShape: noopAsync,
      RegisterGlobalHotkey: async () => true,
      UnregisterAllGlobalHotkeys: noopAsync,
      GetFolderPath: async () => '/tmp',
      GetLocale: async () => 'en-US',
      SetAlwaysOnTop: noopAsync,
      HideWindow: noopAsync,
      ShowWindow: noopAsync,
      CloseWindow: noopAsync,
      OpenExternalApp: noopAsync,
      ShowItemInFolder: noopAsync,
      LaunchAndGetRecordableDevices: async () => ({
        monitors: [],
        microphones: [],
      }),
      LaunchAndStartRecording: noopAsync,
      LaunchAndGetFileSharingToken: async () => '',
      StopRecording: noopAsync,
      JoinPath: async (paths: string[]) => paths.join('/'),
      GetFileStats: async () => null,
      on: noopUnsubscribe,
      once: () => undefined,
      off: () => undefined,
    },
  },
});

if (!('mediaDevices' in navigator)) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    writable: true,
    value: { ondevicechange: null },
  });
}
