import { createGeofenceExitAlert } from "./alertService.js";
import { getGeofenceByDevice, isPointInsidePolygon } from "./geofenceService.js";
import { getById, insertWithIncrement, listCollection, patchWhereId } from "./repository.js";
export async function processTelemetry(payload) {
    const devices = await listCollection("devices");
    const device = devices.find((item) => item.deviceCode === payload.deviceCode);
    if (!device) {
        throw new Error("Dispositivo não encontrado");
    }
    return persistPosition(device, payload.latitude, payload.longitude, payload.timestamp, payload.speed, payload.battery);
}
export async function persistPosition(device, latitude, longitude, timestamp, _speed, _battery) {
    const geofence = await getGeofenceByDevice(device.id);
    const status = geofence && isPointInsidePolygon([latitude, longitude], geofence.coordinates) ? "inside" : "outside";
    const recordedAt = timestamp ?? new Date().toISOString();
    const updatedDevice = await patchWhereId("devices", device.id, {
        lastLatitude: latitude,
        lastLongitude: longitude,
        lastUpdatedAt: recordedAt,
        geofenceStatus: status,
        online: true
    });
    const position = await insertWithIncrement("positions", {
        deviceId: device.id,
        deviceName: device.name,
        latitude,
        longitude,
        status,
        recordedAt
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
export function getRecentPath(positions, deviceId, limit = 8) {
    return positions
        .filter((item) => item.deviceId === deviceId)
        .sort((left, right) => right.id - left.id)
        .slice(0, limit);
}
