import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { useRealtime } from "../hooks/useRealtime";
import { api } from "../services/api";
import type { Device, Position } from "../types";

export function HistoryPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [history, setHistory] = useState<Position[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [date, setDate] = useState("");
  const { snapshot } = useRealtime();

  async function load() {
    const [deviceData, historyData] = await Promise.all([api.getDevices(), api.getHistory(deviceId, date)]);
    setDevices(deviceData);
    setHistory(historyData);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!snapshot?.latestPosition.id) {
      return;
    }
    load();
  }, [snapshot?.latestPosition.id]);

  return (
    <Card title="Histórico de posições">
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        <select
          className="rounded-2xl border border-slate-200 px-4 py-3"
          value={deviceId}
          onChange={(event) => setDeviceId(event.target.value)}
        >
          <option value="">Todos os tratores</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-2xl border border-slate-200 px-4 py-3"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <button className="rounded-2xl bg-brand-500 px-5 py-3 font-semibold text-white" onClick={load}>
          Filtrar
        </button>
      </div>

      <div className="space-y-3 md:hidden">
        {history.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-850">{item.deviceName}</p>
              <StatusBadge value={item.status} />
            </div>
            <p className="mt-2 text-sm text-slate-500">{new Date(item.recordedAt).toLocaleString("pt-BR")}</p>
            <p className="mt-3 text-sm text-slate-600">Lat: {item.latitude.toFixed(6)}</p>
            <p className="text-sm text-slate-600">Lng: {item.longitude.toFixed(6)}</p>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="pb-3">Trator</th>
              <th className="pb-3">Data/Hora</th>
              <th className="pb-3">Latitude</th>
              <th className="pb-3">Longitude</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((item) => (
              <tr key={item.id}>
                <td className="py-3">{item.deviceName}</td>
                <td className="py-3">{new Date(item.recordedAt).toLocaleString("pt-BR")}</td>
                <td className="py-3">{item.latitude.toFixed(6)}</td>
                <td className="py-3">{item.longitude.toFixed(6)}</td>
                <td className="py-3">
                  <StatusBadge value={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
