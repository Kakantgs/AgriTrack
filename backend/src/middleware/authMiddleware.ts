import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken, type AuthRole, type AuthSession } from "../services/authService.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthSession;
  }
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
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

export function requireRole(...roles: AuthRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
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
