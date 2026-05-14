import { TriangleAlert } from "lucide-react";
import type { Alert } from "../types";

type AlertBannerProps = {
  alert: Alert | null;
};

export function AlertBanner({ alert }: AlertBannerProps) {
  if (!alert) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-900 shadow-soft">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5" size={20} />
        <div>
          <p className="font-semibold">Alerta visual ativo</p>
          <p className="text-sm">{alert.message}</p>
        </div>
      </div>
    </div>
  );
}
