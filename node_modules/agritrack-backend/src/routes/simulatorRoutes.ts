import { Router } from "express";
import {
  forceSimulatorOutsideFence,
  getSimulatorState,
  resetSimulatorPosition,
  setSimulatorInterval,
  setSimulatorMode,
  tickSimulator
} from "../services/simulatorService.js";

type BroadcastFn = () => Promise<void>;
type RefreshFn = () => Promise<void>;

export function createSimulatorRoutes(broadcast: BroadcastFn, refreshLoop: RefreshFn) {
  const router = Router();

  router.get("/", async (_request, response) => {
    response.json(await getSimulatorState());
  });

  router.post("/start", async (_request, response) => {
    const state = await setSimulatorMode("running");
    await refreshLoop();
    await broadcast();
    response.json(state);
  });

  router.post("/pause", async (_request, response) => {
    const state = await setSimulatorMode("paused");
    await broadcast();
    response.json(state);
  });

  router.post("/reset", async (_request, response) => {
    const result = await resetSimulatorPosition();
    await broadcast();
    response.json(result);
  });

  router.post("/step", async (_request, response) => {
    const result = await tickSimulator();
    await broadcast();
    response.json(result);
  });

  router.post("/force-exit", async (_request, response) => {
    const result = await forceSimulatorOutsideFence();
    await broadcast();
    response.json(result);
  });

  router.put("/", async (request, response) => {
    const intervalMs = Number(request.body.intervalMs);
    const safeInterval = Number.isFinite(intervalMs) ? Math.max(1000, intervalMs) : 5000;
    const state = await setSimulatorInterval(safeInterval);
    await refreshLoop();
    response.json(state);
  });

  return router;
}
