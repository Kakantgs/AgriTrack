import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { publicUser, hashPassword, signAuthToken, verifyPassword } from "../services/authService.js";
import { auditLog } from "../services/auditService.js";
import { insertWithIncrement, listCollection, updateWhereId, type User } from "../services/repository.js";
import { loginSchema, registerSchema } from "../validation/schemas.js";

export const authRoutes = Router();

function createSession(user: User) {
  return {
    token: signAuthToken(user),
    user: publicUser(user)
  };
}

authRoutes.post("/login", validateBody(loginSchema), async (request, response) => {
  try {
    const { email, password } = request.body;

    const users = await listCollection("users");
    const user = users.find((item) => item.email.toLowerCase() === email);

    if (!user || !verifyPassword(user, password)) {
      response.status(401).json({ message: "Credenciais inválidas" });
      return;
    }

    let sessionUser = user;
    if (!user.passwordHash || !user.passwordSalt || user.password) {
      const migrated = await updateWhereId("users", user.id, (current) => {
        const next = {
          ...current,
          ...hashPassword(password)
        };
        delete next.password;
        return next;
      });
      sessionUser = migrated ?? user;
    }

    auditLog({ action: "auth.login", actor: publicUser(sessionUser), target: `users/${sessionUser.id}` });
    response.json(createSession(sessionUser));
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao autenticar" });
  }
});

authRoutes.post("/register", validateBody(registerSchema), async (request, response) => {
  try {
    const { name, email, password } = request.body;

    const users = await listCollection("users");
    const emailInUse = users.some((item) => item.email.toLowerCase() === email);

    if (emailInUse) {
      response.status(409).json({ message: "Este e-mail já está cadastrado" });
      return;
    }

    const user = await insertWithIncrement("users", {
      name,
      email,
      ...hashPassword(password),
      role: users.length === 0 ? "admin" : "operator",
      createdAt: new Date().toISOString()
    });

    auditLog({ action: "auth.register", actor: publicUser(user), target: `users/${user.id}` });
    response.status(201).json(createSession(user));
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao criar conta" });
  }
});
