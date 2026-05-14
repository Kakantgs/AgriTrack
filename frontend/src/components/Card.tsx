import type { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  title?: string;
  className?: string;
}>;

export function Card({ title, className = "", children }: CardProps) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft ${className}`}>
      {title ? <h3 className="mb-4 text-lg font-semibold text-slate-850">{title}</h3> : null}
      {children}
    </section>
  );
}
