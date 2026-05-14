import { createGeofenceExitAlert } from "./alertService.js";
import { getGeofenceByDevice, isPointInsidePolygon } from "./geofenceService.js";
import { insertWithIncrement, listCollection, updateWhereId } from "./repository.js";
const route = [
    [-21.7317, -43.3488],
    [-21.7312, -43.3478],
    [-21.7308, -43.3469],
    [-21.7302, -43.3461],
    [-21.7298, -43.3455],
    [-21.7292, -43.3449],
    [-21.7288, -43.3441],
    [-21.7294, -43.3448],
    [-21.7303, -43.3460],
    [-21.7311, -43.3473]
];
export function startGpsSimulator(broadcast) {
    let index = 0;
    setInterval(async () => {
        const devices = await listCollection("devices");
        const device = devices.find((item) => item.id === 1);
        if (!device) {
            return;
        }
        const [latitude, longitude] = route[index];
        const geofence = await getGeofenceByDevice(device.id);
        // O simulador percorre um trajeto com pontos dentro e fora da área para disparar alertas reais na UI.
        const status = geofence && isPointInsidePolygon([latitude, longitude], geofence.coordinates) ? "inside" : "outside";
        const now = new Date().toISOString();
        await updateWhereId("devices", device.id, (current) => ({
            ...current,
            lastLatitude: latitude,
            lastLongitude: longitude,
            lastUpdatedAt: now,
            geofenceStatus: status,
            online: true
        }));
        await insertWithIncrement("positions", {
            deviceId: device.id,
            deviceName: device.name,
            latitude,
            longitude,
            status,
            recordedAt: now
        });
        if (device.geofenceStatus === "inside" && status === "outside" && geofence) {
            await createGeofenceExitAlert(device.id, device.name, geofence.name);
        }
        index = (index + 1) % route.length;
        await broadcast();
    }, 5000);
}
