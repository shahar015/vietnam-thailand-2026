import type { BookingFacts } from "./types";

/**
 * Our score: Booking's rating, corrected for how much we can trust it
 * and for what the listing says about the place.
 *
 * 1. Shrink toward 8.4 by review count (Bayesian average, 150-review prior),
 *    so 9.9 on 40 reviews doesn't beat 9.5 on 1,400.
 * 2. Stars: ±0.15 per star from 3 (Booking's own estimate counts 70%; none −0.15).
 * 3. Photos: a thin listing (under 10/20/35 photos) loses 0.4/0.25/0.1.
 * 4. Type: guesthouse/homestay/B&B −0.15, hostel −0.5.
 * 5. Location score: ±0.25 per point from 9.0 (capped ±0.3).
 * 6. Facilities score: ±0.15 per point from 8.8 (capped ±0.2).
 */
export const PRIOR_MEAN = 8.4;
export const PRIOR_WEIGHT = 150;

export type ScoreLine = { label: string; delta: number };
export type Normalized = { score: number; bayes: number; lines: ScoreLine[] };

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const r2 = (x: number) => Math.round(x * 100) / 100;

export function normalize(b: BookingFacts): Normalized {
  const v = b.reviews || 0;
  const bayes = (v * b.score + PRIOR_WEIGHT * PRIOR_MEAN) / (v + PRIOR_WEIGHT);
  const lines: ScoreLine[] = [];

  let stars = -0.15;
  if (b.stars?.n) stars = clamp((b.stars.n - 3) * 0.15, -0.3, 0.3) * (b.stars.kind === "stars" ? 1 : 0.7);
  lines.push({ label: b.stars?.n ? `${b.stars.n} כוכבים${b.stars.kind === "squares" ? " (הערכת Booking)" : ""}` : "בלי דירוג כוכבים", delta: r2(stars) });

  const p = b.photos ?? 0;
  const photos = p < 10 ? -0.4 : p < 20 ? -0.25 : p < 35 ? -0.1 : p >= 80 ? 0.1 : 0;
  lines.push({ label: p >= 45 ? "דף מלא תמונות" : `${p} תמונות בדף`, delta: photos });

  const t = b.type ?? "";
  const type = /HOSTEL/.test(t) ? -0.5 : /GUEST|HOMESTAY|BED_AND|INN|LODGE|CAPSULE/.test(t) ? -0.15 : /APARTMENT|HOLIDAY|VILLA|CHALET/.test(t) ? -0.05 : 0;
  lines.push({ label: typeLabel(t), delta: type });

  const loc = b.subs.location;
  const location = loc ? clamp((loc - 9) * 0.25, -0.3, 0.3) : 0;
  if (loc) lines.push({ label: `מיקום ${loc}`, delta: r2(location) });

  const fac = b.subs.facilities;
  const facilities = fac ? clamp((fac - 8.8) * 0.15, -0.2, 0.2) : 0;
  if (fac) lines.push({ label: `מתקנים ${fac}`, delta: r2(facilities) });

  const score = clamp(bayes + stars + photos + type + location + facilities, 0, 10);
  return { score: Math.round(score * 10) / 10, bayes: Math.round(bayes * 100) / 100, lines };
}

export function typeLabel(t?: string) {
  if (!t) return "סוג לא ידוע";
  if (/HOSTEL/.test(t)) return "הוסטל";
  if (/RESORT/.test(t)) return "ריזורט";
  if (/APARTHOTEL/.test(t)) return "דירות מלון";
  if (/HOTEL/.test(t)) return "מלון";
  if (/BED_AND/.test(t)) return "B&B";
  if (/GUEST/.test(t)) return "גסטהאוס";
  if (/HOMESTAY/.test(t)) return "הומסטיי";
  if (/INN/.test(t)) return "פונדק";
  if (/APARTMENT|HOLIDAY|VILLA/.test(t)) return "דירה או וילה";
  return t.toLowerCase();
}
