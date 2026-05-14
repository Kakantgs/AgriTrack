import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../../agritrack.sqlite");
export const db = new Database(dbPath);
export function initializeDatabase() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      areaHectares REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plate TEXT NOT NULL,
      deviceCode TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      propertyId INTEGER NOT NULL,
      propertyName TEXT NOT NULL,
      lastLatitude REAL NOT NULL,
      lastLongitude REAL NOT NULL,
      lastUpdatedAt TEXT NOT NULL,
      geofenceStatus TEXT NOT NULL,
      online INTEGER NOT NULL,
      FOREIGN KEY(propertyId) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS geofences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      propertyId INTEGER NOT NULL,
      deviceId INTEGER NOT NULL,
      coordinates TEXT NOT NULL,
      FOREIGN KEY(propertyId) REFERENCES properties(id),
      FOREIGN KEY(deviceId) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId INTEGER NOT NULL,
      deviceName TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      status TEXT NOT NULL,
      recordedAt TEXT NOT NULL,
      FOREIGN KEY(deviceId) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId INTEGER NOT NULL,
      deviceName TEXT NOT NULL,
      geofenceName TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      whatsappStatus TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(deviceId) REFERENCES devices(id)
    );
  `);
}
