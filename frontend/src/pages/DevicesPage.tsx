import { FormEvent, useEffect, useState } from "react";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { useRealtime } from "../hooks/useRealtime";
import { api } from "../services/api";
import type { Device, Property } from "../types";

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [feedback, setFeedback] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{
    name: string;
    plate: string;
    deviceCode: string;
    status: "active" | "inactive";
    propertyId: number;
  }>({
    name: "",
    plate: "",
    deviceCode: "",
    status: "active" as const,
    propertyId: 1
  });
  const { snapshot } = useRealtime();

  async function load() {
    const [deviceData, propertyData] = await Promise.all([api.getDevices(), api.getProperties()]);
    setDevices(deviceData);
    setProperties(propertyData);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (snapshot?.latestPosition.id) {
      load();
    }
  }, [snapshot?.latestPosition.id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name || !form.plate || !form.deviceCode) {
      setFeedback("Preencha nome, identificação e código do dispositivo.");
      return;
    }
    if (editingId) {
      await api.updateDevice(editingId, form);
      setFeedback("Trator atualizado com sucesso.");
    } else {
      await api.createDevice(form);
      setFeedback("Trator cadastrado com sucesso.");
    }
    setForm({ name: "", plate: "", deviceCode: "", status: "active", propertyId: properties[0]?.id ?? 1 });
    setEditingId(null);
    load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card title="Cadastrar trator">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Nome do trator"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Placa ou identificação"
            value={form.plate}
            onChange={(event) => setForm((current) => ({ ...current, plate: event.target.value }))}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Código do dispositivo"
            value={form.deviceCode}
            onChange={(event) => setForm((current) => ({ ...current, deviceCode: event.target.value }))}
          />
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={form.propertyId}
            onChange={(event) => setForm((current) => ({ ...current, propertyId: Number(event.target.value) }))}
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as "active" | "inactive" }))}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">
              {editingId ? "Atualizar trator" : "Salvar trator"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", plate: "", deviceCode: "", status: "active", propertyId: properties[0]?.id ?? 1 });
                  setFeedback("");
                }}
              >
                Cancelar edição
              </button>
            ) : null}
          </div>
          {feedback ? <p className="text-sm text-slate-500">{feedback}</p> : null}
        </form>
      </Card>

      <Card title="Tratores cadastrados">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total de tratores</p>
            <p className="mt-2 text-2xl font-bold text-slate-850">{devices.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Ativos</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{devices.filter((item) => item.status === "active").length}</p>
          </div>
        </div>
        <div className="space-y-4">
          {devices.map((device) => (
            <div key={device.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-850">{device.name}</p>
                  <p className="text-sm text-slate-500">{device.plate}</p>
                  <p className="mt-1 text-sm text-slate-500">Dispositivo: {device.deviceCode}</p>
                  <p className="mt-1 text-sm text-slate-500">Propriedade: {device.propertyName}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                  <StatusBadge value={device.status} />
                  <StatusBadge value={device.geofenceStatus} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                  onClick={() => {
                    setEditingId(device.id);
                    setForm({
                      name: device.name,
                      plate: device.plate,
                      deviceCode: device.deviceCode,
                      status: device.status,
                      propertyId: device.propertyId
                    });
                    setFeedback("Modo edição ativo.");
                  }}
                >
                  Editar
                </button>
                <button
                  className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                  onClick={async () => {
                    await api.deleteDevice(device.id);
                    if (editingId === device.id) {
                      setEditingId(null);
                    }
                    setFeedback("Trator excluído.");
                    load();
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
