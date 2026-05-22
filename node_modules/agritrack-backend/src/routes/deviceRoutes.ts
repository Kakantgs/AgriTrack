import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { auditLog } from "../services/auditService.js";
import { generateDeviceToken } from "../services/deviceSecurity.js";
import { withComputedOnlineStatus } from "../services/deviceStatus.js";
import { deleteWhereId, getById, insertWithIncrement, listCollection, patchWhereId } from "../services/repository.js";
import { deviceSchema } from "../validation/schemas.js";

export const deviceRoutes = Router();

deviceRoutes.get("/", async (request, response) => {
  try {
    const rows = await listCollection("devices");
    const devices = await Promise.all(
      rows.map(async (device) => {
        if (device.deviceToken) {
          return device;
        }
        return (await patchWhereId("devices", device.id, { deviceToken: generateDeviceToken() })) ?? device;
      })
    );
    response.json(
      devices
        .sort((left, right) => right.id - left.id)
        .map(withComputedOnlineStatus)
    );
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao listar tratores" });
  }
});

deviceRoutes.post("/", validateBody(deviceSchema), async (request, response) => {
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
      deviceToken: generateDeviceToken(),
      status,
      propertyId,
      propertyName: property.name,
      lastLatitude: -21.7317,
      lastLongitude: -43.3488,
      lastUpdatedAt: now,
      lastSpeed: null,
      lastBattery: null,
      geofenceStatus: "inside",
      online: false
    });

    auditLog({ action: "devices.create", actor: request.user, target: `devices/${device.id}` });
    response.status(201).json(device);
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao criar trator" });
  }
});

deviceRoutes.put("/:id", validateBody(deviceSchema), async (request, response) => {
  try {
    const id = Number(request.params.id);
    const { name, plate, deviceCode, status, propertyId } = request.body;
    const property = await getById("properties", propertyId);

    if (!property) {
      response.status(400).json({ message: "Propriedade não encontrada" });
      return;
    }

    const device = await patchWhereId("devices", id, {
      name,
      plate,
      deviceCode,
      status,
      propertyId,
      propertyName: property.name
    });

    if (!device) {
      response.status(404).json({ message: "Trator não encontrado" });
      return;
    }

    auditLog({ action: "devices.update", actor: request.user, target: `devices/${device.id}` });
    response.json(device);
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao atualizar trator" });
  }
});

deviceRoutes.post("/:id/rotate-token", async (request, response) => {
  try {
    const id = Number(request.params.id);
    const device = await patchWhereId("devices", id, { deviceToken: generateDeviceToken() });

    if (!device) {
      response.status(404).json({ message: "Trator não encontrado" });
      return;
    }

    auditLog({ action: "devices.rotateToken", actor: request.user, target: `devices/${device.id}` });
    response.json(device);
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao rotacionar token" });
  }
});

deviceRoutes.delete("/:id", async (request, response) => {
  try {
    const removed = await deleteWhereId("devices", Number(request.params.id));
    if (!removed) {
      response.status(404).json({ message: "Trator não encontrado" });
      return;
    }
    auditLog({ action: "devices.delete", actor: request.user, target: `devices/${request.params.id}` });
    response.status(204).send();
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao excluir trator" });
  }
});
