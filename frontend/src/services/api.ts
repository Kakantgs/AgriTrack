import type {
  Alert,
  DashboardData,
  Device,
  Geofence,
  LoginResponse,
  Position,
  Property,
  RealtimePayload,
  SimulatorState,
  TelemetryPayload
} from "../types";

const API_URL = "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro desconhecido" }));
    throw new Error(error.message ?? "Erro na requisição");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  getDashboard: () => request<DashboardData>("/dashboard"),
  getProperties: () => request<Property[]>("/properties"),
  createProperty: (payload: Omit<Property, "id">) =>
    request<Property>("/properties", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateProperty: (id: number, payload: Omit<Property, "id">) =>
    request<Property>(`/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteProperty: (id: number) =>
    request<void>(`/properties/${id}`, {
      method: "DELETE"
    }),
  getDevices: () => request<Device[]>("/devices"),
  createDevice: (
    payload: Omit<
      Device,
      | "id"
      | "propertyName"
      | "lastLatitude"
      | "lastLongitude"
      | "lastUpdatedAt"
      | "geofenceStatus"
      | "online"
    >
  ) =>
    request<Device>("/devices", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateDevice: (
    id: number,
    payload: Omit<
      Device,
      | "id"
      | "propertyName"
      | "lastLatitude"
      | "lastLongitude"
      | "lastUpdatedAt"
      | "geofenceStatus"
      | "online"
    >
  ) =>
    request<Device>(`/devices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteDevice: (id: number) =>
    request<void>(`/devices/${id}`, {
      method: "DELETE"
    }),
  getGeofences: () => request<Geofence[]>("/geofences"),
  createGeofence: (payload: Omit<Geofence, "id">) =>
    request<Geofence>("/geofences", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateGeofence: (id: number, payload: Omit<Geofence, "id">) =>
    request<Geofence>(`/geofences/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteGeofence: (id: number) =>
    request<void>(`/geofences/${id}`, {
      method: "DELETE"
    }),
  getHistory: (deviceId?: string, date?: string) =>
    request<Position[]>(
      `/history${deviceId || date ? `?deviceId=${deviceId ?? ""}&date=${date ?? ""}` : ""}`
    ),
  getAlerts: () => request<Alert[]>("/alerts"),
  getRealtimeSnapshot: () => request<RealtimePayload>("/realtime"),
  sendTelemetry: (payload: TelemetryPayload) =>
    request("/telemetry", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getSimulator: () => request<SimulatorState>("/simulator"),
  startSimulator: () => request<SimulatorState>("/simulator/start", { method: "POST" }),
  pauseSimulator: () => request<SimulatorState>("/simulator/pause", { method: "POST" }),
  resetSimulator: () => request("/simulator/reset", { method: "POST" }),
  stepSimulator: () => request("/simulator/step", { method: "POST" }),
  forceSimulatorExit: () => request("/simulator/force-exit", { method: "POST" }),
  updateSimulator: (intervalMs: number) =>
    request<SimulatorState>("/simulator", {
      method: "PUT",
      body: JSON.stringify({ intervalMs })
    })
};
