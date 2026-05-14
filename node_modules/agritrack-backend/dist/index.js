import cors from "cors";
import express from "express";
import http from "node:http";
import { alertRoutes } from "./routes/alertRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { deviceRoutes } from "./routes/deviceRoutes.js";
import { geofenceRoutes } from "./routes/geofenceRoutes.js";
import { historyRoutes } from "./routes/historyRoutes.js";
import { propertyRoutes } from "./routes/propertyRoutes.js";
import { createSimulatorRoutes } from "./routes/simulatorRoutes.js";
import { createTelemetryRoutes } from "./routes/telemetryRoutes.js";
import { createRealtimeServer } from "./services/realtimeService.js";
import { seedDatabase } from "./services/seedService.js";
import { startSimulatorLoop } from "./services/simulatorService.js";
async function bootstrap() {
    await seedDatabase();
    const app = express();
    const server = http.createServer(app);
    const realtime = createRealtimeServer(server);
    const simulator = await startSimulatorLoop(realtime.broadcast);
    app.use(cors());
    app.use(express.json());
    app.get("/api/health", (_request, response) => {
        response.json({ status: "ok" });
    });
    app.use("/api/auth", authRoutes);
    app.use("/api/properties", propertyRoutes);
    app.use("/api/devices", deviceRoutes);
    app.use("/api/geofences", geofenceRoutes);
    app.use("/api/history", historyRoutes);
    app.use("/api/alerts", alertRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/telemetry", createTelemetryRoutes(realtime.broadcast));
    app.use("/api/simulator", createSimulatorRoutes(realtime.broadcast, simulator.refreshLoop));
    app.get("/api/realtime", async (_request, response) => {
        response.json(await realtime.snapshot());
    });
    const port = 4000;
    server.listen(port, () => {
        console.log(`AgriTrack backend running on http://localhost:${port}`);
    });
}
bootstrap().catch((error) => {
    console.error("Failed to start AgriTrack backend", error);
    process.exit(1);
});
