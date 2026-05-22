import crypto from "node:crypto";
const tokenSecret = process.env.AUTH_TOKEN_SECRET ?? process.env.FIREBASE_PROJECT_ID ?? "agritrack-local-secret";
function base64UrlEncode(value) {
    return Buffer.from(value).toString("base64url");
}
function base64UrlDecode(value) {
    return Buffer.from(value, "base64url").toString("utf-8");
}
function getUserRole(user) {
    return user.role ?? (user.email === "admin@agritrack.com" ? "admin" : "operator");
}
export function publicUser(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: getUserRole(user)
    };
}
export function signAuthToken(user) {
    const payload = {
        ...publicUser(user),
        exp: Date.now() + 1000 * 60 * 60 * 12
    };
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = crypto.createHmac("sha256", tokenSecret).update(encodedPayload).digest("base64url");
    return `${encodedPayload}.${signature}`;
}
export function verifyAuthToken(token) {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) {
        return null;
    }
    const expectedSignature = crypto.createHmac("sha256", tokenSecret).update(encodedPayload).digest("base64url");
    if (expectedSignature.length !== signature.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
    }
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (!payload.exp || payload.exp < Date.now()) {
        return null;
    }
    return {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role
    };
}
export function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return { passwordHash, passwordSalt: salt };
}
export function verifyPassword(user, password) {
    if (user.passwordHash && user.passwordSalt) {
        const storedHash = Buffer.from(user.passwordHash, "hex");
        const receivedHash = crypto.scryptSync(password, user.passwordSalt, 64);
        return storedHash.length === receivedHash.length && crypto.timingSafeEqual(storedHash, receivedHash);
    }
    return user.password === password;
}
