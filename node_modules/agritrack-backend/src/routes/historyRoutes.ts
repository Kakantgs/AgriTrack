import { Router } from "express";
import { listCollection } from "../services/repository.js";

export const historyRoutes = Router();

historyRoutes.get("/", async (request, response) => {
  try {
    const { deviceId, date } = request.query as { deviceId?: string; date?: string };
    const positions = await listCollection("positions");

    const rows = positions
      .filter((item) => (deviceId ? item.deviceId === Number(deviceId) : true))
      .filter((item) => (date ? item.recordedAt.slice(0, 10) === date : true))
      .sort((left, right) => right.id - left.id)
      .slice(0, 200);

    response.json(rows);
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao listar histórico" });
  }
});
