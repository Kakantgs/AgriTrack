type StatusBadgeProps = {
  value: "inside" | "outside" | "active" | "inactive" | "pendente" | "enviado" | "erro";
};

const styles: Record<StatusBadgeProps["value"], string> = {
  inside: "bg-emerald-100 text-emerald-700",
  outside: "bg-rose-100 text-rose-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-200 text-slate-600",
  pendente: "bg-amber-100 text-amber-700",
  enviado: "bg-emerald-100 text-emerald-700",
  erro: "bg-rose-100 text-rose-700"
};

const labels: Record<StatusBadgeProps["value"], string> = {
  inside: "Dentro da cerca",
  outside: "Fora da cerca",
  active: "Ativo",
  inactive: "Inativo",
  pendente: "Pendente",
  enviado: "Enviado",
  erro: "Erro"
};

export function StatusBadge({ value }: StatusBadgeProps) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[value]}`}>{labels[value]}</span>;
}
