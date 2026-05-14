import { insertWithIncrement } from "./repository.js";
import type { Alert } from "../types/index.js";

export async function createGeofenceExitAlert(deviceId: number, deviceName: string, geofenceName: string) {
  const createdAt = new Date().toISOString();
  const formattedTime = new Date(createdAt).toLocaleString("pt-BR");
  const message = `Alerta AgriTrack: o trator ${deviceName} saiu da cerca virtual ${geofenceName} às ${formattedTime}.`;

  return insertWithIncrement("alerts", {
    deviceId,
    deviceName,
    geofenceName,
    type: "geofence_exit",
    message,
    whatsappStatus: "simulado",
    createdAt
  }) as Promise<Alert>;
}
