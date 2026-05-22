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
export const telemetrySchema = z.object({
    deviceCode: nonEmptyString,
    deviceToken: nonEmptyString.optional(),
    latitude: z.number().gte(-90).lte(90),
    longitude: z.number().gte(-180).lte(180),
    timestamp: z.string().datetime().optional(),
    battery: z.number().gte(0).lte(100).optional(),
    speed: z.number().gte(0).optional()
});
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
