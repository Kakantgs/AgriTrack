import { Router } from "express";
import { isActiveAlert } from "../services/alertService.js";
import { withComputedOnlineStatus } from "../services/deviceStatus.js";
import { listCollection } from "../services/repository.js";
export const dashboardRoutes = Router();
dashboardRoutes.get("/", async (request, response) => {
    try {
        const { propertyId, deviceId, date } = request.query;
        const [devices, positions, alerts] = await Promise.all([
            listCollection("devices"),
            listCollection("positions"),
            listCollection("alerts")
        ]);
        const selectedPropertyId = propertyId ? Number(propertyId) : null;
        const selectedDeviceId = deviceId ? Number(deviceId) : null;
        const filteredDevices = devices
            .filter((device) => (selectedPropertyId ? device.propertyId === selectedPropertyId : true))
            .filter((device) => (selectedDeviceId ? device.id === selectedDeviceId : true));
        const deviceIds = new Set(filteredDevices.map((device) => device.id));
        const filteredPositions = positions
            .filter((position) => (selectedDeviceId ? position.deviceId === selectedDeviceId : true))
            .filter((position) => (selectedPropertyId ? deviceIds.has(position.deviceId) : true))
            .filter((position) => (date ? position.recordedAt.slice(0, 10) === date : true));
        const filteredAlerts = alerts
            .filter((alert) => (selectedDeviceId ? alert.deviceId === selectedDeviceId : true))
            .filter((alert) => (selectedPropertyId || selectedDeviceId ? deviceIds.has(alert.deviceId) : true))
            .filter((alert) => (date ? alert.createdAt.slice(0, 10) === date : true));
        const computedDevices = filteredDevices.map(withComputedOnlineStatus);
        const totalDevices = computedDevices.length;
        const onlineDevices = computedDevices.filter((item) => item.online).length;
        const inside = computedDevices.filter((item) => item.geofenceStatus === "inside").length;
        const outside = computedDevices.filter((item) => item.geofenceStatus === "outside").length;
        const lastPosition = filteredPositions.sort((left, right) => right.id - left.id)[0] ?? null;
        const latestAlert = filteredAlerts.sort((left, right) => right.id - left.id).find(isActiveAlert) ?? null;
        response.json({
            totalDevices,
            onlineDevices,
            lastPosition,
            latestAlert,
            statusSummary: {
                inside,
                outside
            },
            latestTelemetryAgeMinutes: lastPosition
                ? Math.max(0, Math.round((Date.now() - new Date(lastPosition.recordedAt).getTime()) / 60000))
                : null
        });
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao montar dashboard" });
    }
});
