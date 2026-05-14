import { FormEvent, useEffect, useState } from "react";
import { Card } from "./Card";
import { api } from "../services/api";
import type { RealtimePayload } from "../types";

type SimulatorControlPanelProps = {
  snapshot: RealtimePayload | null;
  onRefresh?: () => void | Promise<void>;
};

export function SimulatorControlPanel({ snapshot, onRefresh }: SimulatorControlPanelProps) {
  const [intervalMs, setIntervalMs] = useState(5000);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [telemetry, setTelemetry] = useState({
    deviceCode: "ESP32-GPS-001",
    latitude: "-21.731700",
    longitude: "-43.348800",
    speed: "14",
    battery: "87"
  });

  useEffect(() => {
    if (snapshot?.simulator.intervalMs) {
      setIntervalMs(snapshot.simulator.intervalMs);
    }
  }, [snapshot?.simulator.intervalMs]);

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setSending(true);
    try {
      await action();
      setFeedback(successMessage);
      await onRefresh?.();
    } finally {
      setSending(false);
    }
  }

  async function handleTelemetrySubmit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      await api.sendTelemetry({
        deviceCode: telemetry.deviceCode,
        latitude: Number(telemetry.latitude),
        longitude: Number(telemetry.longitude),
        speed: Number(telemetry.speed),
        battery: Number(telemetry.battery),
        timestamp: new Date().toISOString()
      });
      setFeedback("Telemetria manual enviada com sucesso.");
      await onRefresh?.();
    } finally {
      setSending(false);
    }
  }

  return (
    <Card title="Modo demonstração">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Estado do simulador</p>
            <p className="mt-2 text-xl font-semibold text-slate-850">
              {snapshot?.simulator.mode === "running" ? "Executando" : "Pausado"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Último ciclo</p>
            <p className="mt-2 text-sm font-semibold text-slate-850">
              {snapshot?.simulator.lastTickAt
                ? new Date(snapshot.simulator.lastTickAt).toLocaleString("pt-BR")
                : "Ainda não executado"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white" disabled={sending} onClick={() => runAction(api.startSimulator, "Simulador iniciado.")}>
            Iniciar
          </button>
          <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700" disabled={sending} onClick={() => runAction(api.pauseSimulator, "Simulador pausado.")}>
            Pausar
          </button>
          <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700" disabled={sending} onClick={() => runAction(api.stepSimulator, "Passo único executado.")}>
            Avançar 1 passo
          </button>
          <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700" disabled={sending} onClick={() => runAction(api.resetSimulator, "Posição reiniciada.")}>
            Resetar rota
          </button>
          <button className="rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white" disabled={sending} onClick={() => runAction(api.forceSimulatorExit, "Saída forçada da cerca registrada.")}>
            Forçar saída
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2">
            <input
              type="number"
              min={1000}
              step={1000}
              className="w-full border-0 bg-transparent outline-none"
              value={intervalMs}
              onChange={(event) => setIntervalMs(Number(event.target.value))}
            />
            <button
              className="rounded-xl bg-slate-850 px-3 py-2 text-xs font-semibold text-white"
              disabled={sending}
              onClick={() => runAction(() => api.updateSimulator(intervalMs), "Velocidade atualizada.")}
            >
              Salvar
            </button>
          </div>
        </div>

        <form className="space-y-3 rounded-3xl border border-slate-200 p-4" onSubmit={handleTelemetrySubmit}>
          <p className="font-semibold text-slate-850">Ingestão de telemetria real</p>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3"
              value={telemetry.deviceCode}
              onChange={(event) => setTelemetry((current) => ({ ...current, deviceCode: event.target.value }))}
              placeholder="Código do dispositivo"
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3"
              value={telemetry.latitude}
              onChange={(event) => setTelemetry((current) => ({ ...current, latitude: event.target.value }))}
              placeholder="Latitude"
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3"
              value={telemetry.longitude}
              onChange={(event) => setTelemetry((current) => ({ ...current, longitude: event.target.value }))}
              placeholder="Longitude"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded-2xl border border-slate-200 px-4 py-3"
                value={telemetry.speed}
                onChange={(event) => setTelemetry((current) => ({ ...current, speed: event.target.value }))}
                placeholder="Velocidade"
              />
              <input
                className="rounded-2xl border border-slate-200 px-4 py-3"
                value={telemetry.battery}
                onChange={(event) => setTelemetry((current) => ({ ...current, battery: event.target.value }))}
                placeholder="Bateria"
              />
            </div>
          </div>
          <button className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white" disabled={sending}>
            Enviar telemetria
          </button>
        </form>

        {feedback ? <p className="text-sm text-slate-500">{feedback}</p> : null}
      </div>
    </Card>
  );
}
