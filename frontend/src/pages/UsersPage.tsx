import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { api } from "../services/api";
import type { UserAccount } from "../types";

export function UsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [feedback, setFeedback] = useState("");

  async function load() {
    const data = await api.getUsers();
    setUsers(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateUser(user: UserAccount, patch: Pick<UserAccount, "name" | "role">) {
    const updated = await api.updateUser(user.id, patch);
    setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setFeedback("Usuário atualizado.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-850">Usuários e perfis</h1>
        <p className="mt-2 text-sm text-slate-500">
          Gerencie os operadores cadastrados. Esta tela prepara a base para permissões por perfil.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Usuários</p>
          <p className="mt-2 text-3xl font-bold text-slate-850">{users.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Administradores</p>
          <p className="mt-2 text-3xl font-bold text-brand-700">
            {users.filter((user) => user.role === "admin").length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Operadores</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {users.filter((user) => user.role === "operator").length}
          </p>
        </Card>
      </div>

      <Card title="Contas cadastradas">
        {feedback ? <p className="mb-4 text-sm text-brand-700">{feedback}</p> : null}
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
              <div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-850"
                  value={user.name}
                  onChange={(event) =>
                    setUsers((current) =>
                      current.map((item) => (item.id === user.id ? { ...item, name: event.target.value } : item))
                    )
                  }
                />
                <p className="mt-2 text-sm text-slate-500">{user.email}</p>
              </div>
              <select
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={user.role}
                onChange={(event) =>
                  updateUser(user, {
                    name: user.name,
                    role: event.target.value === "admin" ? "admin" : "operator"
                  })
                }
              >
                <option value="operator">Operador</option>
                <option value="admin">Administrador</option>
              </select>
              <button
                className="rounded-xl bg-brand-500 px-4 py-2 font-semibold text-white"
                onClick={() => updateUser(user, { name: user.name, role: user.role })}
              >
                Salvar
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
