import type {
  Alert,
  DashboardData,
  Device,
  Geofence,
  LoginResponse,
  Position,
  Property,
  RealtimePayload
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
  getGeofences: () => request<Geofence[]>("/geofences"),
  createGeofence: (payload: Omit<Geofence, "id">) =>
    request<Geofence>("/geofences", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getHistory: (deviceId?: string, date?: string) =>
    request<Position[]>(
      `/history${deviceId || date ? `?deviceId=${deviceId ?? ""}&date=${date ?? ""}` : ""}`
    ),
  getAlerts: () => request<Alert[]>("/alerts"),
  getRealtimeSnapshot: () => request<RealtimePayload>("/realtime")
};
