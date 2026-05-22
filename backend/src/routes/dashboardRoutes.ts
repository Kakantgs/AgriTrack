import { Router } from "express";
import { withComputedOnlineStatus } from "../services/deviceStatus.js";
import { listCollection } from "../services/repository.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", async (request, response) => {
  try {
    const { propertyId, deviceId, date } = request.query as { propertyId?: string; deviceId?: string; date?: string };
    const [devices, positions, alerts] = await Promise.all([
      listCollection("devices"),
      listCollection("positions"),
      listCollection("alerts")
    ]);

    const filteredDevices = devices.filter((device) => (propertyId ? device.propertyId === Number(propertyId) : true));
    const deviceIds = new Set(filteredDevices.map((device) => device.id));
    const filteredPositions = positions
      .filter((position) => (deviceId ? position.deviceId === Number(deviceId) : true))
      .filter((position) => (propertyId ? deviceIds.has(position.deviceId) : true))
      .filter((position) => (date ? position.recordedAt.slice(0, 10) === date : true));

    const computedDevices = filteredDevices.map(withComputedOnlineStatus);
    const totalDevices = computedDevices.length;
    const onlineDevices = computedDevices.filter((item) => item.online).length;
    const inside = computedDevices.filter((item) => item.geofenceStatus === "inside").length;
    const outside = computedDevices.filter((item) => item.geofenceStatus === "outside").length;
    const lastPosition = filteredPositions.sort((left, right) => right.id - left.id)[0] ?? null;
    const latestAlert = alerts.sort((left, right) => right.id - left.id)[0] ?? null;

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
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao montar dashboard" });
  }
});
