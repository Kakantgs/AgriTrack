import cors from "cors";
import express from "express";
import http from "node:http";
import { alertRoutes } from "./routes/alertRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { deviceRoutes } from "./routes/deviceRoutes.js";
import { geofenceRoutes } from "./routes/geofenceRoutes.js";
import { historyRoutes } from "./routes/historyRoutes.js";
import { plannedRouteRoutes } from "./routes/plannedRouteRoutes.js";
import { propertyRoutes } from "./routes/propertyRoutes.js";
import { settingsRoutes } from "./routes/settingsRoutes.js";
import { createTelemetryRoutes } from "./routes/telemetryRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { requireAuth, requireRole } from "./middleware/authMiddleware.js";
import { createRealtimeServer } from "./services/realtimeService.js";
import { getStorageStatus } from "./services/repository.js";
async function bootstrap() {
    const app = express();
    const server = http.createServer(app);
    const realtime = createRealtimeServer(server);
    const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.use(cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error("Origem não autorizada pelo CORS"));
        }
    }));
    app.use(express.json());
    app.get("/api/health", (_request, response) => {
        response.json({ status: "ok", storage: getStorageStatus() });
    });
    app.use("/api/auth", authRoutes);
    app.use("/api/telemetry", createTelemetryRoutes(realtime.broadcast));
    app.use("/api/gps", createTelemetryRoutes(realtime.broadcast));
    app.use(requireAuth);
    app.use("/api/properties", propertyRoutes);
    app.use("/api/devices", deviceRoutes);
    app.use("/api/geofences", geofenceRoutes);
    app.use("/api/history", historyRoutes);
    app.use("/api/alerts", alertRoutes);
    app.use("/api/users", requireRole("admin"), userRoutes);
    app.use("/api/planned-routes", plannedRouteRoutes);
    app.use("/api/settings", settingsRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.get("/api/realtime", async (_request, response) => {
        response.json(await realtime.snapshot());
    });
    const port = Number(process.env.PORT ?? 4000);
    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.error(`Porta ${port} já está em uso. Encerre o processo antigo ou inicie com outra porta: PORT=4001 npm run start --workspace backend`);
            process.exit(1);
        }
        console.error("Erro ao iniciar servidor HTTP", error);
        process.exit(1);
    });
    server.listen(port, () => {
        console.log(`AgriTrack backend running on http://localhost:${port}`);
    });
}
bootstrap().catch((error) => {
    console.error("Failed to start AgriTrack backend", error);
    process.exit(1);
});
