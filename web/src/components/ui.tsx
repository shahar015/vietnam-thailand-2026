// Client-only: imported from TripApp's tree.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { personName } from "@/lib/seed";
import { moon } from "@/lib/trip";
import type { PersonId } from "@/lib/types";

/* ---------- Icons: 24px grid, 1.9 stroke, weighted to sit beside 17px text ---------- */
const P: Record<string, string> = {
  map: "M9 4 3.5 6.2v13.6L9 17.6l6 2.4 5.5-2.2V4.2L15 6.4 9 4Zm0 0v13.6m6-11.2V20",
  calendar: "M5.5 5.5h13a1.5 1.5 0 0 1 1.5 1.5v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5ZM4 10h16M8.5 3.5v4m7-4v4",
  changes: "M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5m0-5v5h5M12 7.5V12l3 2",
  chevron: "M15 5.5 8.5 12l6.5 6.5",
  plus: "M12 5v14M5 12h14",
  xmark: "M6.5 6.5l11 11m0-11-11 11",
  check: "M5 12.5 10 17.5 19 6.5",
  flight: "M10.5 21v-6.5L3 17v-2l7.5-4.5V4.5a1.5 1.5 0 0 1 3 0v6L21 15v2l-7.5-2.5V21l-1.5-1Z",
  bus: "M6 17V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v11M6 13h12M8 17v2m8-2v2M5 17h14",
  boat: "M3 17c2 1.5 4 1.5 6 0 2 1.5 4 1.5 6 0 2 1.5 4 1.5 6 0M5 14l1.5-5h11L19 14M12 4v5",
  car: "M5 16v-3l2-5h10l2 5v3M5 16h14M7 19v-3m10 3v-3M7.5 13h.01M16.5 13h.01",
  event: "M12 3v2m0 14v2M5 12H3m18 0h-2M6.3 6.3 4.9 4.9m14.2 14.2-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  walk: "M13 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM10 21l2-6 2 2v4m-4-9 2-3 3 2 2 1M9 12l-1 3",
  bed: "M3 18V7m0 7h18v4M3 11h7a3 3 0 0 1 3 3M14 11h4a3 3 0 0 1 3 3",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  people: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1.5-9a3 3 0 1 0 0-6m2.5 15h2a5 5 0 0 0-4.5-5",
  external: "M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4-4",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  cart: "M3 4h2l2.2 10.5a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6M9 20h.01M17 20h.01",
  note: "M6 4h9l3 3v13H6zM9 10h6M9 14h6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9.5v.01",
  sparkle: "M12 3.5l1.9 5 5 1.9-5 1.9-1.9 5-1.9-5-5-1.9 5-1.9ZM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z",
  bulb: "M9.5 18h5m-4 3h3M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z",
  trash: "M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4",
};
export function Icon({ name, size = 22, className = "", label, weight = 1.9 }: { name: string; size?: number; className?: string; label?: string; weight?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={weight}
      strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} role={label ? "img" : undefined}
      aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={P[name] ?? P.info} />
    </svg>
  );
}
/** Forward chevron for a row: in right-to-left it points left. */
export const Chevron = () => <Icon name="chevron" size={15} weight={2.4} className="text-[#c4c4c7]" />;

/* ---------- Moon: drawn from the real lit fraction of that night ---------- */
export function Moon({ date, size = 18, glow = false }: { date: string; size?: number; glow?: boolean }) {
  const { lit, waxing } = moon(date);
  const r = 10;
  const k = Math.abs(1 - 2 * lit) * r;
  const sweepOuter = waxing ? 1 : 0;
  const sweepInner = lit > 0.5 ? (waxing ? 1 : 0) : waxing ? 0 : 1;
  const d = `M12 2 A${r} ${r} 0 0 ${sweepOuter} 12 22 A${k} ${r} 0 0 ${sweepInner} 12 2Z`;
  const full = lit > 0.985;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      {glow && full && <circle cx="12" cy="12" r="12" fill="var(--moon-glow)" opacity="0.45" />}
      <circle cx="12" cy="12" r={r} fill="#e9e9ee" />
      {lit > 0.015 && (full ? <circle cx="12" cy="12" r={r} fill="var(--moon)" /> : <path d={d} fill="var(--moon)" />)}
    </svg>
  );
}

