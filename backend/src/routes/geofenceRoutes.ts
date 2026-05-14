import { Router } from "express";
import { insertWithIncrement, listCollection } from "../services/repository.js";

export const geofenceRoutes = Router();

geofenceRoutes.get("/", async (_request, response) => {
  try {
    const rows = await listCollection("geofences");
    response.json(rows.sort((left, right) => right.id - left.id));
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao listar cercas" });
  }
});

geofenceRoutes.post("/", async (request, response) => {
  try {
    const { name, propertyId, deviceId, coordinates } = request.body;
    const geofence = await insertWithIncrement("geofences", { name, propertyId, deviceId, coordinates });
    response.status(201).json(geofence);
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao criar cerca" });
  }
});
