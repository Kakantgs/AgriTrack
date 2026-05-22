import { verifyAuthToken } from "../services/authService.js";
export function requireAuth(request, response, next) {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    const user = token ? verifyAuthToken(token) : null;
    if (!user) {
        response.status(401).json({ message: "Autenticação obrigatória" });
        return;
    }
    request.user = user;
    next();
}
export function requireRole(...roles) {
    return (request, response, next) => {
        if (!request.user) {
            response.status(401).json({ message: "Autenticação obrigatória" });
            return;
        }
        if (!roles.includes(request.user.role)) {
            response.status(403).json({ message: "Permissão insuficiente" });
            return;
        }
        next();
    };
}
