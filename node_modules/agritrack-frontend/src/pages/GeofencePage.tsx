import "leaflet/dist/leaflet.css";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { MapContainer, Polygon, TileLayer } from "react-leaflet";
import { Card } from "../components/Card";
import { MapEditor } from "../components/MapEditor";
import { api } from "../services/api";
import type { Device, Geofence, Property } from "../types";

const defaultCenter: [number, number] = [-21.732715, -43.349583];

export function GeofencePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [feedback, setFeedback] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "Área de Trabalho 01",
    propertyId: 1,
    deviceId: 1
  });

  async function load() {
    const [deviceData, propertyData, geofenceData] = await Promise.all([
      api.getDevices(),
      api.getProperties(),
      api.getGeofences()
    ]);
    setDevices(deviceData);
    setProperties(propertyData);
    setGeofences(geofenceData);
  }

  useEffect(() => {
    load();
  }, []);

  const center = useMemo(() => coordinates[0] ?? defaultCenter, [coordinates]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (coordinates.length < 3) {
      setFeedback("A cerca precisa de pelo menos 3 pontos.");
      return;
    }
    if (editingId) {
      await api.updateGeofence(editingId, { ...form, coordinates });
      setFeedback("Cerca virtual atualizada com sucesso.");
    } else {
      await api.createGeofence({ ...form, coordinates });
      setFeedback("Cerca virtual salva com sucesso.");
    }
    setCoordinates([]);
    setEditingId(null);
    load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card title="Criar cerca virtual">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Nome da cerca"
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
            value={form.deviceId}
            onChange={(event) => setForm((current) => ({ ...current, deviceId: Number(event.target.value) }))}
          >
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </select>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Clique no mapa para adicionar pontos da área permitida. São necessários pelo menos 3 pontos.
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
            Pontos selecionados: <strong>{coordinates.length}</strong>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">
              {editingId ? "Atualizar cerca" : "Salvar cerca"}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600"
              onClick={() => setCoordinates([])}
            >
              Limpar pontos
            </button>
            {editingId ? (
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
                onClick={() => {
                  setEditingId(null);
                  setCoordinates([]);
                  setForm({ name: "Área de Trabalho 01", propertyId: properties[0]?.id ?? 1, deviceId: devices[0]?.id ?? 1 });
                  setFeedback("");
                }}
              >
                Cancelar edição
              </button>
            ) : null}
          </div>
          {feedback ? <p className="text-sm text-slate-500">{feedback}</p> : null}
        </form>

        <div className="mt-6 space-y-3">
          {geofences.map((geofence) => (
            <div key={geofence.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-850">{geofence.name}</p>
              <p className="text-sm text-slate-500">{geofence.coordinates.length} pontos cadastrados</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                  onClick={() => {
                    setEditingId(geofence.id);
                    setForm({
                      name: geofence.name,
                      propertyId: geofence.propertyId,
                      deviceId: geofence.deviceId
                    });
                    setCoordinates(geofence.coordinates);
                    setFeedback("Modo edição ativo. Ajuste os pontos no mapa se necessário.");
                  }}
                >
                  Editar
                </button>
                <button
                  className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                  onClick={async () => {
                    await api.deleteGeofence(geofence.id);
                    if (editingId === geofence.id) {
                      setEditingId(null);
                      setCoordinates([]);
                    }
                    setFeedback("Cerca removida.");
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

      <Card className="h-[420px] overflow-hidden p-0 sm:h-[520px] xl:h-[620px]">
        <MapContainer center={center} zoom={16} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEditor onAddPoint={(point) => setCoordinates((current) => [...current, point])} />
          {coordinates.length >= 3 ? (
            <Polygon pathOptions={{ color: "#2d8a4d", fillOpacity: 0.2 }} positions={coordinates} />
          ) : null}
        </MapContainer>
      </Card>
    </div>
  );
}
