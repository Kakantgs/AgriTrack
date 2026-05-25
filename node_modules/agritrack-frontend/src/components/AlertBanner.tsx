import { TriangleAlert } from "lucide-react";
import type { Alert } from "../types";

type AlertBannerProps = {
  alert: Alert | null;
};

export function AlertBanner({ alert }: AlertBannerProps) {
  if (!alert) {
    return null;
  }

  const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(alert.createdAt).getTime()) / 60000));

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-900 shadow-soft">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5" size={20} />
        <div>
          <p className="font-semibold">Saída de cerca detectada</p>
          <p className="text-sm">{alert.message}</p>
          <p className="mt-1 text-xs text-rose-700">
            Gerado {minutesAgo <= 1 ? "agora" : `há ${minutesAgo} min`}
          </p>
        </div>
      </div>
    </div>
  );
}
