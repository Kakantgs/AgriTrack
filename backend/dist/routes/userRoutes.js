import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { auditLog } from "../services/auditService.js";
import { listCollection, patchWhereId } from "../services/repository.js";
import { userUpdateSchema } from "../validation/schemas.js";
export const userRoutes = Router();
function sanitizeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ?? (user.email === "admin@agritrack.com" ? "admin" : "operator"),
        createdAt: user.createdAt ?? null
    };
}
userRoutes.get("/", async (_request, response) => {
    try {
        const users = await listCollection("users");
        response.json(users.sort((left, right) => right.id - left.id).map(sanitizeUser));
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao listar usuários" });
    }
});
userRoutes.put("/:id", validateBody(userUpdateSchema), async (request, response) => {
    try {
        const id = Number(request.params.id);
        const name = String(request.body.name ?? "").trim();
        const role = request.body.role === "admin" ? "admin" : "operator";
        if (name.length < 2) {
            response.status(400).json({ message: "Informe o nome do usuário" });
            return;
        }
        const user = await patchWhereId("users", id, { name, role });
        if (!user) {
            response.status(404).json({ message: "Usuário não encontrado" });
            return;
        }
        auditLog({ action: "users.update", actor: request.user, target: `users/${user.id}` });
        response.json(sanitizeUser(user));
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao atualizar usuário" });
    }
});
