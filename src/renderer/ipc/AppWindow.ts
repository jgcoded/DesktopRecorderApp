import ConfigService from 'common/ConfigService';
import { IpcEventsFromMain } from '../../common/IpcApi';

export default class AppWindow {
  // Use known startup time window size for performance improvements
  // Calling document.getElementById on start up has bad performance
  public static async updateToInitialMainWindowSize() {
    const windowWidth = ConfigService.getWindowWidthConstant();
    const windowHeight = ConfigService.getWindowHeightConstant();
    const initialHeight = ConfigService.getInitialHeightConstant();
    await AppWindow.updateSize(windowWidth, windowHeight);
    await AppWindow.updateShape(
      windowWidth,
      initialHeight,
      windowWidth,
      windowHeight
    );
  }

  public static async updateMainWindowSize() {
    const { containerWidth, containerHeight } = AppWindow.getContainerSize();
    const { bodyWidth, bodyHeight } = AppWindow.getBodySize();
    const { width, height } = AppWindow.calculateNewSize(
      containerWidth,
      containerHeight
    );

    await AppWindow.updateSize(bodyWidth, bodyHeight);
    await AppWindow.updateShape(width, height, bodyWidth, bodyHeight);
  }

  private static async updateSize(
    newWindowWidth: number,
    newWindowHeight: number
  ) {
    const [windowWidth, windowHeight] =
      await window.electron.ipcRenderer.getWindowSize();
    if (windowWidth === 0 && windowHeight === 0) {
      await window.electron.ipcRenderer.setWindowSize(
        newWindowWidth,
        newWindowHeight
      );

      const workArea =
        await window.electron.ipcRenderer.GetPrimaryDisplayWorkArea();
      const appOffsetY = ConfigService.getInitialAppOffsetY();
      const appXPos = workArea.x + workArea.width / 2 - newWindowWidth / 2;
      const appYPos =
        workArea.y + workArea.height - newWindowHeight + appOffsetY;
      await window.electron.ipcRenderer.SetWindowPosition(appXPos, appYPos);
      window.electron.ipcRenderer.on(
        IpcEventsFromMain.ScaleChanged,
        async () => {
          await AppWindow.updateMainWindowSize();
        }
      );
    }
  }

  private static async updateShape(
    width: number,
    height: number,
    windowWidth: number,
    windowHeight: number
  ) {
    // eslint-disable-next-line no-undef
    const windowShape: Electron.Rectangle = {
      x: windowWidth - width,
      y: windowHeight - height,
      width,
      height,
    };

    await window.electron.ipcRenderer.SetWindowShape([windowShape]);
  }

  private static getContainerSize() {
    const container = document.getElementById('root');
    const containerWidth = container?.clientWidth || 0;
    const containerHeight = container?.clientHeight || 0;

    return { containerWidth, containerHeight };
  }

  private static getBodySize() {
    const bodyElement = document.getElementsByTagName('body')[0];
    const bodyWidth = bodyElement.clientWidth;
    const bodyHeight = bodyElement.clientHeight;

    return { bodyWidth, bodyHeight };
  }

  private static calculateNewSize(
    containerWidth: number,
    containerHeight: number
  ) {
    const shadowSize = ConfigService.getShadowSizeConstant();
    const width = containerWidth + shadowSize * 2;
    const height = containerHeight + shadowSize * 2;

    return { width, height };
  }
}
