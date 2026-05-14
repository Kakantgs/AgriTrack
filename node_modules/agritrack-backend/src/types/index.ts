export type DeviceStatus = "active" | "inactive";
export type GeofenceStatus = "inside" | "outside";
export type WhatsappStatus = "simulado" | "enviado" | "erro";

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
  status: DeviceStatus;
  propertyId: number;
  propertyName: string;
  lastLatitude: number;
  lastLongitude: number;
  lastUpdatedAt: string;
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

export type Position = {
  id: number;
  deviceId: number;
  deviceName: string;
  latitude: number;
  longitude: number;
  status: GeofenceStatus;
  recordedAt: string;
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
