import { listCollection, readSingleton, writeSingleton } from "./repository.js";
import { persistPosition } from "./telemetryService.js";
const route = [
    [-21.7317, -43.3488],
    [-21.7312, -43.3478],
    [-21.7308, -43.3469],
    [-21.7302, -43.3461],
    [-21.7298, -43.3455],
    [-21.7292, -43.3449],
    [-21.7288, -43.3441],
    [-21.7294, -43.3448],
    [-21.7303, -43.346],
    [-21.7311, -43.3473]
];
const defaultState = {
    mode: "running",
    currentIndex: 0,
    intervalMs: 5000,
    lastTickAt: null
};
let timer = null;
export async function getSimulatorState() {
    const state = await readSingleton("simulator");
    if (state) {
        return state;
    }
    await writeSingleton("simulator", defaultState);
    return defaultState;
}
export async function updateSimulatorState(patch) {
    const current = await getSimulatorState();
    const next = { ...current, ...patch };
    await writeSingleton("simulator", next);
    return next;
}
async function getPrimaryDevice() {
    const devices = await listCollection("devices");
    return devices.find((item) => item.id === 1) ?? devices[0] ?? null;
}
export async function tickSimulator() {
    const state = await getSimulatorState();
    const device = await getPrimaryDevice();
    if (!device) {
        return null;
    }
    const [latitude, longitude] = route[state.currentIndex];
    const result = await persistPosition(device, latitude, longitude);
    const nextState = await updateSimulatorState({
        currentIndex: (state.currentIndex + 1) % route.length,
        lastTickAt: new Date().toISOString()
    });
    return { ...result, simulator: nextState };
}
export async function forceSimulatorOutsideFence() {
    const device = await getPrimaryDevice();
    if (!device) {
        return null;
    }
    const result = await persistPosition(device, -21.7279, -43.3432);
    return result;
}
export async function resetSimulatorPosition() {
    const state = await updateSimulatorState({ currentIndex: 0, lastTickAt: null });
    const device = await getPrimaryDevice();
    if (!device) {
        return { simulator: state };
    }
    const result = await persistPosition(device, route[0][0], route[0][1]);
    return { ...result, simulator: state };
}
export async function setSimulatorMode(mode) {
    return updateSimulatorState({ mode });
}
export async function setSimulatorInterval(intervalMs) {
    return updateSimulatorState({ intervalMs });
}
export async function startSimulatorLoop(broadcast) {
    const applyLoop = async () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        const state = await getSimulatorState();
        timer = setInterval(async () => {
            const current = await getSimulatorState();
            if (current.mode !== "running") {
                return;
            }
            await tickSimulator();
            await broadcast();
        }, state.intervalMs);
    };
    await applyLoop();
    return {
        refreshLoop: applyLoop
    };
}
