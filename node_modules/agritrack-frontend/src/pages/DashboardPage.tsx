import { useEffect, useState } from "react";
import { AlertBanner } from "../components/AlertBanner";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { useRealtime } from "../hooks/useRealtime";
import { api } from "../services/api";
import type { DashboardData } from "../types";

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const { snapshot, latestAlert } = useRealtime();

  useEffect(() => {
    api.getDashboard().then(setDashboard);
  }, [snapshot?.latestPosition.id]);

  return (
    <div className="space-y-6">
      <AlertBanner alert={latestAlert} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Tratores cadastrados</p>
          <p className="mt-2 text-3xl font-bold text-slate-850">{dashboard?.totalDevices ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Tratores online</p>
          <p className="mt-2 text-3xl font-bold text-slate-850">{dashboard?.onlineDevices ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Dentro da cerca</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{dashboard?.statusSummary.inside ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Fora da cerca</p>
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Propriedade</span>
                <span className="font-semibold text-slate-850">{snapshot.device.propertyName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Cerca</span>
                <span className="font-semibold text-slate-850">{snapshot.geofence?.name ?? "Sem cerca"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Posição</span>
                <StatusBadge value={snapshot.device.geofenceStatus} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aguardando conexão em tempo real.</p>
          )}
        </Card>
      </section>
    </div>
  );
}
