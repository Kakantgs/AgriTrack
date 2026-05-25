import { listCollection } from "./repository.js";
import type { Geofence } from "../types/index.js";

function parseCoordinate(value: unknown): [number, number] | null {
  if (Array.isArray(value) && value.length >= 2) {
    const latitude = Number(value[0]);
    const longitude = Number(value[1]);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
  }

  if (typeof value === "string") {
    const [latitudeValue, longitudeValue] = value.trim().split(/\s+|,/);
    const latitude = Number(latitudeValue);
    const longitude = Number(longitudeValue);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
  }

  return null;
}

export function normalizeGeofence(geofence: Geofence): Geofence {
  const coordinates = Array.isArray(geofence.coordinates) ? geofence.coordinates : [];

  return {
    ...geofence,
    coordinates: (coordinates as unknown[])
      .map(parseCoordinate)
      .filter((point): point is [number, number] => Boolean(point))
  };
}

export async function getGeofenceByDevice(deviceId: number): Promise<Geofence | null> {
  const geofences = await listCollection("geofences");
  return geofences
    .map(normalizeGeofence)
    .filter((geofence) => geofence.deviceId === deviceId)
    .sort((left, right) => right.id - left.id)[0] ?? null;
}

export function isPointInsidePolygon(point: [number, number], polygon: [number, number][]) {
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
