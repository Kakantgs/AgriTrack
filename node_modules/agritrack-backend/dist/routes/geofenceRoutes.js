import { Router } from "express";
import { deleteWhereId, insertWithIncrement, listCollection, patchWhereId } from "../services/repository.js";
export const geofenceRoutes = Router();
geofenceRoutes.get("/", async (_request, response) => {
    try {
        const rows = await listCollection("geofences");
        response.json(rows.sort((left, right) => right.id - left.id));
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao listar cercas" });
    }
});
geofenceRoutes.post("/", async (request, response) => {
    try {
        const { name, propertyId, deviceId, coordinates } = request.body;
        const geofence = await insertWithIncrement("geofences", { name, propertyId, deviceId, coordinates });
        response.status(201).json(geofence);
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao criar cerca" });
    }
});
geofenceRoutes.put("/:id", async (request, response) => {
    try {
        const id = Number(request.params.id);
        const { name, propertyId, deviceId, coordinates } = request.body;
        const geofence = await patchWhereId("geofences", id, { name, propertyId, deviceId, coordinates });
        if (!geofence) {
            response.status(404).json({ message: "Cerca não encontrada" });
            return;
        }
        response.json(geofence);
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao atualizar cerca" });
    }
});
geofenceRoutes.delete("/:id", async (request, response) => {
    try {
        const removed = await deleteWhereId("geofences", Number(request.params.id));
        if (!removed) {
            response.status(404).json({ message: "Cerca não encontrada" });
            return;
        }
        response.status(204).send();
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao excluir cerca" });
    }
});
