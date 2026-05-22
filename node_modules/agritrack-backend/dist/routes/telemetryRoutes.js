import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { auditLog } from "../services/auditService.js";
import { processTelemetry } from "../services/telemetryService.js";
import { telemetrySchema } from "../validation/schemas.js";
export function createTelemetryRoutes(broadcast) {
    const router = Router();
    router.post("/", validateBody(telemetrySchema), async (request, response) => {
        try {
            const payload = {
                ...request.body,
                deviceToken: request.body.deviceToken ?? request.header("x-device-token")
            };
            const result = await processTelemetry(payload);
            await broadcast();
            auditLog({
                action: "telemetry.received",
                target: `devices/${result.device?.id ?? payload.deviceCode}`,
                metadata: {
                    deviceCode: payload.deviceCode,
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    speed: payload.speed,
                    battery: payload.battery
                }
            });
            response.status(201).json(result);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao processar telemetria";
            const status = message.includes("Token") ? 401 : message.includes("não encontrado") ? 404 : 500;
            response.status(status).json({ message });
        }
    });
    return router;
}
