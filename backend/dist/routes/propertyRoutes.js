import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { auditLog } from "../services/auditService.js";
import { deleteWhereId, insertWithIncrement, listCollection, patchWhereId } from "../services/repository.js";
import { propertySchema } from "../validation/schemas.js";
export const propertyRoutes = Router();
propertyRoutes.get("/", async (_request, response) => {
    try {
        const rows = await listCollection("properties");
        response.json(rows.sort((left, right) => right.id - left.id));
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao listar propriedades" });
    }
});
propertyRoutes.post("/", validateBody(propertySchema), async (request, response) => {
    try {
        const { name, location, areaHectares } = request.body;
        const property = await insertWithIncrement("properties", { name, location, areaHectares });
        auditLog({ action: "properties.create", actor: request.user, target: `properties/${property.id}` });
        response.status(201).json(property);
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao criar propriedade" });
    }
});
propertyRoutes.put("/:id", validateBody(propertySchema), async (request, response) => {
    try {
        const id = Number(request.params.id);
        const { name, location, areaHectares } = request.body;
        const property = await patchWhereId("properties", id, { name, location, areaHectares });
        if (!property) {
            response.status(404).json({ message: "Propriedade não encontrada" });
            return;
        }
        auditLog({ action: "properties.update", actor: request.user, target: `properties/${property.id}` });
        response.json(property);
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao atualizar propriedade" });
    }
});
propertyRoutes.delete("/:id", async (request, response) => {
    try {
        const id = Number(request.params.id);
        const [devices, geofences] = await Promise.all([listCollection("devices"), listCollection("geofences")]);
        const hasLinkedDevice = devices.some((device) => device.propertyId === id);
        const hasLinkedGeofence = geofences.some((geofence) => geofence.propertyId === id);
        if (hasLinkedDevice || hasLinkedGeofence) {
            response.status(409).json({
                message: "Remova ou mova os tratores e cercas vinculados antes de excluir a propriedade"
            });
            return;
        }
        const removed = await deleteWhereId("properties", id);
        if (!removed) {
            response.status(404).json({ message: "Propriedade não encontrada" });
            return;
        }
        auditLog({ action: "properties.delete", actor: request.user, target: `properties/${request.params.id}` });
        response.status(204).send();
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao excluir propriedade" });
    }
});
