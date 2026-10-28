// Client-only: imported from TripApp's tree.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { personName } from "@/lib/seed";
import { moon } from "@/lib/trip";
import type { PersonId } from "@/lib/types";

/* ---------- Icons (24px grid, 1.8 stroke, match 17px text) ---------- */
const P: Record<string, string> = {
  route: "M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-12a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 16V9a3 3 0 0 1 3-3h1m8 2v7a3 3 0 0 1-3 3h-1",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z",
  changes: "M12 7v5l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z",
  chevron: "M15 6l-6 6 6 6",
  plus: "M12 5v14M5 12h14",
  flight: "M10.5 21v-6.5L3 17v-2l7.5-4.5V4.5a1.5 1.5 0 0 1 3 0v6L21 15v2l-7.5-2.5V21l-1.5-1Z",
  bus: "M6 17V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v11M6 13h12M8 17v2m8-2v2M5 17h14",
  boat: "M3 17c2 1.5 4 1.5 6 0 2 1.5 4 1.5 6 0 2 1.5 4 1.5 6 0M5 14l1.5-5h11L19 14M12 4v5",
  car: "M5 16v-3l2-5h10l2 5v3M5 16h14M7 19v-3m10 3v-3M7.5 13h.01M16.5 13h.01",
  event: "M12 3v2m0 14v2M5 12H3m18 0h-2M6.3 6.3 4.9 4.9m14.2 14.2-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  walk: "M13 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM10 21l2-6 2 2v4m-4-9 2-3 3 2 2 1M9 12l-1 3",
  bed: "M3 18V7m0 7h18v4M3 11h7a3 3 0 0 1 3 3M14 11h4a3 3 0 0 1 3 3",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  external: "M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4-4",
  check: "M5 12.5 10 17 19 7",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4",
  trash: "M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13",
  note: "M6 4h9l3 3v13H6zM9 10h6M9 14h6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9.5v.01",
};
export function Icon({ name, size = 22, className = "", label }: { name: keyof typeof P | string; size?: number; className?: string; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className} role={label ? "img" : undefined}
      aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={P[name] ?? P.info} />
    </svg>
  );
}

/* ---------- Moon: drawn from the real lit fraction of that night ---------- */
export function Moon({ date, size = 18, glow = false }: { date: string; size?: number; glow?: boolean }) {
  const { lit, waxing } = moon(date);
  const r = 10;
  // Terminator ellipse: x-radius goes from r (new) to 0 (half) to r (full).
  const k = Math.abs(1 - 2 * lit) * r;
  const lightRight = waxing; // northern-hemisphere view; in Thailand it tilts, close enough
  const sweepOuter = lightRight ? 1 : 0;
  const sweepInner = lit > 0.5 ? (lightRight ? 1 : 0) : lightRight ? 0 : 1;
  const d = `M12 2 A${r} ${r} 0 0 ${sweepOuter} 12 22 A${k} ${r} 0 0 ${sweepInner} 12 2Z`;
  const full = lit > 0.985;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      {glow && full && <circle cx="12" cy="12" r="11.5" fill="var(--moon-glow)" opacity="0.35" />}
      <circle cx="12" cy="12" r={r} fill="var(--fill)" stroke="var(--sep)" strokeWidth="0.8" />
      {lit > 0.015 && (full ? <circle cx="12" cy="12" r={r} fill="var(--moon)" /> : <path d={d} fill="var(--moon)" />)}
    </svg>
  );
}

/* ---------- Navigation bar with a large title ---------- */
export function LargeTitle({ title, subtitle, trailing, leading, back }: {
  title: string; subtitle?: ReactNode; trailing?: ReactNode; leading?: ReactNode; back?: { label: string; onClick: () => void };
}) {
  return (
    <header className="px-4 pt-2">
      <div className="flex h-11 items-center justify-between">
        <div className="flex items-center">
          {back ? (
            <button type="button" onClick={back.onClick} className="-ms-2 flex min-h-11 items-center gap-0.5 pe-2 text-[17px] text-accent">
              <Icon name="chevron" size={24} className="rotate-180" />
              {back.label}
            </button>
          ) : leading}
        </div>
        <div className="flex items-center gap-1">{trailing}</div>
      </div>
      <h1 className="text-[34px] font-bold leading-tight tracking-tight">{title}</h1>
      {subtitle && <div className="mt-0.5 text-[15px] text-label2">{subtitle}</div>}
    </header>
  );
}

/* ---------- Lists ---------- */
export function Section({ title, footer, children, action }: { title?: ReactNode; footer?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mb-7">
      {(title || action) && (
        <div className="flex items-end justify-between px-4 pb-1.5">
          {title && <h2 className="text-[13px] font-semibold tracking-wide text-label2">{title}</h2>}
          {action}
        </div>
      )}
      <div className="overflow-hidden rounded-[14px] bg-cell">{children}</div>
      {footer && <p className="px-4 pt-1.5 text-[13px] leading-snug text-label2">{footer}</p>}
    </section>
  );
}

