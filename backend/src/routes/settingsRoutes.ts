import { Router } from "express";
import { requireRole } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import { auditLog } from "../services/auditService.js";
import { readSingleton, writeSingleton } from "../services/repository.js";
import { whatsappSettingsSchema } from "../validation/schemas.js";

export const settingsRoutes = Router();

settingsRoutes.get("/whatsapp", async (_request, response) => {
  try {
    const settings = await readSingleton("settings");
    const whatsapp = settings?.whatsapp ?? {};
    response.json({
      webhookUrl: whatsapp.webhookUrl ?? process.env.WHATSAPP_WEBHOOK_URL ?? "",
      hasToken: Boolean(whatsapp.token || process.env.WHATSAPP_WEBHOOK_TOKEN)
    });
  } catch (error) {
    response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao buscar configurações" });
  }
});

settingsRoutes.put(
  "/whatsapp",
  requireRole("admin"),
  validateBody(whatsappSettingsSchema),
  async (request, response) => {
    try {
      const current = (await readSingleton("settings")) ?? {};
      const next = {
        ...current,
        whatsapp: Object.fromEntries(
          Object.entries({
            webhookUrl: request.body.webhookUrl || null,
            token: request.body.token || null
          }).filter(([, value]) => value)
        )
      };
      await writeSingleton("settings", next);
      auditLog({ action: "settings.whatsapp.update", actor: request.user, target: "settings/whatsapp" });
      response.json({ webhookUrl: next.whatsapp.webhookUrl ?? "", hasToken: Boolean(next.whatsapp.token) });
    } catch (error) {
      response.status(500).json({ message: error instanceof Error ? error.message : "Erro ao salvar configurações" });
    }
  }
);
