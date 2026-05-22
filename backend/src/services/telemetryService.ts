import { createGeofenceExitAlert } from "./alertService.js";
import { getGeofenceByDevice, isPointInsidePolygon } from "./geofenceService.js";
import { getById, insertWithIncrement, listCollection, patchWhereId } from "./repository.js";
import type { Device, GeofenceStatus, Position, TelemetryPayload } from "../types/index.js";

export async function processTelemetry(payload: TelemetryPayload) {
  const devices = await listCollection("devices");
  const device = devices.find((item) => item.deviceCode === payload.deviceCode);

  if (!device) {
    throw new Error("Dispositivo não encontrado");
  }

  if (!device.deviceToken || !payload.deviceToken || payload.deviceToken !== device.deviceToken) {
    throw new Error("Token do dispositivo inválido");
  }

  return persistPosition(device, payload.latitude, payload.longitude, payload.timestamp, payload.speed, payload.battery);
}

export async function persistPosition(
  device: Device,
  latitude: number,
  longitude: number,
  timestamp?: string,
  speed?: number,
  battery?: number
) {
  const geofence = await getGeofenceByDevice(device.id);
  const status: GeofenceStatus =
    geofence && isPointInsidePolygon([latitude, longitude], geofence.coordinates) ? "inside" : "outside";
  const recordedAt = timestamp ?? new Date().toISOString();

  const updatedDevice = await patchWhereId("devices", device.id, {
    lastLatitude: latitude,
    lastLongitude: longitude,
    lastUpdatedAt: recordedAt,
    lastSpeed: speed ?? null,
    lastBattery: battery ?? null,
    geofenceStatus: status,
    online: true
  });

  const position = await insertWithIncrement("positions", {
    deviceId: device.id,
    deviceName: device.name,
    latitude,
    longitude,
    status,
    recordedAt,
    speed: speed ?? null,
    battery: battery ?? null
  });

  let latestAlert = null;
  if (device.geofenceStatus === "inside" && status === "outside" && geofence) {
    latestAlert = await createGeofenceExitAlert(device.id, device.name, geofence.name);
  }

  return {
    device: updatedDevice ?? (await getById("devices", device.id)),
    position,
    latestAlert
  };
}

export function getRecentPath(positions: Position[], deviceId: number, limit = 8) {
  return positions
    .filter((item) => item.deviceId === deviceId)
    .sort((left, right) => right.id - left.id)
    .slice(0, limit);
}
