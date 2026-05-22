import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

type AuthMode = "login" | "register";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isRegister && password !== confirmPassword) {
        throw new Error("As senhas não conferem");
      }

      const data = isRegister ? await api.register(name, email, password) : await api.login(email, password);
      localStorage.setItem("agritrack-token", data.token);
      localStorage.setItem("agritrack-user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao entrar");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(45,138,77,0.22),transparent_28%),radial-gradient(circle_at_82%_4%,rgba(234,179,8,0.16),transparent_24%),linear-gradient(135deg,#f7faf7_0%,#e8f2ea_48%,#f8f3df_100%)]" />
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2.2rem] border border-white/80 bg-white/90 shadow-soft backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[520px] overflow-hidden bg-[linear-gradient(145deg,#12351f_0%,#1d6a3d_48%,#ccefd7_100%)] p-10 text-white">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute bottom-8 right-8 hidden h-40 w-40 rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur lg:block" />
          <p className="mb-6 text-sm uppercase tracking-[0.3em] text-brand-100">AgriTrack</p>
          <h1 className="max-w-lg text-4xl font-bold leading-tight sm:text-5xl">
            Controle sua operação agrícola com acesso seguro e rastreamento em tempo real.
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-6 text-emerald-50">
            Plataforma operacional com dashboard, mapa, histórico, cadastro, cercas digitais e alertas de saída de área.
          </p>
          <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Cercas virtuais", "Histórico GPS", "Alertas"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm font-semibold backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8 inline-flex rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                !isRegister ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                isRegister ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Criar conta
            </button>
          </div>

          <h2 className="text-3xl font-bold text-slate-850">{isRegister ? "Crie sua conta" : "Acesse o painel"}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {isRegister
              ? "Cadastre um usuário para salvar o acesso no Firebase e entrar no AgriTrack."
              : "Entre com sua conta cadastrada para acessar o monitoramento."}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {isRegister ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nome</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="Seu nome"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">E-mail</span>
              <input
                type="email"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="voce@email.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Senha</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder="Mínimo de 6 caracteres"
              />
            </label>

            {isRegister ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Confirmar senha</span>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Repita sua senha"
                />
              </label>
            ) : null}

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <button
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Processando..." : isRegister ? "Criar conta e entrar" : "Entrar"}
            </button>
          </form>

          {!isRegister ? (
            <button
              type="button"
              onClick={() => switchMode("register")}
              className="mt-6 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Ainda não tem conta? Cadastre-se
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mt-6 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Já tem conta? Entrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
