import {
  ApplicationInsights,
  ITelemetryItem,
  ITelemetryPlugin,
} from '@microsoft/applicationinsights-web';
import {
  ReactPlugin,
  withAITracking,
} from '@microsoft/applicationinsights-react-js';
import { createBrowserHistory } from 'history';
import ConfigService from 'common/ConfigService';
import SettingsStorage from 'common/SettingsStorage';

const browserHistory = createBrowserHistory();

type TelemetryEvent = 'recording-video' | 'loading-video' | 'launch-photos';

export default class TelemetryService {
  private static appInsights: ApplicationInsights;

  private static reactPlugin: ReactPlugin;

  public static initializeWithReactComponent(
    // eslint-disable-next-line no-undef
    component: React.ComponentType<any>,
    initiallyEnabled: boolean
  ) {
    const key = ConfigService.getAppInsightsKey();
    TelemetryService.reactPlugin = new ReactPlugin();
    TelemetryService.appInsights = new ApplicationInsights({
      config: {
        instrumentationKey: key,
        url: 'index.html',
        disableTelemetry: !initiallyEnabled,
        extensions: [
          TelemetryService.reactPlugin as unknown as ITelemetryPlugin,
        ],
        extensionConfig: {
          [TelemetryService.reactPlugin.identifier]: {
            history: browserHistory,
          },
        },
      },
    });

    if (key) {
      TelemetryService.appInsights.loadAppInsights();
      TelemetryService.appInsights.context.user.id =
        SettingsStorage.getUserId();
      TelemetryService.appInsights.context.application.ver =
        ConfigService.getAppVersion();
      TelemetryService.appInsights.addTelemetryInitializer(
        (item: ITelemetryItem) => {
          if (item && item.baseData && item.baseData.uri) {
            item.baseData.uri = 'index.html';
          }

          if (item && item.ext && item.ext.trace && item.ext.trace.name) {
            item.ext.trace.name = 'index.html';
          }
        }
      );
    } else {
      TelemetryService.appInsights.config.disableTelemetry = true;
    }

    return withAITracking(TelemetryService.reactPlugin, component);
  }

  public static setTelemetryEnabled(enabled?: boolean) {
    if (!TelemetryService.appInsights.config.instrumentationKey) {
      return;
    }

    TelemetryService.appInsights.config.disableTelemetry =
      enabled === undefined ? false : !enabled;
  }

  private static isTelemetryDisabled() {
    return TelemetryService.appInsights.config.disableTelemetry;
  }

  public static startTrackEvent(event: TelemetryEvent) {
    if (TelemetryService.isTelemetryDisabled()) {
      return;
    }
    TelemetryService.appInsights.startTrackEvent(event);
  }

  public static stopTrackEvent(
    event: TelemetryEvent,
    additionalProperties?: { [key: string]: string }
  ) {
    if (TelemetryService.isTelemetryDisabled()) {
      return;
    }
    TelemetryService.appInsights.stopTrackEvent(event, additionalProperties);
  }

  public static trackException(error: Error, stack?: string) {
    if (TelemetryService.isTelemetryDisabled()) {
      return;
    }
    TelemetryService.appInsights.trackException({
      error,
      properties: { stack: stack || '' },
    });
  }
}
