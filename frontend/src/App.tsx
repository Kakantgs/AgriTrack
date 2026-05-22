import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AlertsPage } from "./pages/AlertsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { GeofencePage } from "./pages/GeofencePage";
import { HistoryPage } from "./pages/HistoryPage";
import { LoginPage } from "./pages/LoginPage";
import { MapPage } from "./pages/MapPage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";

function ProtectedRoute() {
  const token = localStorage.getItem("agritrack-token");
  return token ? <Layout /> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/propriedades" element={<PropertiesPage />} />
        <Route path="/tratores" element={<DevicesPage />} />
        <Route path="/cercas" element={<GeofencePage />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/alertas" element={<AlertsPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