export function Row({ children, onClick, chevron = !!onClick, leading, className = "" }: {
  children: ReactNode; onClick?: () => void; chevron?: boolean; leading?: ReactNode; className?: string;
}) {
  const inner = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {chevron && <Icon name="chevron" size={17} className="shrink-0 text-label3" />}
    </>
  );
  const cls = `flex w-full items-center gap-3 px-4 py-3 text-start min-h-11 border-b border-sep last:border-b-0 ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} press`}>{inner}</button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/* ---------- Status marks ---------- */
export function ResearchBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warn-fill px-2 py-0.5 text-[12px] font-semibold text-warn">
      <span className="size-1.5 rounded-full bg-warn" aria-hidden />
      ממתין לבדיקה
    </span>
  );
}
export function FriendBadge({ by }: { by?: PersonId | null }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-mine-fill px-2 py-0.5 text-[12px] font-semibold text-mine">
      <Icon name="person" size={12} />
      {by ? `ההצעה של ${personName(by)}` : "הצעה שלנו"}
    </span>
  );
}
export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "accent" | "moon" }) {
  const t = {
    neutral: "bg-fill text-label2",
    ok: "bg-ok-fill text-ok",
    accent: "bg-accent-fill text-accent",
    moon: "bg-[color-mix(in_srgb,var(--moon-glow)_30%,transparent)] text-moon",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${t}`}>{children}</span>;
}

/** Booking's score next to ours. */
export function Scores({ booking, ours, compact = false }: { booking?: number; ours?: number; compact?: boolean }) {
  if (booking == null) return <span className="text-[13px] text-label3">אין ציון עדיין</span>;
  return (
    <span className={`inline-flex items-baseline gap-1.5 tabular ${compact ? "text-[13px]" : "text-[15px]"}`}>
      <span className="font-rounded font-bold text-label" title="הציון שלנו">{ours?.toFixed(1)}</span>
      <span className="text-label3 text-[12px]">Booking {booking.toFixed(1)}</span>
    </span>
  );
}

/* ---------- Sheet: grabber, drag down to dismiss, Cancel/Done in the bar ---------- */
export function Sheet({ open, onClose, title, children, leading, trailing, tall = false }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; leading?: ReactNode; trailing?: ReactNode; tall?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [dy, setDy] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  const onDown = (e: React.PointerEvent) => { start.current = e.clientY; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { if (start.current != null) setDy(Math.max(0, e.clientY - start.current)); };
  const onUp = () => { if (dy > 110) onClose(); setDy(0); start.current = null; };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button type="button" aria-label="סגירה" className="fade-enter absolute inset-0 bg-[var(--scrim)]" onClick={onClose} />
      <div ref={panel} tabIndex={-1}
        className={`sheet-enter absolute inset-x-0 bottom-0 mx-auto flex max-w-xl flex-col rounded-t-[14px] bg-bg outline-none ${tall ? "h-[94dvh]" : "max-h-[94dvh]"}`}
        style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: dy ? "none" : "transform .2s" }}>
        <div className="touch-none select-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="mx-auto mt-2 h-[5px] w-9 rounded-full bg-sep" aria-hidden />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pb-2 pt-2">
            <div className="justify-self-start">{leading}</div>
            <div className="min-w-0 text-center text-[17px] font-semibold">{title}</div>
            <div className="justify-self-end">{trailing}</div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">{children}</div>
      </div>
    </div>
  );
}

export function TextButton({ children, onClick, strong = false, disabled = false, danger = false }: {
  children: ReactNode; onClick?: () => void; strong?: boolean; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`min-h-11 px-1 text-[17px] disabled:opacity-40 ${strong ? "font-semibold" : ""} ${danger ? "text-[#d70015] dark:text-[#ff6961]" : "text-accent"}`}>
      {children}
    </button>
  );
}

export function PrimaryButton({ children, onClick, href, disabled }: { children: ReactNode; onClick?: () => void; href?: string; disabled?: boolean }) {
  const cls = "flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-accent px-4 text-[17px] font-semibold text-white dark:text-black disabled:opacity-40";
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>{children}</button>
  );
}
export function SecondaryButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls = "flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-accent-fill px-4 text-[17px] font-semibold text-accent";
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a> : <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1 border-b border-sep px-4 py-2.5 last:border-b-0">
      <span className="text-[13px] text-label2">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-label3">{hint}</span>}
    </label>
  );
}
export const inputCls = "w-full bg-transparent text-[17px] text-label outline-none placeholder:text-label3";
