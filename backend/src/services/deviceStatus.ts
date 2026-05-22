import type { Device } from "../types/index.js";

const offlineAfterMinutes = Number(process.env.DEVICE_OFFLINE_AFTER_MINUTES ?? 10);

export function isDeviceOnline(device: Device) {
  if (!device.online || !device.lastUpdatedAt) {
    return false;
  }

  const ageMs = Date.now() - new Date(device.lastUpdatedAt).getTime();
  return ageMs <= offlineAfterMinutes * 60_000;
}

export function withComputedOnlineStatus<T extends Device>(device: T): T {
  return {
    ...device,
    online: isDeviceOnline(device)
  };
}
