import { FormEvent, useEffect, useState } from "react";
import { Card } from "../components/Card";
import { api } from "../services/api";

export function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [token, setToken] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    api.getWhatsappSettings().then((settings) => {
      setWebhookUrl(settings.webhookUrl);
      setHasToken(settings.hasToken);
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const settings = await api.updateWhatsappSettings({ webhookUrl, token });
    setWebhookUrl(settings.webhookUrl);
    setHasToken(settings.hasToken);
    setToken("");
    setFeedback("Configurações de WhatsApp salvas.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-850">Configurações</h1>
        <p className="mt-2 text-sm text-slate-500">Parâmetros operacionais usados pelo backend.</p>
      </div>

      <Card title="Webhook WhatsApp">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">URL do webhook</span>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
              placeholder="https://sua-api.exemplo/webhook"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Token Bearer opcional</span>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder={hasToken ? "Token já configurado. Preencha para substituir." : "Token opcional"}
            />
          </label>
          <button className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">Salvar configuração</button>
          {feedback ? <p className="text-sm text-brand-700">{feedback}</p> : null}
        </form>
      </Card>
    </div>
  );
}
