import { Router } from "express";
import { listCollection } from "../services/repository.js";
export const alertRoutes = Router();
alertRoutes.get("/", async (_request, response) => {
    try {
        const rows = await listCollection("alerts");
        response.json(rows
            .sort((left, right) => right.id - left.id)
            .slice(0, 100)
            .map((alert) => ({
            ...alert,
            whatsappStatus: ["pendente", "enviado", "erro"].includes(String(alert.whatsappStatus))
                ? alert.whatsappStatus
                : "pendente"
        })));
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao listar alertas" });
    }
});
