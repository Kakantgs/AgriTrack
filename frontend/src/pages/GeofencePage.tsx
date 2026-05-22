import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polygon, Popup, TileLayer } from "react-leaflet";
import { Card } from "../components/Card";
import { MapBoundsController } from "../components/MapBoundsController";
import { MapEditor } from "../components/MapEditor";
import { api } from "../services/api";
import type { Device, Geofence, Property } from "../types";
import { getErrorMessage } from "../utils/errors";
import { formatAreaHectares } from "../utils/geo";

const defaultCenter: [number, number] = [-21.732715, -43.349583];
const pointIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#2d8a4d;border:3px solid white;box-shadow:0 6px 16px rgba(15,23,42,.28)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

function createSquareAround([latitude, longitude]: [number, number], radiusMeters = 90): [number, number][] {
  const latitudeDelta = radiusMeters / 111_320;
  const longitudeDelta = radiusMeters / (111_320 * Math.cos((latitude * Math.PI) / 180));

  return [
    [latitude - latitudeDelta, longitude - longitudeDelta],
    [latitude - latitudeDelta, longitude + longitudeDelta],
    [latitude + latitudeDelta, longitude + longitudeDelta],
    [latitude + latitudeDelta, longitude - longitudeDelta]
  ];
}

export function GeofencePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [feedback, setFeedback] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
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
    setForm((current) => ({
      ...current,
      propertyId: propertyData.some((property) => property.id === current.propertyId)
        ? current.propertyId
        : propertyData[0]?.id ?? 1,
      deviceId: deviceData.some((device) => device.id === current.deviceId) ? current.deviceId : deviceData[0]?.id ?? 1
    }));
  }

  useEffect(() => {
    load();
  }, []);

  const center = useMemo(() => coordinates[0] ?? userLocation ?? defaultCenter, [coordinates, userLocation]);
  const mapBounds = coordinates.length > 0 ? coordinates : userLocation ? [userLocation] : null;
  const selectedArea = useMemo(() => formatAreaHectares(coordinates), [coordinates]);

  function updatePoint(index: number, point: [number, number]) {
    setCoordinates((current) => current.map((item, itemIndex) => (itemIndex === index ? point : item)));
  }

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setFeedback("Seu navegador não suporta geolocalização.");
      return;
    }

    setIsLocating(true);
    setFeedback("Buscando sua localização atual...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(location);
        setCoordinates(createSquareAround(location));
        setFeedback("Localização encontrada. Ajustei uma cerca inicial ao redor do ponto atual.");
        setIsLocating(false);
      },
      () => {
        setFeedback("Não foi possível obter sua localização. Verifique a permissão do navegador.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (coordinates.length < 3) {
      setFeedback("A cerca precisa de pelo menos 3 pontos.");
      return;
    }
    if (properties.length === 0 || devices.length === 0) {
      setFeedback("Cadastre pelo menos uma propriedade e um trator antes de salvar a cerca.");
      return;
    }
    try {
      if (editingId) {
        await api.updateGeofence(editingId, { ...form, coordinates });
        setFeedback("Cerca virtual atualizada com sucesso.");
      } else {
        await api.createGeofence({ ...form, coordinates });
        setFeedback("Cerca virtual salva com sucesso.");
      }
      setCoordinates([]);
      setEditingId(null);
      await load();
    } catch (error) {
      setFeedback(getErrorMessage(error, "Não foi possível salvar a cerca."));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card title={editingId ? "Editar cerca virtual" : "Criar cerca virtual"}>
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
            Clique no mapa para adicionar pontos manualmente ou use sua localização para gerar uma área inicial.
            São necessários pelo menos 3 pontos.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 font-semibold text-brand-700 transition hover:border-brand-500"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? "Localizando..." : "Usar minha localização"}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:border-slate-300"
              onClick={() => setCoordinates((current) => current.slice(0, -1))}
              disabled={coordinates.length === 0}
            >
              Desfazer último ponto
            </button>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
            Pontos selecionados: <strong>{coordinates.length}</strong>
            <p className="mt-2">
              Área estimada: <strong>{selectedArea}</strong>
            </p>
            {userLocation ? (
              <p className="mt-2">
                Localização: {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">
              {editingId ? "Atualizar cerca" : "Salvar cerca"}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600"
              onClick={() => {
                setCoordinates([]);
                setUserLocation(null);
              }}
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
                  setUserLocation(null);
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
              <p className="text-sm text-slate-500">
                {geofence.coordinates.length} pontos cadastrados ·{" "}
                {devices.find((device) => device.id === geofence.deviceId)?.name ?? "sem trator"} ·{" "}
                {formatAreaHectares(geofence.coordinates)}
              </p>
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
                    setUserLocation(null);
                    setFeedback("Modo edição ativo. Ajuste os pontos no mapa se necessário.");
                  }}
                >
                  Editar
                </button>
                <button
                  className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                  onClick={async () => {
                    try {
                      await api.deleteGeofence(geofence.id);
                      if (editingId === geofence.id) {
                        setEditingId(null);
                        setCoordinates([]);
                        setUserLocation(null);
                      }
                      setFeedback("Cerca removida.");
                      await load();
                    } catch (error) {
                      setFeedback(getErrorMessage(error, "Não foi possível remover a cerca."));
                    }
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
          <MapBoundsController bounds={mapBounds} />
          <MapEditor onAddPoint={(point) => setCoordinates((current) => [...current, point])} />
          {geofences
            .filter((geofence) => geofence.id !== editingId)
            .map((geofence) => (
              <Polygon
                key={geofence.id}
                pathOptions={{ color: "#94a3b8", fillOpacity: 0.08, weight: 1 }}
                positions={geofence.coordinates}
              >
                <Popup>{geofence.name}</Popup>
              </Polygon>
            ))}
          {coordinates.length >= 3 ? (
            <Polygon pathOptions={{ color: "#2d8a4d", fillOpacity: 0.22, weight: 4 }} positions={coordinates} />
          ) : null}
          {coordinates.map((point, index) => (
            <Marker
              key={`${point[0]}-${point[1]}-${index}`}
              position={point}
              icon={pointIcon}
              draggable
              eventHandlers={{
                dragend(event) {
                  const nextPoint = event.target.getLatLng();
                  updatePoint(index, [nextPoint.lat, nextPoint.lng]);
                }
              }}
            >
              <Popup>
                Ponto {index + 1}
                <br />
                Arraste para ajustar.
              </Popup>
            </Marker>
          ))}
          {userLocation ? (
            <CircleMarker
              center={userLocation}
              radius={8}
              pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.85 }}
            >
              <Popup>Sua localização atual</Popup>
            </CircleMarker>
          ) : null}
        </MapContainer>
      </Card>
    </div>
  );
}
