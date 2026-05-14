import { WebSocketServer } from "ws";
import { getGeofenceByDevice } from "./geofenceService.js";
import { getSimulatorState } from "./simulatorService.js";
import { listCollection } from "./repository.js";
export function createRealtimeServer(server) {
    const wss = new WebSocketServer({ server });
    async function snapshot() {
        const devices = await listCollection("devices");
        const positions = await listCollection("positions");
        const alerts = await listCollection("alerts");
        const device = devices.sort((left, right) => left.id - right.id)[0];
        const latestPosition = positions.sort((left, right) => right.id - left.id)[0];
        const latestAlert = alerts.sort((left, right) => right.id - left.id)[0] ?? null;
        if (!device || !latestPosition) {
            return null;
        }
        return {
            device,
            geofence: await getGeofenceByDevice(device.id),
            latestPosition,
            latestAlert,
            simulator: await getSimulatorState()
        };
    }
    async function broadcast() {
        const payload = await snapshot();
        if (!payload) {
            return;
        }
        const data = JSON.stringify(payload);
        wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                client.send(data);
            }
        });
    }
    return {
        broadcast,
        snapshot
    };
}
