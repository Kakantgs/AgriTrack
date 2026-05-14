export type LoginResponse = {
  token: string;
  user: {
    email: string;
    name: string;
  };
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
  status: "active" | "inactive";
  propertyId: number;
  propertyName: string;
  lastLatitude: number;
  lastLongitude: number;
  lastUpdatedAt: string;
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

export type Position = {
  id: number;
  deviceId: number;
  deviceName: string;
  latitude: number;
  longitude: number;
  status: "inside" | "outside";
  recordedAt: string;
};

export type Alert = {
  id: number;
  deviceId: number;
  deviceName: string;
  geofenceName: string;
  type: "geofence_exit";
  message: string;
  whatsappStatus: "simulado" | "enviado" | "erro";
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

export type SimulatorState = {
  mode: "running" | "paused";
  currentIndex: number;
  intervalMs: number;
  lastTickAt: string | null;
};

export type TelemetryPayload = {
  deviceCode: string;
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
  simulator: SimulatorState;
};
