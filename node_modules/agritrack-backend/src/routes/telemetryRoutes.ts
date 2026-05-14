import { Router } from "express";
import { processTelemetry } from "../services/telemetryService.js";
import type { TelemetryPayload } from "../types/index.js";

type BroadcastFn = () => Promise<void>;

export function createTelemetryRoutes(broadcast: BroadcastFn) {
  const router = Router();

  router.post("/", async (request, response) => {
    try {
      const payload = request.body as TelemetryPayload;
      if (!payload.deviceCode || typeof payload.latitude !== "number" || typeof payload.longitude !== "number") {
        response.status(400).json({ message: "Payload de telemetria inválido" });
        return;
      }

      const result = await processTelemetry(payload);
      await broadcast();
      response.status(201).json(result);
    } catch (error) {
      response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao processar telemetria" });
    }
  });

  return router;
}
