import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { auditLog } from "../services/auditService.js";
import { normalizeGeofence } from "../services/geofenceService.js";
import { deleteWhereId, getById, insertWithIncrement, listCollection, patchWhereId } from "../services/repository.js";
import { geofenceSchema } from "../validation/schemas.js";
export const geofenceRoutes = Router();
geofenceRoutes.get("/", async (_request, response) => {
    try {
        const rows = await listCollection("geofences");
        response.json(rows.map(normalizeGeofence).sort((left, right) => right.id - left.id));
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao listar cercas" });
    }
});
geofenceRoutes.post("/", validateBody(geofenceSchema), async (request, response) => {
    try {
        const { name, propertyId, deviceId, coordinates } = request.body;
        const [property, device] = await Promise.all([getById("properties", propertyId), getById("devices", deviceId)]);
        if (!property) {
            response.status(400).json({ message: "Propriedade não encontrada" });
            return;
        }
        if (!device) {
            response.status(400).json({ message: "Trator não encontrado" });
            return;
        }
        if (device.propertyId !== propertyId) {
            response.status(409).json({ message: "O trator selecionado não pertence a esta propriedade" });
            return;
        }
        const geofence = await insertWithIncrement("geofences", { name, propertyId, deviceId, coordinates });
        auditLog({ action: "geofences.create", actor: request.user, target: `geofences/${geofence.id}` });
        response.status(201).json(geofence);
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao criar cerca" });
    }
});
geofenceRoutes.put("/:id", validateBody(geofenceSchema), async (request, response) => {
    try {
        const id = Number(request.params.id);
        const { name, propertyId, deviceId, coordinates } = request.body;
        const [property, device] = await Promise.all([getById("properties", propertyId), getById("devices", deviceId)]);
        if (!property) {
            response.status(400).json({ message: "Propriedade não encontrada" });
            return;
        }
        if (!device) {
            response.status(400).json({ message: "Trator não encontrado" });
            return;
        }
        if (device.propertyId !== propertyId) {
            response.status(409).json({ message: "O trator selecionado não pertence a esta propriedade" });
            return;
        }
        const geofence = await patchWhereId("geofences", id, { name, propertyId, deviceId, coordinates });
        if (!geofence) {
            response.status(404).json({ message: "Cerca não encontrada" });
            return;
        }
        auditLog({ action: "geofences.update", actor: request.user, target: `geofences/${geofence.id}` });
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
        auditLog({ action: "geofences.delete", actor: request.user, target: `geofences/${request.params.id}` });
        response.status(204).send();
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao excluir cerca" });
    }
});
