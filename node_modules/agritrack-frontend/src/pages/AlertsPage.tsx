import { useEffect, useState } from "react";
import { useRealtime } from "../hooks/useRealtime";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import type { Alert } from "../types";

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { latestAlert } = useRealtime();

  useEffect(() => {
    api.getAlerts().then(setAlerts);
  }, [latestAlert?.id]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total de eventos</p>
          <p className="mt-2 text-3xl font-bold text-slate-850">{alerts.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">WhatsApp pendente/webhook</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {alerts.filter((item) => item.whatsappStatus === "pendente").length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Último alerta</p>
          <p className="mt-2 text-base font-semibold text-slate-850">
            {alerts[0] ? new Date(alerts[0].createdAt).toLocaleString("pt-BR") : "Sem eventos"}
          </p>
        </Card>
      </div>

      <Card title="Alertas gerados">
        <div className="space-y-4">
          {alerts.length === 0 ? <p className="text-sm text-slate-500">Nenhum alerta registrado até o momento.</p> : null}
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-850">{alert.deviceName}</p>
                <p className="text-sm text-slate-500">{alert.geofenceName}</p>
                <p className="mt-2 text-sm text-slate-600">{alert.message}</p>
              </div>
              <div className="space-y-2">
                <StatusBadge value={alert.whatsappStatus} />
                <p className="text-sm text-slate-500">{new Date(alert.createdAt).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </div>
        ))}
        </div>
      </Card>
    </div>
  );
}
