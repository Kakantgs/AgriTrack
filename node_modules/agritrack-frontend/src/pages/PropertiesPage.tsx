import { FormEvent, useEffect, useState } from "react";
import { Card } from "../components/Card";
import { api } from "../services/api";
import type { Property } from "../types";

export function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "Sítio Santa Luzia",
    location: "Juiz de Fora - MG",
    areaHectares: 124
  });
  const [feedback, setFeedback] = useState("");

  async function load() {
    const data = await api.getProperties();
    setProperties(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name || !form.location || form.areaHectares <= 0) {
      setFeedback("Informe nome, localização e área válida.");
      return;
    }
    if (editingId) {
      await api.updateProperty(editingId, form);
      setFeedback("Propriedade atualizada com sucesso.");
    } else {
      await api.createProperty(form);
      setFeedback("Propriedade cadastrada com sucesso.");
    }
    setForm({ name: "", location: "", areaHectares: 0 });
    setEditingId(null);
    load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card title="Cadastrar propriedade rural">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Nome da propriedade"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Localização"
            value={form.location}
            onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
          />
          <input
            type="number"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Área em hectares"
            value={form.areaHectares}
            onChange={(event) => setForm((current) => ({ ...current, areaHectares: Number(event.target.value) }))}
          />
          <div className="flex flex-wrap gap-3">
            <button className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">
              {editingId ? "Atualizar propriedade" : "Salvar propriedade"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", location: "", areaHectares: 0 });
                  setFeedback("");
                }}
              >
                Cancelar edição
              </button>
            ) : null}
          </div>
          {feedback ? <p className="text-sm text-slate-500">{feedback}</p> : null}
        </form>
      </Card>

      <Card title="Propriedades cadastradas">
        <div className="mb-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Total de propriedades</p>
          <p className="mt-2 text-2xl font-bold text-slate-850">{properties.length}</p>
        </div>
        <div className="space-y-4">
          {properties.map((property) => (
            <div key={property.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-850">{property.name}</p>
              <p className="text-sm text-slate-500">{property.location}</p>
              <p className="mt-2 text-sm text-slate-600">{property.areaHectares} hectares</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                  onClick={() => {
                    setEditingId(property.id);
                    setForm({
                      name: property.name,
                      location: property.location,
                      areaHectares: property.areaHectares
                    });
                    setFeedback("Modo edição ativo.");
                  }}
                >
                  Editar
                </button>
                <button
                  className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                  onClick={async () => {
                    await api.deleteProperty(property.id);
                    if (editingId === property.id) {
                      setEditingId(null);
                      setForm({ name: "", location: "", areaHectares: 0 });
                    }
                    setFeedback("Propriedade excluída.");
                    load();
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
