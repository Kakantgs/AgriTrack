import crypto from "node:crypto";
export function generateDeviceToken() {
    return crypto.randomBytes(32).toString("hex");
}