/* ---------- Navigation bar: glass buttons, large title that collapses into the bar ---------- */
export function Screen({ title, subtitle, leading, trailing, back, children }: {
  title: string; subtitle?: ReactNode; leading?: ReactNode; trailing?: ReactNode;
  back?: { label: string; onClick: () => void }; children: ReactNode;
}) {
  const h1 = useRef<HTMLHeadingElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const el = h1.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCollapsed(!e.isIntersecting), { rootMargin: "-56px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <main>
      <div className="sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className={`edge-top pointer-events-none absolute inset-x-0 top-0 h-[calc(env(safe-area-inset-top)+76px)] transition-opacity duration-200 ${collapsed ? "opacity-100" : "opacity-0"}`} aria-hidden />
        <div className="relative grid h-[56px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
          <div className="flex items-center justify-self-start">
            {back ? (
              <button type="button" onClick={back.onClick} aria-label={`חזרה ל${back.label}`}
                className="glass press-glass flex size-11 items-center justify-center rounded-full text-label">
                <Icon name="chevron" size={22} weight={2.2} className="rotate-180" />
              </button>
            ) : leading}
          </div>
          <div className={`min-w-0 truncate text-center text-[17px] font-semibold transition-opacity duration-200 ${collapsed ? "opacity-100" : "opacity-0"}`} aria-hidden>{title}</div>
          <div className="flex items-center gap-2 justify-self-end">{trailing}</div>
        </div>
      </div>
      <header className="px-5 pb-4 pt-1">
        <h1 ref={h1} className="text-[34px] font-bold leading-[41px] tracking-[-0.02em]">{title}</h1>
        {subtitle && <div className="mt-0.5 text-[17px] text-label2">{subtitle}</div>}
      </header>
      <div className="px-4">{children}</div>
    </main>
  );
}

export function GlassButton({ icon, label, onClick, tint = false, disabled = false, children }: {
  icon?: string; label: string; onClick?: () => void; tint?: boolean; disabled?: boolean; children?: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} disabled={disabled}
      className={`press-glass flex size-11 items-center justify-center rounded-full disabled:opacity-35 aria-[label=שומר]:opacity-100 ${tint ? "bg-tint text-white shadow-[0_6px_16px_rgb(0_102_204/0.3)]" : "glass text-label"}`}>
      {children ?? <Icon name={icon!} size={21} weight={2.1} />}
    </button>
  );
}
export function GlassPill({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="glass press-glass flex h-11 items-center rounded-full px-4 text-[17px] font-medium">
      {children}
    </button>
  );
}

/* ---------- Inset grouped lists ---------- */
export function Section({ title, footer, children, action }: {
  title?: ReactNode; footer?: ReactNode; children: ReactNode; action?: ReactNode;
}) {
  return (
    <section className="mb-8">
      {(title || action) && (
        <div className="flex min-h-7 items-end justify-between px-4 pb-1.5">
          {title && <h2 className="text-[15px] font-semibold text-label2">{title}</h2>}
          {action}
        </div>
      )}
      <div className={`overflow-hidden rounded-[22px] bg-cell [&>*:last-child_.sep]:border-b-0`}>{children}</div>
      {footer && <p className="px-4 pt-2 text-[13px] leading-[18px] text-label2">{footer}</p>}
    </section>
  );
}

