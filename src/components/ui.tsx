import React, { useEffect, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Loader2,
  X,
  XCircle,
} from "lucide-react";

/** Penggabung class sederhana */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// ------------------------------------------------------------------ Badge

export type BadgeTone = "ok" | "warn" | "danger" | "info" | "muted" | "brand";

const TONES: Record<BadgeTone, string> = {
  ok: "b-ok",
  warn: "b-warn",
  danger: "b-danger",
  info: "b-info",
  muted: "b-muted",
  brand: "b-brand",
};

export function Badge({
  tone = "muted",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn(TONES[tone], className)}>{children}</span>;
}

// ------------------------------------------------------------------ Spinner / loader

export function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={cn("animate-spin text-brand-500", className)} />;
}

export function PageLoader({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-stone-400">
      <Spinner className="h-7 w-7" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorPanel({
  message,
  onRetry,
  title = "Terjadi kendala",
}: {
  message: string;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="card p-6 flex flex-col items-center gap-3 text-center animate-rise">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-600">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div>
        <p className="font-bold text-stone-800">{title}</p>
        <p className="text-sm text-stone-500 mt-1 break-words max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button className="btn-ghost btn-sm" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}

/** Banner flash sukses/error (dari hook useFlash) */
export function FlashBanner({
  flash,
}: {
  flash: { kind: "ok" | "err"; text: string } | null;
}) {
  if (!flash) return null;
  const ok = flash.kind === "ok";
  return (
    <div
      className={cn(
        "animate-pop fixed top-4 left-1/2 z-[70] -translate-x-1/2 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-card-lg text-sm font-semibold max-w-[92vw]",
        ok ? "bg-leaf-600 text-white" : "bg-rose-600 text-white"
      )}
      role="status"
    >
      {ok ? <CheckCircle2 className="h-[18px] w-[18px] shrink-0" /> : <XCircle className="h-[18px] w-[18px] shrink-0" />}
      <span>{flash.text}</span>
    </div>
  );
}

// ------------------------------------------------------------------ Empty state

export function EmptyState({
  icon,
  title,
  desc,
  children,
}: {
  icon?: ReactNode;
  title: string;
  desc?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-200 bg-white/60 px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-leaf-100 text-brand-500">
        {icon ?? <Inbox className="h-7 w-7" />}
      </span>
      <p className="font-bold text-stone-700 mt-1">{title}</p>
      {desc && <p className="text-sm text-stone-400 max-w-sm">{desc}</p>}
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ Stat card

export function StatCard({
  icon,
  label,
  value,
  sub,
  iconClass = "bg-brand-50 text-brand-600",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: ReactNode;
  iconClass?: string;
}) {
  return (
    <div className="card p-4 sm:p-5 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{label}</p>
          <p className="mt-1.5 text-xl sm:text-2xl font-extrabold tracking-tight text-lagoon-900 truncate">
            {value}
          </p>
          {sub && <div className="mt-1 text-xs text-stone-400">{sub}</div>}
        </div>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", iconClass)}>
          {icon}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Modal

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
  noPad = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  noPad?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const width =
    size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-3xl" : size === "xl" ? "sm:max-w-5xl" : "sm:max-w-xl";

  return (
    <div
      className="modal-backdrop animate-fade"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className={cn("modal-card animate-pop", width)}>
        <div className="flex items-start justify-between gap-4 px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-stone-100">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold tracking-tight text-lagoon-900 leading-snug">{title}</h3>
            {subtitle && <p className="text-[13px] text-stone-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className={cn("overflow-y-auto grow", noPad ? "" : "p-5 sm:p-7")}>{children}</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Field primitives

export function Labeled({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
    return <input ref={ref} {...props} className={cn("input", props.className)} />;
  }
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea(props, ref) {
  return <textarea ref={ref} {...props} className={cn("textarea", props.className)} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select(props, ref) {
    return <select ref={ref} {...props} className={cn("select", props.className)} />;
  }
);

// ------------------------------------------------------------------ Toggle switch

export function Toggle({
  checked,
  onChange,
  label,
  onColor = "bg-leaf-500",
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  onColor?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2.5 select-none cursor-pointer",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <span
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors duration-200",
          checked ? onColor : "bg-stone-300"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200",
            checked ? "left-6" : "left-1"
          )}
        />
      </span>
      {label && <span className="text-sm font-semibold text-stone-700">{label}</span>}
    </button>
  );
}

// ------------------------------------------------------------------ Section header

export function SectionHead({
  title,
  desc,
  action,
}: {
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-lagoon-900">{title}</h2>
        {desc && <p className="text-sm text-stone-400 mt-0.5">{desc}</p>}
      </div>
      {action}
    </div>
  );
}
