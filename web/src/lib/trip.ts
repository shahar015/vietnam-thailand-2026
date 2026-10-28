import { normalize } from "./score";
import type { Hotel, Move, PersonId, Stop, TripState } from "./types";

export const TRIP_START = "2026-11-02";
export const TRIP_END = "2026-11-30";

export const DOW = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
export const DOW_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export function dates(from = TRIP_START, to = TRIP_END): string[] {
  const out: string[] = [];
  for (let d = new Date(from + "T12:00:00Z"); d <= new Date(to + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
export const dayNum = (iso: string) => Number(iso.slice(8));
export const weekday = (iso: string) => new Date(iso + "T12:00:00Z").getUTCDay();
/** "2–3.11", isolated as left-to-right so it doesn't flip inside Hebrew text. */
export const fmtRange = (from: string, to: string) => `⁦${dayNum(from)}–${dayNum(to)}.${Number(to.slice(5, 7))}⁩`;
export const nights = (s: Pick<Stop, "from" | "to">) => Math.round((Date.parse(s.to) - Date.parse(s.from)) / 864e5);

export const visibleStops = (t: TripState) => t.stops.filter((s) => !s.hidden).sort((a, b) => a.from.localeCompare(b.from));

/** The stop where we sleep on the night of this date. */
export const stopForNight = (t: TripState, date: string) => visibleStops(t).find((s) => s.from <= date && date < s.to);

export const movesOn = (t: TripState, date: string): Move[] => t.moves.filter((m) => !m.hidden && m.date === date);

export function hotelsOf(t: TripState, stopId: string): Hotel[] {
  const st = t.stops.find((s) => s.id === stopId);
  const list = t.hotels.filter((h) => h.stopId === stopId && !h.hidden);
  return list.sort((a, b) => {
    if (a.id === st?.pickId) return -1;
    if (b.id === st?.pickId) return 1;
    return (scoreOf(b) ?? -1) - (scoreOf(a) ?? -1);
  });
}
export const scoreOf = (h: Hotel) => (h.booking ? normalize(h.booking).score : undefined);
export const pickOf = (t: TripState, st: Stop) => t.hotels.find((h) => h.id === (st.bookedId ?? st.pickId) && !h.hidden);

export const headcount = (st: Stop) => st.people.length || st.adults;

/** Rooms in order, each with the people assigned to it, plus whoever isn't assigned yet. */
export function roomsOf(st: Stop): { rooms: PersonId[][]; unassigned: PersonId[] } {
  const rooms: PersonId[][] = Array.from({ length: Math.max(1, st.rooms) }, () => []);
  const unassigned: PersonId[] = [];
  for (const p of st.people) {
    const r = st.roomOf?.[p];
    if (r && r <= rooms.length) rooms[r - 1].push(p);
    else unassigned.push(p);
  }
  return { rooms, unassigned };
}

/** Per person, split by the headcount the price was researched for (`adults`), not today's list. */
export const perNight = (h: Hotel, st: Stop) =>
  h.priceTotal ? h.priceTotal / Math.max(1, nights(st)) / Math.max(1, st.adults) : undefined;

export function bookingUrl(h: Hotel, st: Stop) {
  if (h.url) return h.url;
  if (!h.slug) return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(h.name)}`;
  const q = new URLSearchParams({
    checkin: st.from, checkout: st.to, group_adults: String(headcount(st)), no_rooms: String(st.rooms),
    group_children: "0", selected_currency: "USD",
  });
  return `https://www.booking.com/hotel/${h.slug}.html?${q}`;
}

export function distanceM(a: [number, number], b: [number, number]) {
  const R = 6371000, r = Math.PI / 180;
  const dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough door-to-door estimate: streets are ~1.3× the straight line, walking 80 m/min. */
export function getThere(h: Hotel, st: Stop): { walk?: string; ride?: string } | null {
  if (!h.ll || !st.center) return null;
  const m = distanceM(h.ll, st.center.ll) * 1.3;
  const walkMin = Math.max(1, Math.round(m / 80));
  const rideMin = Math.max(3, Math.round(m / 400) + 3);
  const dist = m < 1000 ? `${Math.round(m / 10) * 10} מ׳` : `${(m / 1000).toFixed(1)} ק״מ`;
  if (walkMin > 35) return { ride: `~${rideMin} דק׳ במונית (${dist})` };
  return { walk: `~${walkMin} דק׳ ברגל (${dist})`, ride: walkMin > 12 ? `~${rideMin} דק׳ במונית` : undefined };
}

/** Fraction of the moon lit on a date (0 new → 1 full), and whether it is waxing. */
export function moon(iso: string) {
  const synodic = 29.530588853;
  const ref = Date.UTC(2000, 0, 6, 18, 14); // a known new moon
  const days = (Date.parse(iso + "T12:00:00Z") - ref) / 864e5;
  const age = ((days % synodic) + synodic) % synodic;
  const lit = (1 - Math.cos((2 * Math.PI * age) / synodic)) / 2;
  return { lit, waxing: age < synodic / 2, age };
}

export const peopleOn = (t: TripState, date: string) => {
  const st = stopForNight(t, date);
  if (st) return st.people;
  const prev = visibleStops(t).filter((s) => s.to <= date).at(-1);
  return prev?.people ?? [];
};

/** The device's date, as an ISO day. Client-only. */
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** How we get from each stop to the next: a flight or a boat on the changeover day wins over the road. */
export function legs(t: TripState): { from: Stop; to: Stop; mode: "flight" | "boat" | "road" }[] {
  const st = visibleStops(t).filter((s) => s.center);
  return st.slice(1).map((to, i) => {
    const kinds = movesOn(t, to.from).map((m) => m.kind);
    return { from: st[i], to, mode: kinds.includes("flight") ? "flight" : kinds.includes("boat") ? "boat" : "road" };
  });
}

export const researchQueue = (t: TripState) => ({
  stops: t.stops.filter((s) => s.needsResearch && !s.hidden),
  hotels: t.hotels.filter((h) => h.needsResearch && !h.hidden),
  moves: t.moves.filter((m) => m.needsResearch && !m.hidden),
});
