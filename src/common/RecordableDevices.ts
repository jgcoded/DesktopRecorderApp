import { MonitorRotation } from 'common/MonitorRotation';

export interface Monitor {
  name: string;
  adapter: string;
  top: number;
  left: number;
  bottom: number;
  right: number;
  rotation: MonitorRotation;
  index: number;
}

export function IsSupportedMonitor(monitor: Monitor) {
  if (!monitor) {
    return false;
  }

  return (
    monitor.rotation === MonitorRotation.Identity ||
    monitor.rotation === MonitorRotation.Unspecified
  );
}

export interface Microphone {
  name: string;
  endpoint: string;
}

export interface RecordableDevices {
  monitors: Monitor[];
  microphones: Microphone[];
}
