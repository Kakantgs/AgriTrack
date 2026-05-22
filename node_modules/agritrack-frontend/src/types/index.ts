export type LoginResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role?: "admin" | "operator";
  };
};

export type UserAccount = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator";
  createdAt: string | null;
};

export type WhatsappSettings = {
  webhookUrl: string;
  hasToken: boolean;
};

export type Property = {
  id: number;
  name: string;
  location: string;
  areaHectares: number;
};

export type Device = {
  id: number;
  name: string;
  plate: string;
  deviceCode: string;
  deviceToken?: string;
  status: "active" | "inactive";
  propertyId: number;
  propertyName: string;
  lastLatitude: number;
  lastLongitude: number;
  lastUpdatedAt: string;
  lastSpeed?: number | null;
  lastBattery?: number | null;
  geofenceStatus: "inside" | "outside";
  online: boolean;
};

export type Geofence = {
  id: number;
  name: string;
  propertyId: number;
  deviceId: number;
  coordinates: [number, number][];
};

export type PlannedRoute = {
  id: number;
  name: string;
  deviceId: number;
  points: [number, number][];
  createdAt: string;
};

export type Position = {
  id: number;
  deviceId: number;
  deviceName: string;
  latitude: number;
  longitude: number;
  status: "inside" | "outside";
  recordedAt: string;
  speed?: number | null;
  battery?: number | null;
};

export type Alert = {
  id: number;
  deviceId: number;
  deviceName: string;
  geofenceName: string;
  type: "geofence_exit";
  message: string;
  whatsappStatus: "pendente" | "enviado" | "erro";
  createdAt: string;
};

export type DashboardData = {
  totalDevices: number;
  onlineDevices: number;
  lastPosition: Position | null;
  latestAlert: Alert | null;
  latestTelemetryAgeMinutes: number | null;
  statusSummary: {
    inside: number;
    outside: number;
  };
};

export type TelemetryPayload = {
  deviceCode: string;
  deviceToken?: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  battery?: number;
  speed?: number;
};

export type RealtimePayload = {
  device: Device;
  geofence: Geofence | null;
  latestPosition: Position;
  latestAlert: Alert | null;
};
