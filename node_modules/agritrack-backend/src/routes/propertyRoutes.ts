import { Router } from "express";
import { insertWithIncrement, listCollection } from "../services/repository.js";

export const propertyRoutes = Router();

propertyRoutes.get("/", async (_request, response) => {
  try {
    const rows = await listCollection("properties");
    response.json(rows.sort((left, right) => right.id - left.id));
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao listar propriedades" });
  }
});

propertyRoutes.post("/", async (request, response) => {
  try {
    const { name, location, areaHectares } = request.body;
    const property = await insertWithIncrement("properties", { name, location, areaHectares });
    response.status(201).json(property);
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao criar propriedade" });
  }
});
