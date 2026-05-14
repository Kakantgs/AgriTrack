import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@agritrack.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      const data = await api.login(email, password);
      localStorage.setItem("agritrack-token", data.token);
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao entrar");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-soft lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-[linear-gradient(140deg,#1b5832_0%,#2d8a4d_55%,#d8f2e0_100%)] p-10 text-white">
          <p className="mb-6 text-sm uppercase tracking-[0.3em] text-brand-100">FENIT MVP</p>
          <h1 className="max-w-md text-4xl font-bold leading-tight">AgriTrack rastreia tratores em tempo real com cerca virtual e alertas.</h1>
          <p className="mt-6 max-w-lg text-sm text-emerald-50">
            Protótipo funcional com dashboard, mapa, histórico, cadastro e simulação de saída de área permitida.
          </p>
        </div>
        <div className="p-10">
          <h2 className="text-3xl font-bold text-slate-850">Entrar</h2>
          <p className="mt-2 text-sm text-slate-500">Use o login fake fornecido para acessar o painel.</p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">E-mail</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Senha</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <button className="w-full rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-600">
              Entrar
            </button>
          </form>
          <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p>Usuário: admin@agritrack.com</p>
            <p>Senha: 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}
