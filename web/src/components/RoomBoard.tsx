import { useEffect, useRef, useState } from "react";
import { personName } from "@/lib/seed";
import type { PersonId } from "@/lib/types";

type RoomOf = Partial<Record<PersonId, number>>;

/**
 * One section per room plus "no room". People move by dragging the grip, like a music
 * queue, or by tapping their row and picking a room (the alternative that works without
 * a gesture and with a screen reader).
 */
export function RoomBoard({ people, rooms, roomOf, onMove }: {
  people: PersonId[]; rooms: number; roomOf: RoomOf; onMove: (p: PersonId, room: number) => void;
}) {
  const [drag, setDrag] = useState<{ p: PersonId; x: number; y: number; dx: number; dy: number; w: number; over: number | null } | null>(null);
  const scroller = useRef<HTMLElement | null>(null);
  const raf = useRef(0);

  const groups = [...Array.from({ length: rooms }, (_, i) => i + 1), 0].map((r) => ({
    r, list: people.filter((p) => (roomOf[p] ?? 0) === r),
  }));
  const label = (r: number) => (r ? `חדר ${r}` : "בלי חדר");

  // While dragging near the sheet's top or bottom edge, scroll so far rooms come into reach.
  useEffect(() => {
    if (!drag) return;
    const tick = () => {
      const el = scroller.current;
      if (el) {
        const b = el.getBoundingClientRect();
        if (drag.y < b.top + 70) el.scrollTop -= 9;
        else if (drag.y > b.bottom - 70) el.scrollTop += 9;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [drag]);

  const roomAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-room]");
    return el ? Number(el.dataset.room) : null;
  };

  const start = (p: PersonId, e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const row = e.currentTarget.closest<HTMLElement>("[data-person]")!.getBoundingClientRect();
    scroller.current = e.currentTarget.closest<HTMLElement>(".overflow-y-auto");
    setDrag({ p, x: e.clientX, y: e.clientY, dx: e.clientX - row.left, dy: e.clientY - row.top, w: row.width, over: roomOf[p] ?? 0 });
    navigator.vibrate?.(8);
  };
  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, over: roomAt(e.clientX, e.clientY) });
  };
  const end = () => {
    if (drag && drag.over != null && drag.over !== (roomOf[drag.p] ?? 0)) onMove(drag.p, drag.over);
    setDrag(null);
  };

  return (
    <div className={drag ? "select-none" : undefined}>
      {groups.map(({ r, list }) => {
        const target = drag != null && drag.over === r;
        return (
          <section key={r} data-room={r} className="mb-6">
            <h3 className="flex items-baseline justify-between px-4 pb-1.5 text-[15px] font-semibold text-label2">
              <span className={r === 0 && list.length ? "text-orange" : undefined}>{label(r)}</span>
              <span className="text-[13px] font-normal tabular">{list.length === 0 ? "ריק" : list.length === 1 ? "אדם אחד" : `${list.length} אנשים`}</span>
            </h3>
            <div className={`min-h-[52px] overflow-hidden rounded-[22px] bg-cell transition-shadow [&>*:last-child_.sep]:border-b-0 ${target ? "shadow-[inset_0_0_0_2px_var(--tint)]" : ""}`}>
              {list.length === 0 && (
                <div className="flex min-h-[52px] items-center justify-center text-[15px] text-label3">{drag ? "שחררו כאן" : r ? "גררו לכאן מישהו" : "כולם בחדרים"}</div>
              )}
              {list.map((p) => (
                <div key={p} data-person={p} className={`relative flex items-stretch transition-opacity ${drag?.p === p ? "opacity-30" : ""}`}>
                  <label className="press relative flex min-w-0 flex-1 items-center ps-4">
                    <span className="sep hair-b flex min-h-[52px] flex-1 items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-[linear-gradient(#a1a1a6,#86868b)] text-[14px] font-semibold text-white">{personName(p).slice(0, 1)}</span>
                      <span className="flex-1 text-[17px]">{personName(p)}</span>
                    </span>
                    <select aria-label={`החדר של ${personName(p)}`} value={String(roomOf[p] ?? 0)} onChange={(e) => onMove(p, Number(e.target.value))}
                      className="absolute inset-0 opacity-0">
                      {[...Array.from({ length: rooms }, (_, i) => i + 1), 0].map((o) => <option key={o} value={o}>{label(o)}</option>)}
                    </select>
                  </label>
                  <span className="sep hair-b flex items-center pe-2">
                    <button type="button" aria-hidden tabIndex={-1} onPointerDown={(e) => start(p, e)} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
                      className="flex size-11 cursor-grab touch-none items-center justify-center text-label3 active:cursor-grabbing">
                      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden><path d="M4 7h14M4 11h14M4 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {drag && (
        <div className="pointer-events-none fixed z-[70] flex min-h-[52px] items-center gap-3 rounded-[16px] bg-cell px-4 shadow-[0_12px_32px_rgb(0_0_0/0.22)]"
          style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w, transform: "scale(1.03)" }} aria-hidden>
          <span className="flex size-8 items-center justify-center rounded-full bg-[linear-gradient(#a1a1a6,#86868b)] text-[14px] font-semibold text-white">{personName(drag.p).slice(0, 1)}</span>
          <span className="flex-1 text-[17px]">{personName(drag.p)}</span>
          {drag.over != null && <span className="text-[15px] font-semibold text-tint">{label(drag.over)}</span>}
        </div>
      )}
    </div>
  );
}
