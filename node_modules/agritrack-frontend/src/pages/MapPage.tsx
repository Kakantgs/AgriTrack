import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { AlertBanner } from "../components/AlertBanner";
import { Card } from "../components/Card";
import { MapBoundsController } from "../components/MapBoundsController";
import { MapEditor } from "../components/MapEditor";
import { MapViewportController } from "../components/MapViewportController";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import { useRealtime } from "../hooks/useRealtime";
import type { Device, Geofence, PlannedRoute, Position, Property } from "../types";
import { formatAreaHectares, isPointInsidePolygon } from "../utils/geo";
import { getErrorMessage } from "../utils/errors";

const fallbackCenter: [number, number] = [-21.7317, -43.3488];

const tractorIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:24px;height:24px;border-radius:9999px;background:#174c33;border:4px solid white;box-shadow:0 10px 24px rgba(15,23,42,.35)"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const routePointIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:12px;height:12px;border-radius:9999px;background:#2563eb;border:2px solid white;box-shadow:0 4px 12px rgba(15,23,42,.25)"></span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

function formatDateTime(value?: string | null) {
  if (!value) {
    return "sem telemetria";
  }

  return new Date(value).toLocaleString("pt-BR");
}

function parseCoordinate(value: unknown): [number, number] | null {
  if (Array.isArray(value) && value.length >= 2) {
    const latitude = Number(value[0]);
    const longitude = Number(value[1]);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
  }

  if (typeof value === "string") {
    const [latitudeValue, longitudeValue] = value.trim().split(/\s+|,/);
    const latitude = Number(latitudeValue);
    const longitude = Number(longitudeValue);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
  }

  return null;
}

function normalizeGeofence(geofence: Geofence): Geofence {
  const coordinates = Array.isArray(geofence.coordinates) ? geofence.coordinates : [];

  return {
    ...geofence,
    coordinates: (coordinates as unknown[])
      .map(parseCoordinate)
      .filter((point): point is [number, number] => Boolean(point))
  };
}

