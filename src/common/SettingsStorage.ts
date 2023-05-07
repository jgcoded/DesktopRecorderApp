import { AppSettings } from 'common/AppSettings';
import ConfigService from 'common/ConfigService';

export default class SettingsStorage {
  static readonly SettingsKey: string = 'settings';

  static readonly UserIdKey: string = 'anonId';

  public static getSettings(): AppSettings {
    const storedSettings: string = localStorage.getItem(this.SettingsKey) || '';
    const defaultSettings: AppSettings = ConfigService.getDefaultAppSettings();

    if (storedSettings === '') {
      this.storeSettings(defaultSettings);
      return defaultSettings;
    }

    const settings: AppSettings = JSON.parse(storedSettings);

    Object.keys(defaultSettings).forEach((k) => {
      if (settings[k] === undefined) {
        settings[k] = defaultSettings[k];
      }
    });

    return settings;
  }

  public static storeSettings(settings: AppSettings) {
    localStorage.setItem(this.SettingsKey, JSON.stringify(settings));
  }

  public static getDefaultSettings(): AppSettings {
    return ConfigService.getDefaultAppSettings();
  }

  public static getUserId() {
    let userId = localStorage.getItem(this.UserIdKey) || '';

    if (userId === '') {
      userId =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      localStorage.setItem(this.UserIdKey, userId);
    }

    return userId;
  }
}
