import { Router } from "express";
import { getById, insertWithIncrement, listCollection } from "../services/repository.js";

export const deviceRoutes = Router();

deviceRoutes.get("/", async (_request, response) => {
  try {
    const rows = await listCollection("devices");
    response.json(rows.sort((left, right) => right.id - left.id));
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao listar tratores" });
  }
});

deviceRoutes.post("/", async (request, response) => {
  try {
    const { name, plate, deviceCode, status, propertyId } = request.body;
    const property = await getById("properties", propertyId);

    if (!property) {
      response.status(400).json({ message: "Propriedade não encontrada" });
      return;
    }

    const now = new Date().toISOString();
    const device = await insertWithIncrement("devices", {
      name,
      plate,
      deviceCode,
      status,
      propertyId,
      propertyName: property.name,
      lastLatitude: -21.7317,
      lastLongitude: -43.3488,
      lastUpdatedAt: now,
      geofenceStatus: "inside",
      online: false
    });

    response.status(201).json(device);
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao criar trator" });
  }
});
