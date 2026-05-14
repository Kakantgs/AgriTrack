import { Router } from "express";
import { deleteWhereId, insertWithIncrement, listCollection, patchWhereId } from "../services/repository.js";
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
propertyRoutes.post("/", async (request, response) => {
    try {
        const { name, location, areaHectares } = request.body;
        const property = await insertWithIncrement("properties", { name, location, areaHectares });
        response.status(201).json(property);
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao criar propriedade" });
    }
});
propertyRoutes.put("/:id", async (request, response) => {
    try {
        const id = Number(request.params.id);
        const { name, location, areaHectares } = request.body;
        const property = await patchWhereId("properties", id, { name, location, areaHectares });
        if (!property) {
            response.status(404).json({ message: "Propriedade não encontrada" });
            return;
        }
        response.json(property);
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao atualizar propriedade" });
    }
});
propertyRoutes.delete("/:id", async (request, response) => {
    try {
        const removed = await deleteWhereId("properties", Number(request.params.id));
        if (!removed) {
            response.status(404).json({ message: "Propriedade não encontrada" });
            return;
        }
        response.status(204).send();
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao excluir propriedade" });
    }
});
