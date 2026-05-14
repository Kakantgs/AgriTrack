import { Bell, LayoutDashboard, Map, Tractor, Fence, History, LogOut, Warehouse } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/mapa", label: "Mapa", icon: Map },
  { to: "/propriedades", label: "Propriedades", icon: Warehouse },
  { to: "/tratores", label: "Tratores", icon: Tractor },
  { to: "/cercas", label: "Cercas", icon: Fence },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/alertas", label: "Alertas", icon: Bell }
];

export function Layout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="text-2xl font-bold tracking-tight text-brand-700">
            AgriTrack
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("agritrack-token");
              navigate("/");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-700"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-white/80 bg-slate-850 p-4 text-white shadow-soft">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-brand-100">Monitoramento rural</p>
          <nav className="space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? "bg-brand-500 text-white" : "text-slate-200 hover:bg-white/10"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
