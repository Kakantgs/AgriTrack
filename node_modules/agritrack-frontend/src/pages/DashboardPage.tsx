import { Activity, AlertTriangle, MapPin, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { AlertBanner } from "../components/AlertBanner";
import { Card } from "../components/Card";
import { SimulatorControlPanel } from "../components/SimulatorControlPanel";
import { StatusBadge } from "../components/StatusBadge";
import { useRealtime } from "../hooks/useRealtime";
import { api } from "../services/api";
import type { DashboardData } from "../types";

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const { snapshot, latestAlert, connectionState, lastMessageAt } = useRealtime();

  async function refreshDashboard() {
    const data = await api.getDashboard();
    setDashboard(data);
  }

  useEffect(() => {
    refreshDashboard();
  }, [snapshot?.latestPosition.id]);

  return (
    <div className="space-y-6">
      <AlertBanner alert={latestAlert} />

      <Card className="overflow-hidden bg-[linear-gradient(135deg,#173928_0%,#22563b_48%,#2d8a4d_100%)] text-white">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">Operação ao vivo</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Monitoramento de tratores para apresentação em campo e em estande.</h1>
            <p className="mt-3 max-w-2xl text-sm text-emerald-50">
              O painel acompanha telemetria, cerca virtual e geração de alertas em tempo real tanto no desktop quanto no celular.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl bg-white/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-50">Conectividade</span>
                <Radio size={18} />
              </div>
              <p className="mt-3 text-xl font-semibold">
                {connectionState === "live" ? "Tempo real ativo" : connectionState === "connecting" ? "Conectando" : "Offline"}
              </p>
              <p className="mt-1 text-xs text-emerald-100">
                Última atualização {lastMessageAt ? new Date(lastMessageAt).toLocaleTimeString("pt-BR") : "pendente"}
              </p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-50">Estado da operação</span>
                <AlertTriangle size={18} />
              </div>
              <p className="mt-3 text-xl font-semibold">{latestAlert ? "Atenção necessária" : "Sem eventos críticos"}</p>
              <p className="mt-1 text-xs text-emerald-100">{latestAlert ? "Saída de cerca detectada recentemente" : "Equipamento estável na área permitida"}</p>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Tratores cadastrados</p>
            <Activity size={18} className="text-brand-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-850">{dashboard?.totalDevices ?? 0}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Tratores online</p>
            <Radio size={18} className="text-brand-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-850">{dashboard?.onlineDevices ?? 0}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Dentro da cerca</p>
            <MapPin size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{dashboard?.statusSummary.inside ?? 0}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Fora da cerca</p>
            <AlertTriangle size={18} className="text-rose-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-rose-700">{dashboard?.statusSummary.outside ?? 0}</p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Última posição">
          {dashboard?.lastPosition ? (
            <div className="space-y-3">
              <p className="text-xl font-semibold text-slate-850">{dashboard.lastPosition.deviceName}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Latitude</p>
                  <p className="mt-1 text-lg font-semibold">{dashboard.lastPosition.latitude.toFixed(6)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Longitude</p>
                  <p className="mt-1 text-lg font-semibold">{dashboard.lastPosition.longitude.toFixed(6)}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Atualizado em {new Date(dashboard.lastPosition.recordedAt).toLocaleString("pt-BR")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhuma posição disponível.</p>
          )}
        </Card>

        <Card title="Status atual">
          {snapshot ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Trator</span>
                <span className="font-semibold text-slate-850">{snapshot.device.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Propriedade</span>
                <span className="text-right font-semibold text-slate-850">{snapshot.device.propertyName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Cerca</span>
                <span className="text-right font-semibold text-slate-850">{snapshot.geofence?.name ?? "Sem cerca"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Posição</span>
                <StatusBadge value={snapshot.device.geofenceStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Atualização</span>
                <span className="text-right text-sm font-medium text-slate-700">
                  {new Date(snapshot.latestPosition.recordedAt).toLocaleTimeString("pt-BR")}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aguardando conexão em tempo real.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SimulatorControlPanel snapshot={snapshot} onRefresh={refreshDashboard} />
        <Card title="Qualidade da telemetria">
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Idade da última posição</p>
              <p className="mt-2 text-2xl font-bold text-slate-850">
                {dashboard?.latestTelemetryAgeMinutes ?? 0} min
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Origem operacional</p>
              <p className="mt-2 text-base font-semibold text-slate-850">
                {snapshot?.simulator.mode === "running" ? "Simulador automático ativo" : "Pronto para telemetria manual"}
              </p>
            </div>
            <p className="text-sm text-slate-600">
              O mesmo fluxo de backend agora aceita telemetria do simulador e também posições reais via `POST /api/telemetry`.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
