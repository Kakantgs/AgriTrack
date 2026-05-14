import { Bell, LayoutDashboard, Map, Tractor, Fence, History, LogOut, Warehouse } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

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
  const location = useLocation();
  const primaryMobileNav = navItems.filter((item) =>
    ["/dashboard", "/mapa", "/tratores", "/alertas"].includes(item.to)
  );

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <Link to="/dashboard" className="text-2xl font-bold tracking-tight text-brand-700">
              AgriTrack
            </Link>
            <p className="hidden text-sm text-slate-500 sm:block">Painel de rastreamento agrícola em tempo real</p>
          </div>
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
        <div className="border-t border-slate-100 px-4 py-3 lg:hidden">
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden rounded-3xl border border-white/80 bg-slate-850 p-4 text-white shadow-soft lg:block">
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

        <main className="space-y-6 pb-24 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-[999] border-t border-white/80 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-2">
          {primaryMobileNav.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                  isActive ? "bg-brand-500 text-white" : "text-slate-500"
                }`}
              >
                <Icon size={18} />
                <span className="mt-1">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
