import React from "react";
import { cn } from "./ui";

export function PortalPage({
  icon,
  gradient = "from-brand-500 to-leaf-500",
  kicker,
  title,
  desc,
  actions,
  children,
  wide = false,
}: {
  icon: React.ReactNode;
  gradient?: string;
  kicker: string;
  title: string;
  desc?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn(wide ? "max-w-6xl" : "max-w-5xl", "mx-auto w-full px-4 sm:px-6 pb-16 pt-6 sm:pt-8")}>
      {/* Hero header portal */}
      <div className="animate-rise relative overflow-hidden rounded-3xl bg-white shadow-card p-5 sm:p-7">
        <div className={cn("absolute -right-10 -top-16 h-44 w-44 rounded-full bg-gradient-to-br opacity-15 blur-2xl", gradient)} />
        <div className="relative flex flex-wrap items-center gap-4">
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-card-lg",
              gradient
            )}
            style={{ height: 52, width: 52 }}
          >
            {icon}
          </span>
          <div className="min-w-0 grow">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-500">{kicker}</p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-lagoon-900">{title}</h1>
            {desc && <p className="text-[13.5px] text-stone-400 mt-0.5 max-w-2xl">{desc}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>

      <div className="mt-5 sm:mt-6">{children}</div>
    </div>
  );
}

/** Sub-navigasi pil untuk halaman yang punya banyak bagian (Partner/Admin). */
export function SubTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
      <div className="flex gap-1.5 w-max">
        {tabs.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-bold transition whitespace-nowrap border",
                active
                  ? "bg-lagoon-900 border-lagoon-900 text-white shadow-card"
                  : "bg-white border-stone-200 text-stone-500 hover:border-lagoon-300 hover:text-lagoon-800"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Container kartu standar isi halaman */
export function CardSection({
  title,
  desc,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  desc?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card p-4 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-stone-800 tracking-tight">{title}</h3>
            {desc && <p className="text-[12.5px] text-stone-400 mt-0.5">{desc}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
