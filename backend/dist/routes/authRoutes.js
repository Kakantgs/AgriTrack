import { Router } from "express";
import { listCollection } from "../services/repository.js";
export const authRoutes = Router();
authRoutes.post("/login", async (request, response) => {
    try {
        const { email, password } = request.body;
        const users = await listCollection("users");
        const user = users.find((item) => item.email === email && item.password === password);
        if (!user) {
            response.status(401).json({ message: "Credenciais inválidas" });
            return;
        }
        response.json({
            token: "agritrack-demo-token",
            user: {
                email: user.email,
                name: user.name
            }
        });
    }
    catch (error) {
        response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao autenticar" });
    }
});
