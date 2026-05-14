import { Router } from "express";
import { listCollection } from "../services/repository.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", async (_request, response) => {
  try {
    const [devices, positions, alerts] = await Promise.all([
      listCollection("devices"),
      listCollection("positions"),
      listCollection("alerts")
    ]);

    const totalDevices = devices.length;
    const onlineDevices = devices.filter((item) => item.online).length;
    const inside = devices.filter((item) => item.geofenceStatus === "inside").length;
    const outside = devices.filter((item) => item.geofenceStatus === "outside").length;
    const lastPosition = positions.sort((left, right) => right.id - left.id)[0] ?? null;
    const latestAlert = alerts.sort((left, right) => right.id - left.id)[0] ?? null;

    response.json({
      totalDevices,
      onlineDevices,
      lastPosition,
      latestAlert,
      statusSummary: {
        inside,
        outside
      }
    });
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao montar dashboard" });
  }
});
