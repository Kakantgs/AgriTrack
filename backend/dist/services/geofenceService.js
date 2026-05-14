import { listCollection } from "./repository.js";
export async function getGeofenceByDevice(deviceId) {
    const geofences = await listCollection("geofences");
    return geofences
        .filter((geofence) => geofence.deviceId === deviceId)
        .sort((left, right) => right.id - left.id)[0] ?? null;
}
export function isPointInsidePolygon(point, polygon) {
    // Ray casting é suficiente para o MVP e deixa a troca futura por engine GIS isolada aqui.
    let inside = false;
    const [x, y] = point;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersects) {
            inside = !inside;
        }
    }
    return inside;
}
