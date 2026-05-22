import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { auditLog } from "../services/auditService.js";
import { deleteWhereId, insertWithIncrement, listCollection } from "../services/repository.js";
import { plannedRouteSchema } from "../validation/schemas.js";

export const plannedRouteRoutes = Router();

plannedRouteRoutes.get("/", async (request, response) => {
  try {
    const deviceId = request.query.deviceId ? Number(request.query.deviceId) : null;
    const routes = await listCollection("plannedRoutes");
    response.json(
      routes
        .filter((route) => (deviceId ? route.deviceId === deviceId : true))
        .sort((left, right) => right.id - left.id)
    );
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao listar rotas" });
  }
});

plannedRouteRoutes.post("/", validateBody(plannedRouteSchema), async (request, response) => {
  try {
    const route = await insertWithIncrement("plannedRoutes", {
      ...request.body,
      createdAt: new Date().toISOString()
    });
    auditLog({ action: "plannedRoutes.create", actor: request.user, target: `plannedRoutes/${route.id}` });
    response.status(201).json(route);
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao salvar rota" });
  }
});

plannedRouteRoutes.delete("/:id", async (request, response) => {
  try {
    const removed = await deleteWhereId("plannedRoutes", Number(request.params.id));
    if (!removed) {
      response.status(404).json({ message: "Rota não encontrada" });
      return;
    }
    auditLog({ action: "plannedRoutes.delete", actor: request.user, target: `plannedRoutes/${request.params.id}` });
    response.status(204).send();
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao excluir rota" });
  }
});
