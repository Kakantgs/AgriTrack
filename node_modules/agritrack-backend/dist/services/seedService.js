import { insertWithIncrement, listCollection } from "./repository.js";
const seedCoordinates = [
    [-21.732715, -43.349583],
    [-21.732715, -43.345783],
    [-21.729715, -43.345783],
    [-21.729715, -43.349583]
];
export async function seedDatabase() {
    const users = await listCollection("users");
    if (users.length > 0) {
        return;
    }
    const now = new Date().toISOString();
    await insertWithIncrement("users", {
        email: "admin@agritrack.com",
        password: "123456",
        name: "Administrador AgriTrack"
    });
    await insertWithIncrement("properties", {
        name: "Sítio Santa Luzia",
        location: "Juiz de Fora - MG",
        areaHectares: 124
    });
    await insertWithIncrement("devices", {
        name: "Trator Massey 275",
        plate: "AGT-0275",
        deviceCode: "ESP32-GPS-001",
        status: "active",
        propertyId: 1,
        propertyName: "Sítio Santa Luzia",
        lastLatitude: -21.7317,
        lastLongitude: -43.3488,
        lastUpdatedAt: now,
        geofenceStatus: "inside",
        online: true
    });
    await insertWithIncrement("geofences", {
        name: "Área de Trabalho 01",
        propertyId: 1,
        deviceId: 1,
        coordinates: seedCoordinates
    });
    await insertWithIncrement("positions", {
        deviceId: 1,
        deviceName: "Trator Massey 275",
        latitude: -21.7317,
        longitude: -43.3488,
        status: "inside",
        recordedAt: now
    });
}
