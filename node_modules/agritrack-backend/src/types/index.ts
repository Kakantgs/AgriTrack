export type DeviceStatus = "active" | "inactive";
export type GeofenceStatus = "inside" | "outside";
export type WhatsappStatus = "pendente" | "enviado" | "erro";

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
  status: DeviceStatus;
  propertyId: number;
  propertyName: string;
  lastLatitude: number;
  lastLongitude: number;
  lastUpdatedAt: string;
  lastSpeed?: number | null;
  lastBattery?: number | null;
  geofenceStatus: GeofenceStatus;
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
  status: GeofenceStatus;
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
  whatsappStatus: WhatsappStatus;
  createdAt: string;
};

export type AppSettings = {
  whatsapp?: {
    webhookUrl?: string;
    token?: string;
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
