import type {
  Alert,
  DashboardData,
  Device,
  Geofence,
  LoginResponse,
  PlannedRoute,
  Position,
  Property,
  RealtimePayload,
  TelemetryPayload,
  UserAccount,
  WhatsappSettings
} from "../types";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const token = localStorage.getItem("agritrack-token");

  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {})
      },
      ...init
    });
  } catch {
    throw new Error("Backend offline. Inicie o servidor e verifique a credencial do Firebase.");
  }

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
  register: (name: string, email: string, password: string) =>
    request<LoginResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    }),
  getDashboard: (filters?: { propertyId?: string; deviceId?: string; date?: string }) => {
    const params = new URLSearchParams();
    if (filters?.propertyId) params.set("propertyId", filters.propertyId);
    if (filters?.deviceId) params.set("deviceId", filters.deviceId);
    if (filters?.date) params.set("date", filters.date);
    const query = params.toString();
    return request<DashboardData>(`/dashboard${query ? `?${query}` : ""}`);
  },
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
      | "deviceToken"
      | "lastLatitude"
      | "lastLongitude"
      | "lastUpdatedAt"
      | "lastSpeed"
      | "lastBattery"
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
      | "deviceToken"
      | "lastLatitude"
      | "lastLongitude"
      | "lastUpdatedAt"
      | "lastSpeed"
      | "lastBattery"
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
  rotateDeviceToken: (id: number) => request<Device>(`/devices/${id}/rotate-token`, { method: "POST" }),
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
  getPlannedRoutes: (deviceId?: number) =>
    request<PlannedRoute[]>(`/planned-routes${deviceId ? `?deviceId=${deviceId}` : ""}`),
  createPlannedRoute: (payload: Omit<PlannedRoute, "id" | "createdAt">) =>
    request<PlannedRoute>("/planned-routes", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deletePlannedRoute: (id: number) =>
    request<void>(`/planned-routes/${id}`, {
      method: "DELETE"
    }),
  getHistory: (deviceId?: string, date?: string) =>
    request<Position[]>(
      `/history${deviceId || date ? `?deviceId=${deviceId ?? ""}&date=${date ?? ""}` : ""}`
    ),
  getAlerts: () => request<Alert[]>("/alerts"),
  getUsers: () => request<UserAccount[]>("/users"),
  updateUser: (id: number, payload: Pick<UserAccount, "name" | "role">) =>
    request<UserAccount>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  getWhatsappSettings: () => request<WhatsappSettings>("/settings/whatsapp"),
  updateWhatsappSettings: (payload: { webhookUrl: string; token?: string }) =>
    request<WhatsappSettings>("/settings/whatsapp", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  getRealtimeSnapshot: () => request<RealtimePayload>("/realtime"),
  sendTelemetry: (payload: TelemetryPayload) =>
    request("/telemetry", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
