import { useMemo } from "react";
import geo from "@/lib/geo.json";
import { legs, visibleStops } from "@/lib/trip";
import type { Stop, TripState } from "@/lib/types";

/*
  The route drawn on real coastlines (Natural Earth 1:50m, public domain), projected
  equirectangular around 16°N. Land and lines are SVG; pins and names are HTML on top
  so the text stays crisp at any size.
*/
const G = geo as { w: number; h: number; lon0: number; lat1: number; k: number; sx: number; paths: Record<string, string> };
const proj = ([lat, lon]: [number, number]) => [(lon - G.lon0) * G.k * G.sx, (G.lat1 - lat) * G.sx] as const;
const OURS = ["VNM", "THA"];
const DISPLAY_W = 343; // typical phone card width, for spacing labels

type Pin = { x: number; y: number; stops: Stop[] };

export function TripMap({ state, today }: { state: TripState; today?: string }) {
  const { vb, pins, lines } = useMemo(() => layout(state), [state]);
  const pct = (x: number, y: number) => ({ left: `${((x - vb.x) / vb.w) * 100}%`, top: `${((y - vb.y) / vb.h) * 100}%` });
  const here = today ? visibleStops(state).find((s) => s.from <= today && today < s.to)?.id : undefined;
  const route = visibleStops(state).filter((s) => s.center).map((s) => s.name);

  return (
    <figure className="mb-8 overflow-hidden rounded-[22px] bg-cell">
      <div className="relative w-full" style={{ aspectRatio: `${vb.w} / ${vb.h}` }}
        role="img" aria-label={`מפת המסלול: ${[...new Set(route)].join(", ")}`}>
        <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className="absolute inset-0 size-full" aria-hidden>
          <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="var(--sea)" />
          {Object.entries(G.paths).map(([iso, d]) => (
            <path key={iso} d={d} fill={OURS.includes(iso) ? "var(--land)" : "var(--land-2)"} stroke="var(--border)" strokeWidth={0.8}
              vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          ))}
          {lines.map((l, i) => (
            <g key={i} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke">
              <path d={l.d} stroke="#fff" strokeWidth={6} vectorEffect="non-scaling-stroke" opacity={l.mode === "road" ? 1 : 0} />
              <path d={l.d} stroke="var(--tint)" vectorEffect="non-scaling-stroke"
                strokeWidth={l.mode === "road" ? 3 : 2.2} strokeDasharray={l.mode === "flight" ? "7 6" : l.mode === "boat" ? "0.1 5.5" : undefined}
                strokeLinecap="round" />
            </g>
          ))}
        </svg>
        {pins.map((p, i) => {
          const isHere = p.stops.some((s) => s.id === here);
          return (
            <span key={i} className="absolute" style={pct(p.x, p.y)} aria-hidden>
              <span className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white bg-tint shadow-[0_1px_3px_rgb(0_0_0/0.3)] ${isHere ? "size-[18px] ring-4 ring-[rgb(0_102_204/0.25)]" : "size-[13px]"}`} />
            </span>
          );
        })}
        {pins.map((p, i) => (
          <span key={`l${i}`} className="absolute" style={pct(p.x, p.y)} aria-hidden>
            <span className="absolute top-0 -translate-y-1/2 whitespace-nowrap text-[13px] font-semibold leading-[16px] text-label [paint-order:stroke] [-webkit-text-stroke:3px_white]"
              style={p.side === "east" ? { left: 10 } : { right: 10 }}>
              {p.label.map((t) => <span key={t} className="block">{t}</span>)}
            </span>
          </span>
        ))}
      </div>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 px-4 py-3 text-[13px] text-label2">
        <Key dash={undefined} width={3}>נסיעה</Key>
        <Key dash="5 4" width={2.2}>טיסה</Key>
        <Key dash="0.1 4.5" width={2.6}>סירה</Key>
      </figcaption>
    </figure>
  );
}

function Key({ dash, width, children }: { dash?: string; width: number; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="26" height="8" aria-hidden><path d="M2 4h22" stroke="var(--tint)" strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" /></svg>
      {children}
    </span>
  );
}

function layout(state: TripState) {
  const stops = visibleStops(state).filter((s) => s.center);
  const raw = stops.map((s) => ({ s, xy: proj(s.center!.ll) }));
  const xs = raw.map((r) => r.xy[0]), ys = raw.map((r) => r.xy[1]);
  // Room for a pin and its label on every side; more below, where island names stack.
  const padX = 0.8 * G.k * G.sx, padTop = 0.5 * G.sx, padBottom = 1.1 * G.sx;
  const vb = { x: Math.min(...xs) - padX, y: Math.min(...ys) - padTop, w: 0, h: 0 };
  vb.w = Math.max(...xs) + padX - vb.x;
  vb.h = Math.max(...ys) + padBottom - vb.y;
  const unit = vb.w / DISPLAY_W; // map units per screen pixel

  // Pins closer than ~22px merge, and share one label.
  const pins: Pin[] = [];
  for (const { s, xy } of raw) {
    const near = pins.find((p) => Math.hypot(p.x - xy[0], p.y - xy[1]) < 22 * unit);
    if (near) near.stops.push(s);
    else pins.push({ x: xy[0], y: xy[1], stops: [s] });
  }

  // Labels go east of the pin unless that runs off the map or into another label.
  type Box = { x0: number; x1: number; y0: number; y1: number };
  const boxes: Box[] = pins.map((p) => ({ x0: p.x - 8 * unit, x1: p.x + 8 * unit, y0: p.y - 8 * unit, y1: p.y + 8 * unit }));
  const placed = pins.map((p, i) => {
    const names = [...new Set(p.stops.map((s) => s.name))];
    const label = names.filter((n) => !names.some((m) => m !== n && m.includes(n)));
    const w = Math.max(...label.map((t) => t.length)) * 7.4 * unit + 10 * unit;
    const h = label.length * 16 * unit;
    const east: Box = { x0: p.x + 8 * unit, x1: p.x + w, y0: p.y - h / 2, y1: p.y + h / 2 };
    const west: Box = { x0: p.x - w, x1: p.x - 8 * unit, y0: p.y - h / 2, y1: p.y + h / 2 };
    const others = boxes.filter((_, j) => j !== i);
    const clear = (b: Box) => !others.some((o) => b.x0 < o.x1 && o.x0 < b.x1 && b.y0 < o.y1 && o.y0 < b.y1);
    const fitsEast = east.x1 < vb.x + vb.w, fitsWest = west.x0 > vb.x;
    const side: "east" | "west" =
      fitsEast && clear(east) ? "east" : fitsWest && clear(west) ? "west" : fitsEast ? "east" : "west";
    boxes.push(side === "east" ? east : west);
    return { ...p, label, side };
  });

  const lines = legs(state).map(({ from, to, mode }) => {
    const [x1, y1] = proj(from.center!.ll), [x2, y2] = proj(to.center!.ll);
    if (mode !== "flight") return { mode, d: `M${x1},${y1}L${x2},${y2}` };
    // Flights bow outward so they read as arcs, not roads.
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, len = Math.hypot(x2 - x1, y2 - y1);
    const cx = mx + ((y2 - y1) / len) * len * 0.18, cy = my - ((x2 - x1) / len) * len * 0.18;
    return { mode, d: `M${x1},${y1}Q${cx},${cy} ${x2},${y2}` };
  });
  return { vb, pins: placed, lines };
}