/** A list row. The separator starts where the text starts, as in a table view. */
export function Row({ children, onClick, href, leading, trailing, chevron = !!onClick, tone, label }: {
  children: ReactNode; onClick?: () => void; href?: string; leading?: ReactNode; trailing?: ReactNode;
  chevron?: boolean; tone?: "tint" | "red"; label?: string;
}) {
  const body = (
    <>
      {leading && <span className="flex shrink-0 items-center py-[11px] ps-4">{leading}</span>}
      <span className={`sep hair-b flex min-h-[48px] min-w-0 flex-1 items-center gap-3 py-[11px] pe-4 ${leading ? "ms-3" : "ms-4"}`}>
        <span className={`min-w-0 flex-1 ${tone === "tint" ? "text-tint" : tone === "red" ? "text-red" : ""}`}>{children}</span>
        {trailing && <span className="shrink-0 text-[17px] text-label2">{trailing}</span>}
        {(chevron || href) && (href ? <Icon name="external" size={17} className="text-label3" /> : <Chevron />)}
      </span>
    </>
  );
  const cls = "flex w-full items-stretch text-start";
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} press`} aria-label={label}>{body}</a>;
  if (onClick) return <button type="button" onClick={onClick} className={`${cls} press`} aria-label={label}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

/** Rounded-square glyph at the start of a row, as in Settings. */
export function RowIcon({ name, color }: { name: string; color: string }) {
  return (
    <span className="flex size-[30px] items-center justify-center rounded-[8px] text-white" style={{ background: color }}>
      <Icon name={name} size={18} weight={2} />
    </span>
  );
}

/* ---------- Status marks: an icon and words, no colored pills ---------- */
export function ClaudeMark({ short = false }: { short?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-orange">
      <Icon name="sparkle" size={14} weight={2} />
      {short ? "לבדיקה של קלוד" : "קלוד עוד לא בדק"}
    </span>
  );
}
export function FriendMark({ by }: { by?: PersonId | null }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-purple">
      <Icon name="person" size={14} weight={2.2} />
      {by ? `הצעה של ${personName(by)}` : "הצעה שלכם"}
    </span>
  );
}
export function BookedMark() {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-green">
      <Icon name="check" size={14} weight={2.6} />
      הוזמן
    </span>
  );
}

/* ---------- Apple Maps style info strip ---------- */
export function InfoStrip({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode }[] }) {
  return (
    <div className="no-scrollbar flex overflow-x-auto">
      {items.map((it, i) => (
        <div key={i} className={`min-w-[78px] flex-1 px-3 py-1 ${i ? "border-s-[0.5px] border-sep" : ""}`}>
          <div className="text-[12px] text-label2">{it.label}</div>
          <div className="mt-0.5 text-[17px] font-semibold leading-tight tabular">{it.value}</div>
          {it.sub && <div className="text-[12px] text-label2 tabular">{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/* ---------- Buttons ---------- */
export function Button({ children, onClick, href, kind = "gray", disabled = false }: {
  children: ReactNode; onClick?: () => void; href?: string; kind?: "prominent" | "gray" | "red"; disabled?: boolean;
}) {
  const cls = `press-glass flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-full px-5 text-[17px] font-semibold disabled:opacity-40 ${
    kind === "prominent" ? "bg-tint text-white" : kind === "red" ? "bg-[rgb(215_0_21/0.1)] text-red" : "bg-fill text-tint"
  }`;
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>{children}</button>
  );
}

/* ---------- Sheet: grabber, drag down to dismiss, round close and done buttons ---------- */
export function Sheet({ onClose, title, children, done, height = "large" }: {
  onClose: () => void; title?: ReactNode; children: ReactNode;
  done?: { label: string; onClick: () => void; disabled?: boolean; busy?: boolean };
  height?: "large" | "fit";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [dy, setDy] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest("button")) return;
    start.current = e.clientY;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => { if (start.current != null) setDy(Math.max(0, e.clientY - start.current)); };
  const onUp = () => { if (dy > 110) onClose(); setDy(0); start.current = null; };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
      <button type="button" aria-label="סגירה" tabIndex={-1} className="fade-enter absolute inset-0 bg-[var(--scrim)]" onClick={onClose} />
      <div ref={panel} tabIndex={-1}
        className={`sheet-enter absolute inset-x-0 bottom-0 mx-auto flex max-w-[480px] flex-col rounded-t-[38px] bg-bg shadow-[0_-10px_40px_rgb(0_0_0/0.12)] outline-none ${height === "large" ? "h-[93dvh]" : "max-h-[93dvh]"}`}
        style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: dy ? "none" : "transform .3s cubic-bezier(.32,.72,0,1)" }}>
        <div className="touch-none select-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="mx-auto mt-[6px] h-[5px] w-9 rounded-full bg-[rgb(60_60_67/0.3)]" aria-hidden />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pb-3 pt-2">
            <div className="justify-self-start"><GlassButton icon="xmark" label={done ? "ביטול" : "סגירה"} onClick={onClose} /></div>
            <div className="min-w-0 truncate text-center text-[17px] font-semibold">{title}</div>
            <div className="justify-self-end">
              {done && (
                <GlassButton tint label={done.busy ? "שומר" : done.label} onClick={done.onClick} disabled={done.disabled || done.busy}>
                  {done.busy
                    ? <span className="size-5 animate-spin rounded-full border-[2.5px] border-white/40 border-t-white" aria-hidden />
                    : <Icon name="check" size={22} weight={2.6} />}
                </GlassButton>
              )}
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+28px)]">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Controls ---------- */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-[var(--switch)]" : "bg-fill-2"}`}>
      <span className={`absolute top-[2px] size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.16)] transition-[inset-inline-start] duration-200 ${checked ? "start-[22px]" : "start-[2px]"}`} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: [T, string][]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex rounded-full bg-fill p-[3px]">
      {options.map(([v, text]) => (
        <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`min-h-[34px] flex-1 rounded-full px-3 text-[14px] font-semibold transition-colors ${value === v ? "bg-cell text-label shadow-[0_2px_6px_rgb(0_0_0/0.1)]" : "text-label2"}`}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="sep hair-b ms-4 flex min-h-[52px] items-center gap-3 py-2 pe-4">
      <span className="w-[84px] shrink-0 text-[17px]">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}
export const inputCls = "w-full bg-transparent text-[17px] text-label outline-none placeholder:text-label3";

/** A native picker styled as a row's trailing value: iOS shows its own wheel. */
export function Picker({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  const current = options.find(([v]) => v === value)?.[1] ?? "";
  return (
    <span className="relative inline-flex items-center gap-1 text-[17px] text-label2">
      {current}
      <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden className="text-label3"><path d="M1.5 6 5 2.5 8.5 6M1.5 10 5 13.5 8.5 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0">
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </span>
  );
}

/* ---------- Tips (TipKit): shown once next to what they explain, dismissed for good ---------- */
const TIPS_KEY = "trip.tips";
const readTips = (): string[] => { try { return JSON.parse(localStorage.getItem(TIPS_KEY) ?? "[]"); } catch { return []; } };
export const resetTips = () => {
  try { localStorage.removeItem(TIPS_KEY); } catch {}
  window.dispatchEvent(new Event("trip:tips"));
};

export function Tip({ id, title, children, arrow = false }: { id: string; title: string; children: ReactNode; arrow?: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const sync = () => setShow(!readTips().includes(id));
    sync();
    window.addEventListener("trip:tips", sync);
    return () => window.removeEventListener("trip:tips", sync);
  }, [id]);
  if (!show) return null;
  const dismiss = () => {
    try { localStorage.setItem(TIPS_KEY, JSON.stringify([...new Set([...readTips(), id])])); } catch {}
    setShow(false);
  };
  return (
    <div className={`pop-enter relative ${arrow ? "mb-5" : "mb-6"}`} role="note">
      <div className="flex gap-3 rounded-[22px] bg-cell py-3.5 pe-2 ps-4 shadow-[0_6px_20px_rgb(0_0_0/0.07)]">
        <Icon name="bulb" size={26} className="mt-0.5 text-tint" />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">{title}</div>
          <p className="mt-0.5 text-[15px] leading-[20px] text-label2">{children}</p>
        </div>
        <button type="button" onClick={dismiss} aria-label="הבנתי, להסתיר" className="-mt-1.5 flex size-11 shrink-0 items-center justify-center text-label3">
          <Icon name="xmark" size={16} weight={2.4} />
        </button>
      </div>
      {arrow && <span className="absolute -bottom-[7px] start-10 size-4 rotate-45 rounded-[3px] bg-cell" aria-hidden />}
    </div>
  );
}
