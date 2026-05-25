import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

export const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(6)
});

export const propertySchema = z.object({
  name: nonEmptyString,
  location: nonEmptyString,
  areaHectares: z.coerce.number().positive()
});

export const deviceSchema = z.object({
  name: nonEmptyString,
  plate: nonEmptyString,
  deviceCode: nonEmptyString,
  status: z.enum(["active", "inactive"]),
  propertyId: z.coerce.number().int().positive()
});

export const geofenceSchema = z.object({
  name: nonEmptyString,
  propertyId: z.coerce.number().int().positive(),
  deviceId: z.coerce.number().int().positive(),
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(3)
});

export const telemetrySchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const payload = value as Record<string, unknown>;

  return {
    ...payload,
    deviceCode: payload.deviceCode ?? payload.deviceId,
    latitude: payload.latitude ?? payload.lat,
    longitude: payload.longitude ?? payload.lng
  };
}, z.object({
  deviceCode: nonEmptyString,
  deviceToken: nonEmptyString.optional(),
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
  timestamp: z.string().datetime().optional(),
  battery: z.coerce.number().gte(0).lte(100).optional(),
  speed: z.coerce.number().gte(0).optional()
}));

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2),
  role: z.enum(["admin", "operator"])
});

export const plannedRouteSchema = z.object({
  name: nonEmptyString,
  deviceId: z.coerce.number().int().positive(),
  points: z.array(z.tuple([z.number(), z.number()])).min(2)
});

export const whatsappSettingsSchema = z.object({
  webhookUrl: z.string().trim().url().or(z.literal("")),
  token: z.string().trim().optional()
});
