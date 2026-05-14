import { FormEvent, useEffect, useState } from "react";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import type { Device, Property } from "../types";

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
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

  async function load() {
    const [deviceData, propertyData] = await Promise.all([api.getDevices(), api.getProperties()]);
    setDevices(deviceData);
    setProperties(propertyData);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await api.createDevice(form);
    setForm({ name: "", plate: "", deviceCode: "", status: "active", propertyId: properties[0]?.id ?? 1 });
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
          <button className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">Salvar trator</button>
        </form>
      </Card>

      <Card title="Tratores cadastrados">
        <div className="space-y-4">
          {devices.map((device) => (
            <div key={device.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-850">{device.name}</p>
                  <p className="text-sm text-slate-500">{device.plate}</p>
                  <p className="mt-1 text-sm text-slate-500">Dispositivo: {device.deviceCode}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge value={device.status} />
                  <StatusBadge value={device.geofenceStatus} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
