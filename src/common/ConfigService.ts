import config from 'common/config.json';
import px from 'common/px.json';
import { BitrateSetting } from 'common/BitrateSetting.js';
import { AppSettings } from 'common/AppSettings.js';

export default class ConfigService {
  public static getAppInsightsKey() {
    const key = config['appinsights-api-key'];
    return key === '' ? undefined : key;
  }

  public static getDefaultAppSettings(): AppSettings {
    return config['default-app-settings'];
  }

  public static getBitrateSettings(): BitrateSetting[] {
    return config['bitrate-settings'];
  }

  public static getShadowSizeConstant(): number {
    return parseInt(px['shadow-size'], 10);
  }

  public static getWindowWidthConstant(): number {
    return (
      parseInt(px['recording-panel-width'], 10) +
      2 * ConfigService.getShadowSizeConstant()
    );
  }

  public static getWindowHeightConstant(): number {
    return (
      parseInt(px['recording-panel-height'], 10) +
      parseInt(px['settings-panel-height'], 10) +
      parseInt(px['panel-margin-size'], 10) +
      2 * ConfigService.getShadowSizeConstant()
    );
  }

  public static getInitialHeightConstant(): number {
    return (
      parseInt(px['recording-panel-height'], 10) +
      2 * ConfigService.getShadowSizeConstant()
    );
  }

  public static getInitialAppOffsetX(): number {
    return parseInt(px['app-offset-x'], 10);
  }

  public static getInitialAppOffsetY(): number {
    return parseInt(px['app-offset-y'], 10);
  }

  public static getPrivacyPolicyURL(): string {
    return config['privacy-policy'];
  }

  public static getWindowsPhotoProtocolLauncherURLFormat(): string {
    return config.windowsPhotoProtocolLauncherUriFormat;
  }

  public static getDeveloperContactURL(): string {
    return config['developer-contact'];
  }

  public static getRateAppURL(): string {
    return config['rate-app-url'];
  }

  public static getAppVersion(): string {
    return config.version;
  }
}
