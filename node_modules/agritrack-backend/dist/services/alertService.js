import { insertWithIncrement } from "./repository.js";
import { readSingleton } from "./repository.js";
const activeAlertWindowMinutes = Number(process.env.ACTIVE_ALERT_WINDOW_MINUTES ?? 15);
export function isActiveAlert(alert) {
    if (!alert) {
        return false;
    }
    const createdAt = new Date(alert.createdAt).getTime();
    if (Number.isNaN(createdAt)) {
        return false;
    }
    return Date.now() - createdAt <= activeAlertWindowMinutes * 60000;
}
async function sendWhatsappAlert(message, payload) {
    const settings = await readSingleton("settings");
    const webhookUrl = settings?.whatsapp?.webhookUrl ?? process.env.WHATSAPP_WEBHOOK_URL;
    const token = settings?.whatsapp?.token ?? process.env.WHATSAPP_WEBHOOK_TOKEN;
    if (!webhookUrl) {
        return "pendente";
    }
    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ message, ...payload })
        });
        return response.ok ? "enviado" : "erro";
    }
    catch {
        return "erro";
    }
}
export async function createGeofenceExitAlert(deviceId, deviceName, geofenceName) {
    const createdAt = new Date().toISOString();
    const formattedTime = new Date(createdAt).toLocaleString("pt-BR");
    const message = `Alerta AgriTrack: o trator ${deviceName} saiu da cerca virtual ${geofenceName} às ${formattedTime}.`;
    const whatsappStatus = await sendWhatsappAlert(message, {
        deviceId,
        deviceName,
        geofenceName,
        type: "geofence_exit",
        createdAt
    });
    return insertWithIncrement("alerts", {
        deviceId,
        deviceName,
        geofenceName,
        type: "geofence_exit",
        message,
        whatsappStatus,
        createdAt
    });
}
