import { WebSocketServer } from "ws";
import { isActiveAlert } from "./alertService.js";
import { getGeofenceByDevice } from "./geofenceService.js";
import { verifyAuthToken } from "./authService.js";
import { withComputedOnlineStatus } from "./deviceStatus.js";
import { listCollection } from "./repository.js";
export function createRealtimeServer(server) {
    const wss = new WebSocketServer({ server });
    wss.on("connection", (socket, request) => {
        const url = new URL(request.url ?? "/", "http://localhost");
        const token = url.searchParams.get("token");
        if (!token || !verifyAuthToken(token)) {
            socket.close(1008, "Autenticação obrigatória");
            return;
        }
    });
    async function snapshot() {
        const devices = await listCollection("devices");
        const positions = await listCollection("positions");
        const alerts = await listCollection("alerts");
        const latestPosition = positions.sort((left, right) => right.id - left.id)[0];
        const device = latestPosition
            ? devices.find((item) => item.id === latestPosition.deviceId)
            : devices.sort((left, right) => left.id - right.id)[0];
        const latestAlert = alerts.sort((left, right) => right.id - left.id).find(isActiveAlert) ?? null;
        if (!device || !latestPosition) {
            return null;
        }
        return {
            device: withComputedOnlineStatus(device),
            geofence: await getGeofenceByDevice(device.id),
            latestPosition,
            latestAlert
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
