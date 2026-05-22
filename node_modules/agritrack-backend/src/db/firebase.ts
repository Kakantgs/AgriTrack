import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applicationDefault, cert, getApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getDatabase as getAdminDatabase, type Database as AdminDatabase } from "firebase-admin/database";
import { initializeApp } from "firebase/app";
import { getDatabase, type Database as ClientDatabase } from "firebase/database";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function unquoteEnvValue(value: string) {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if ((quote === `"` || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadFirebaseEnvFile() {
  const envPath = path.resolve(__dirname, "../../firebase.env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf-8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = unquoteEnvValue(line.slice(separatorIndex + 1));

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value;
  }
}

loadFirebaseEnvFile();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY ?? "AIzaSyARsat46fM6gq7RHBZNM35Md29_PrW1Sls",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? "apphorta-ca6b7.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL ?? "https://apphorta-ca6b7-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID ?? "apphorta-ca6b7",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "apphorta-ca6b7.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? "725625290947",
  appId: process.env.FIREBASE_APP_ID ?? "1:725625290947:web:309b1c46370a9d4bae6276",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID ?? "G-1GLE5CPDET"
};

type FirebaseConnection =
  | {
      mode: "admin";
      db: AdminDatabase;
    }
  | {
      mode: "client";
      db: ClientDatabase;
    };

function parseServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const defaultServiceAccountPath = path.resolve(__dirname, "../../service-account.json");
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? defaultServiceAccountPath;

  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson) as Record<string, string>;
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return cert(parsed);
  }

  if (fs.existsSync(serviceAccountPath)) {
    const parsed = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8")) as Record<string, string>;
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return cert(parsed);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return applicationDefault();
  }

  return null;
}

function createFirebaseConnection(): FirebaseConnection {
  const adminCredential = parseServiceAccount();

  if (adminCredential) {
    const app =
      getApps()[0] ??
      initializeAdminApp({
        credential: adminCredential,
        databaseURL: firebaseConfig.databaseURL
      });

    return { mode: "admin", db: getAdminDatabase(app) };
  }

  const app = initializeApp(firebaseConfig);
  return { mode: "client", db: getDatabase(app) };
}

export const firebaseConnection = createFirebaseConnection();
