import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polygon, Polyline, Popup, TileLayer } from "react-leaflet";
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

const tractorIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconAnchor: [12, 41]
});

export function MapPage() {
  const { snapshot, latestAlert, connectionState } = useRealtime();
  const [followVehicle, setFollowVehicle] = useState(true);
  const [recentPositions, setRecentPositions] = useState<Position[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedGeofenceId, setSelectedGeofenceId] = useState<number | "current" | "all">("current");
  const [planningRoute, setPlanningRoute] = useState(false);
  const [plannedRoute, setPlannedRoute] = useState<[number, number][]>([]);
  const [plannedRoutes, setPlannedRoutes] = useState<PlannedRoute[]>([]);
  const [plannedRouteName, setPlannedRouteName] = useState("Rota operacional");
  const [routeFeedback, setRouteFeedback] = useState("");

  useEffect(() => {
    api.getHistory("1").then((data) => setRecentPositions(data.slice(0, 8)));
  }, [snapshot?.latestPosition.id]);

  useEffect(() => {
    Promise.all([api.getGeofences(), api.getDevices(), api.getProperties()]).then(
      ([geofenceData, deviceData, propertyData]) => {
        setGeofences(geofenceData);
        setDevices(deviceData);
        setProperties(propertyData);
      }
    );
  }, []);

  useEffect(() => {
    if (!snapshot?.device.id) {
      return;
    }

    api.getPlannedRoutes(snapshot.device.id).then(setPlannedRoutes);
  }, [snapshot?.device.id]);

  async function savePlannedRoute() {
    if (!snapshot?.device.id || plannedRoute.length < 2) {
      setRouteFeedback("A rota precisa de pelo menos 2 pontos e um trator ativo.");
      return;
    }

    const route = await api.createPlannedRoute({
      name: plannedRouteName,
      deviceId: snapshot.device.id,
      points: plannedRoute
    });
    setPlannedRoutes((current) => [route, ...current]);
    setRouteFeedback("Rota planejada salva no Firebase.");
  }

  const center = useMemo<[number, number]>(() => {
    if (!snapshot) {
      return [-23.533773, -46.62529];
    }
    return [snapshot.device.lastLatitude, snapshot.device.lastLongitude];
  }, [snapshot]);

  const selectedGeofence = useMemo(() => {
    if (selectedGeofenceId === "current") {
      return snapshot?.geofence ?? null;
    }

    if (selectedGeofenceId === "all") {
      return null;
    }

    return geofences.find((geofence) => geofence.id === selectedGeofenceId) ?? null;
  }, [geofences, selectedGeofenceId, snapshot?.geofence]);

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
  const selectedBounds = selectedGeofenceId === "all" ? geofences.flatMap((geofence) => geofence.coordinates) : selectedGeofence?.coordinates ?? null;
  const tractorPoint: [number, number] | null = snapshot
    ? [snapshot.device.lastLatitude, snapshot.device.lastLongitude]
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

  return (
    <div className="space-y-6">
      <AlertBanner alert={latestAlert} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="h-[420px] overflow-hidden p-0 sm:h-[540px] xl:h-[620px]">
          <MapContainer center={center} zoom={16} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportController center={center} enabled={followVehicle} />
            <MapBoundsController bounds={selectedBounds} enabled={!followVehicle} />
            {planningRoute ? <MapEditor onAddPoint={(point) => setPlannedRoute((current) => [...current, point])} /> : null}
            {visibleGeofences.map((geofence) => (
              <Polygon
                key={geofence.id}
                pathOptions={{
                  color: geofence.id === snapshot?.geofence?.id ? "#2d8a4d" : "#f59e0b",
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
            {recentPositions.length > 1 ? (
              <Polyline
                pathOptions={{ color: "#174c33", dashArray: "6 8", opacity: 0.7 }}
                positions={recentPositions.map((position) => [position.latitude, position.longitude])}
              />
            ) : null}
            {plannedRoute.length > 1 ? (
              <Polyline pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.75 }} positions={plannedRoute} />
            ) : null}
            {snapshot ? (
              <Marker position={[snapshot.device.lastLatitude, snapshot.device.lastLongitude]} icon={tractorIcon}>
                <Popup>
                  <strong>{snapshot.device.name}</strong>
                  <br />
                  {snapshot.device.deviceCode}
                </Popup>
              </Marker>
            ) : null}
          </MapContainer>
        </Card>

        <div className="space-y-6">
          <Card title="Rota planejada">
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                {planningRoute
                  ? "Clique no mapa para adicionar pontos da rota planejada."
                  : "Ative o planejamento para desenhar uma rota esperada e comparar visualmente com o trajeto real."}
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
                  {planningRoute ? "Finalizar desenho" : "Planejar rota"}
                </button>
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 disabled:opacity-50"
                  disabled={plannedRoute.length === 0}
                  onClick={() => setPlannedRoute((current) => current.slice(0, -1))}
                >
                  Desfazer ponto
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
                  Salvar rota
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
                  <option value="current">Cerca do trator em tempo real</option>
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
                      <span>Status do trator nesta cerca</span>
                      <StatusBadge value={selectedGeofenceStatus} />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4">
                  {selectedGeofenceId === "all"
                  ? `${geofences.length} cerca(s) cadastrada(s) no mapa.`
                    : "Nenhuma cerca vinculada ao trator atual."}
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

          <Card title="Telemetria">
            {snapshot ? (
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span>Conexão</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${connectionState === "live" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {connectionState === "live" ? "Ao vivo" : "Fallback ativo"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Trator</span>
                  <strong className="text-slate-850">{snapshot.device.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dispositivo</span>
                  <strong className="text-slate-850">{snapshot.device.deviceCode}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <StatusBadge value={snapshot.device.geofenceStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Latitude</span>
                  <strong className="text-slate-850">{snapshot.device.lastLatitude.toFixed(6)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Longitude</span>
                  <strong className="text-slate-850">{snapshot.device.lastLongitude.toFixed(6)}</strong>
                </div>
                <button
                  className={`w-full rounded-2xl px-4 py-3 font-semibold transition ${
                    followVehicle ? "bg-brand-500 text-white" : "border border-slate-200 text-slate-700"
                  }`}
                  onClick={() => setFollowVehicle((current) => !current)}
                >
                  {followVehicle ? "Seguindo trator automaticamente" : "Ativar seguimento automático"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aguardando telemetria real do dispositivo.</p>
            )}
          </Card>

          <Card title="Últimos pontos">
            <div className="space-y-3">
              {recentPositions.map((position) => (
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