export function MapPage() {
  const { snapshot, latestAlert, connectionState } = useRealtime();
  const [followVehicle, setFollowVehicle] = useState(false);
  const [recentPositions, setRecentPositions] = useState<Position[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [selectedGeofenceId, setSelectedGeofenceId] = useState<number | "current" | "all">("current");
  const [planningRoute, setPlanningRoute] = useState(false);
  const [plannedRoute, setPlannedRoute] = useState<[number, number][]>([]);
  const [plannedRoutes, setPlannedRoutes] = useState<PlannedRoute[]>([]);
  const [plannedRouteName, setPlannedRouteName] = useState("Rota operacional");
  const [routeFeedback, setRouteFeedback] = useState("");
  const [mapFeedback, setMapFeedback] = useState("");

  async function loadOperationalData() {
    try {
      const [geofenceData, deviceData, propertyData] = await Promise.all([
        api.getGeofences(),
        api.getDevices(),
        api.getProperties()
      ]);
      setGeofences(geofenceData.map(normalizeGeofence));
      setDevices(deviceData);
      setProperties(propertyData);
      setSelectedDeviceId((current) => current ?? snapshot?.device.id ?? deviceData[0]?.id ?? null);
      setMapFeedback("");
    } catch (error) {
      setMapFeedback(getErrorMessage(error, "Não foi possível carregar os dados do mapa."));
    }
  }

  useEffect(() => {
    loadOperationalData();
  }, []);

  useEffect(() => {
    if (!snapshot?.device) {
      return;
    }

    setDevices((current) => {
      const exists = current.some((device) => device.id === snapshot.device.id);
      if (!exists) {
        return [snapshot.device, ...current];
      }
      return current.map((device) => (device.id === snapshot.device.id ? snapshot.device : device));
    });
    setSelectedDeviceId((current) => current ?? snapshot.device.id);
  }, [snapshot?.device.id, snapshot?.latestPosition.id]);

  const effectiveDeviceId = selectedDeviceId ?? snapshot?.device.id ?? devices[0]?.id ?? null;
  const selectedDevice =
    snapshot?.device.id === effectiveDeviceId
      ? snapshot.device
      : devices.find((device) => device.id === effectiveDeviceId) ?? null;
  const selectedProperty = selectedDevice
    ? properties.find((property) => property.id === selectedDevice.propertyId) ?? null
    : null;
  const selectedDeviceGeofences = useMemo(
    () => geofences.filter((geofence) => geofence.deviceId === effectiveDeviceId),
    [effectiveDeviceId, geofences]
  );
  const currentGeofence = selectedDeviceGeofences[0] ?? null;

  useEffect(() => {
    if (!effectiveDeviceId) {
      setRecentPositions([]);
      return;
    }

    api.getHistory(String(effectiveDeviceId))
      .then((data) => setRecentPositions(data.slice(0, 20)))
      .catch((error) => setMapFeedback(getErrorMessage(error, "Não foi possível carregar o histórico do trator.")));
  }, [effectiveDeviceId, snapshot?.latestPosition.id]);

  useEffect(() => {
    if (!effectiveDeviceId) {
      setPlannedRoutes([]);
      return;
    }

    api.getPlannedRoutes(effectiveDeviceId)
      .then(setPlannedRoutes)
      .catch((error) => setRouteFeedback(getErrorMessage(error, "Não foi possível carregar as rotas planejadas.")));
  }, [effectiveDeviceId]);

  async function savePlannedRoute() {
    if (!effectiveDeviceId || plannedRoute.length < 2) {
      setRouteFeedback("A rota precisa de pelo menos 2 pontos e um trator selecionado.");
      return;
    }

    try {
      const route = await api.createPlannedRoute({
        name: plannedRouteName,
        deviceId: effectiveDeviceId,
        points: plannedRoute
      });
      setPlannedRoutes((current) => [route, ...current]);
      setRouteFeedback("Rota planejada salva no Firebase.");
    } catch (error) {
      setRouteFeedback(getErrorMessage(error, "Não foi possível salvar a rota."));
    }
  }

  const selectedPosition = recentPositions[0] ?? (snapshot?.device.id === effectiveDeviceId ? snapshot.latestPosition : null);
  const tractorPoint: [number, number] | null = selectedDevice
    ? [selectedDevice.lastLatitude, selectedDevice.lastLongitude]
    : selectedPosition
      ? [selectedPosition.latitude, selectedPosition.longitude]
      : null;
  const center = tractorPoint ?? fallbackCenter;

  const selectedGeofence = useMemo(() => {
    if (selectedGeofenceId === "current") {
      return currentGeofence;
    }

    if (selectedGeofenceId === "all") {
      return null;
    }

    return geofences.find((geofence) => geofence.id === selectedGeofenceId) ?? null;
  }, [currentGeofence, geofences, selectedGeofenceId]);

  const visibleGeofences = useMemo(() => {
    if (selectedGeofenceId === "all") {
      return geofences;
    }

    return selectedGeofence ? [selectedGeofence] : [];
  }, [geofences, selectedGeofence, selectedGeofenceId]);

  const selectedGeofenceDevice = selectedGeofence
    ? devices.find((device) => device.id === selectedGeofence.deviceId)
    : null;
  const selectedGeofenceProperty = selectedGeofence
    ? properties.find((property) => property.id === selectedGeofence.propertyId)
    : null;
  const selectedBounds =
    selectedGeofenceId === "all"
      ? geofences.flatMap((geofence) => geofence.coordinates)
      : selectedGeofence?.coordinates.length
        ? selectedGeofence.coordinates
        : tractorPoint
          ? [tractorPoint]
          : null;
  const geofenceStatuses = tractorPoint
    ? geofences.map((geofence) => ({
        geofence,
        status: (isPointInsidePolygon(tractorPoint, geofence.coordinates) ? "inside" : "outside") as
          | "inside"
          | "outside"
      }))
    : [];
  const selectedGeofenceStatus =
    selectedGeofence && tractorPoint
      ? isPointInsidePolygon(tractorPoint, selectedGeofence.coordinates)
        ? "inside"
        : "outside"
      : null;

  const pathPositions = [...recentPositions]
    .sort((left, right) => left.id - right.id)
    .map((position) => [position.latitude, position.longitude] as [number, number]);
  const latestTelemetryAt = selectedDevice?.lastUpdatedAt ?? selectedPosition?.recordedAt ?? null;

  return (
    <div className="space-y-6">
      <AlertBanner alert={latestAlert} />
      {mapFeedback ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {mapFeedback}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="h-[460px] overflow-hidden p-0 sm:h-[600px] xl:h-[720px]">
          <MapContainer center={center} zoom={16} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportController center={center} enabled={followVehicle && Boolean(tractorPoint)} />
            <MapBoundsController bounds={selectedBounds} enabled={!followVehicle} />
            {planningRoute ? <MapEditor onAddPoint={(point) => setPlannedRoute((current) => [...current, point])} /> : null}
            {visibleGeofences.map((geofence) => (
              <Polygon
                key={geofence.id}
                pathOptions={{
                  color: geofence.deviceId === effectiveDeviceId ? "#2d8a4d" : "#f59e0b",
                  fillOpacity: 0.18,
                  weight: geofence.id === selectedGeofence?.id ? 4 : 2
                }}
                positions={geofence.coordinates}
              >
                <Popup>
                  <strong>{geofence.name}</strong>
                  <br />
                  {geofence.coordinates.length} pontos cadastrados
                </Popup>
              </Polygon>
            ))}
            {pathPositions.length > 1 ? (
              <Polyline pathOptions={{ color: "#174c33", weight: 4, opacity: 0.75 }} positions={pathPositions} />
            ) : null}
            {plannedRoute.length > 1 ? (
              <Polyline pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.75, dashArray: "8 8" }} positions={plannedRoute} />
            ) : null}
            {plannedRoute.map((point, index) => (
              <Marker key={`${point[0]}-${point[1]}-${index}`} position={point} icon={routePointIcon}>
                <Popup>Ponto planejado {index + 1}</Popup>
              </Marker>
            ))}
            {tractorPoint ? (
              <Marker position={tractorPoint} icon={tractorIcon}>
                <Popup>
                  <strong>{selectedDevice?.name ?? selectedPosition?.deviceName ?? "Trator"}</strong>
                  <br />
                  {selectedDevice?.deviceCode ?? "sem código"}
                  <br />
                  {formatDateTime(latestTelemetryAt)}
                </Popup>
              </Marker>
            ) : null}
            {pathPositions.slice(-6).map((point, index) => (
              <CircleMarker
                key={`${point[0]}-${point[1]}-${index}`}
                center={point}
                radius={4}
                pathOptions={{ color: "#174c33", fillColor: "#2d8a4d", fillOpacity: 0.8, weight: 1 }}
              />
            ))}
          </MapContainer>
        </Card>

        <div className="space-y-6">
          <Card title="Trator no mapa">
            <div className="space-y-4 text-sm text-slate-600">
              <label className="block">
                <span className="mb-2 block font-medium text-slate-700">Selecionar trator</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                  value={effectiveDeviceId ?? ""}
                  onChange={(event) => {
                    setSelectedDeviceId(event.target.value ? Number(event.target.value) : null);
                    setFollowVehicle(false);
                    setSelectedGeofenceId("current");
                  }}
                >
                  {devices.length === 0 ? <option value="">Nenhum trator cadastrado</option> : null}
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} - {device.deviceCode}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span>Conexão</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${connectionState === "live" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {connectionState === "live" ? "Ao vivo" : "Fallback"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span>Última leitura</span>
                  <strong className="text-right text-slate-850">{formatDateTime(latestTelemetryAt)}</strong>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span>Propriedade</span>
                  <strong className="text-right text-slate-850">{selectedProperty?.name ?? "Não vinculada"}</strong>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span>Status</span>
                  {selectedDevice ? <StatusBadge value={selectedDevice.geofenceStatus} /> : <span>-</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Latitude</p>
                  <p className="mt-1 font-semibold text-slate-850">{tractorPoint ? tractorPoint[0].toFixed(6) : "-"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Longitude</p>
                  <p className="mt-1 font-semibold text-slate-850">{tractorPoint ? tractorPoint[1].toFixed(6) : "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`rounded-2xl px-4 py-3 font-semibold transition ${
                    followVehicle ? "bg-brand-500 text-white" : "border border-slate-200 text-slate-700"
                  }`}
                  onClick={() => setFollowVehicle((current) => !current)}
                >
                  {followVehicle ? "Seguindo" : "Seguir"}
                </button>
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
                  onClick={loadOperationalData}
                >
                  Atualizar
                </button>
              </div>
            </div>
          </Card>

          <Card title="Rota planejada">
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                {planningRoute
                  ? "Clique no mapa para adicionar pontos da rota planejada."
                  : "Ative o planejamento para desenhar uma rota esperada para o trator selecionado."}
              </p>
              <div className="rounded-2xl bg-slate-50 p-4">
                Pontos planejados: <strong>{plannedRoute.length}</strong>
              </div>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={plannedRouteName}
                onChange={(event) => setPlannedRouteName(event.target.value)}
                placeholder="Nome da rota"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className={`rounded-2xl px-4 py-3 font-semibold transition ${
                    planningRoute ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-700"
                  }`}
                  onClick={() => {
                    setPlanningRoute((current) => !current);
                    setFollowVehicle(false);
                  }}
                >
                  {planningRoute ? "Finalizar" : "Planejar"}
                </button>
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 disabled:opacity-50"
                  disabled={plannedRoute.length === 0}
                  onClick={() => setPlannedRoute((current) => current.slice(0, -1))}
                >
                  Desfazer
                </button>
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 disabled:opacity-50"
                  disabled={plannedRoute.length === 0}
                  onClick={() => setPlannedRoute([])}
                >
                  Limpar
                </button>
                <button
                  className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
                  disabled={plannedRoute.length < 2}
                  onClick={savePlannedRoute}
                >
                  Salvar
                </button>
              </div>
              {plannedRoutes.length > 0 ? (
                <div className="space-y-2">
                  {plannedRoutes.map((route) => (
                    <div key={route.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                      <button
                        className="text-left"
                        onClick={() => {
                          setPlannedRoute(route.points);
                          setPlannedRouteName(route.name);
                          setFollowVehicle(false);
                        }}
                      >
                        <p className="font-semibold text-slate-850">{route.name}</p>
                        <p className="text-xs text-slate-500">{route.points.length} pontos</p>
                      </button>
                      <button
                        className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                        onClick={async () => {
                          await api.deletePlannedRoute(route.id);
                          setPlannedRoutes((current) => current.filter((item) => item.id !== route.id));
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              {routeFeedback ? <p className="text-sm text-slate-500">{routeFeedback}</p> : null}
            </div>
          </Card>

          <Card title="Cercas digitais">
            <div className="space-y-4 text-sm text-slate-600">
              <label className="block">
                <span className="mb-2 block font-medium text-slate-700">Visualizar cerca</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                  value={selectedGeofenceId}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFollowVehicle(false);
                    setSelectedGeofenceId(value === "current" || value === "all" ? value : Number(value));
                  }}
                >
                  <option value="current">Cerca do trator selecionado</option>
                  <option value="all">Todas as cercas cadastradas</option>
                  {geofences.map((geofence) => (
                    <option key={geofence.id} value={geofence.id}>
                      {geofence.name}
                    </option>
                  ))}
                </select>
              </label>

              {selectedGeofence ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-850">{selectedGeofence.name}</p>
                  <p className="mt-1">Propriedade: {selectedGeofenceProperty?.name ?? "Não vinculada"}</p>
                  <p>Trator: {selectedGeofenceDevice?.name ?? "Não vinculado"}</p>
                  <p>Pontos: {selectedGeofence.coordinates.length}</p>
                  <p>Área estimada: {formatAreaHectares(selectedGeofence.coordinates)}</p>
                  {selectedGeofenceStatus ? (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2">
                      <span>Status nesta cerca</span>
                      <StatusBadge value={selectedGeofenceStatus} />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4">
                  {selectedGeofenceId === "all"
                    ? `${geofences.length} cerca(s) cadastrada(s) no mapa.`
                    : "Nenhuma cerca vinculada ao trator selecionado."}
                </div>
              )}

              {selectedGeofenceId === "all" && geofenceStatuses.length > 0 ? (
                <div className="space-y-2">
                  {geofenceStatuses.map(({ geofence, status }) => (
                    <div key={geofence.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                      <div>
                        <p className="font-semibold text-slate-850">{geofence.name}</p>
                        <p className="text-xs text-slate-500">{formatAreaHectares(geofence.coordinates)}</p>
                      </div>
                      <StatusBadge value={status} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Últimos pontos">
            <div className="space-y-3">
              {recentPositions.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma posição recebida para este trator.</p>
              ) : null}
              {recentPositions.slice(0, 8).map((position) => (
                <div key={position.id} className="rounded-2xl border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-800">{new Date(position.recordedAt).toLocaleTimeString("pt-BR")}</span>
                    <StatusBadge value={position.status} />
                  </div>
                  <p className="mt-2 text-slate-500">
                    {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
