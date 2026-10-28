#!/usr/bin/env node
// Read and update the live trip state. See CLAUDE.md at the repo root.
//
//   node web/scripts/trip.mjs queue                          what waits for Claude's research, with context
//   node web/scripts/trip.mjs get <stops|hotels|moves> <id>  one item as JSON
//   node web/scripts/trip.mjs stop <stopId>                  a stop with all its hotels
//   node web/scripts/trip.mjs upsert <stops|hotels|moves> <file.json> ["log text in Hebrew"]
//
// TRIP_URL overrides the site (default: production). RESEARCH_TOKEN comes from the
// environment, or from the git-ignored .env.local at the repo root.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.TRIP_URL ?? "https://vietnam-thailand-2026.vercel.app";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function token() {
  if (process.env.RESEARCH_TOKEN) return process.env.RESEARCH_TOKEN;
  const f = join(root, ".env.local");
  const m = existsSync(f) && readFileSync(f, "utf8").match(/^RESEARCH_TOKEN=(.+)$/m);
  if (!m) throw new Error("RESEARCH_TOKEN is not set and not in .env.local");
  return m[1].trim().replace(/^"|"$/g, "");
}

const state = async () => {
  const r = await fetch(`${BASE}/api/state`, { cache: "no-store" });
  if (!r.ok) throw new Error(`GET /api/state ${r.status}`);
  return r.json();
};
const out = (x) => console.log(JSON.stringify(x, null, 2));
const live = (xs) => xs.filter((x) => !x.hidden);

const [cmd, a, b, c] = process.argv.slice(2);

if (cmd === "queue") {
  const s = await state();
  const stopOf = (id) => s.stops.find((x) => x.id === id);
  const brief = (st) => st && { id: st.id, name: st.name, from: st.from, to: st.to, people: st.people, adults: st.adults, rooms: st.rooms, center: st.center, pickId: st.pickId, bookedId: st.bookedId };
  out({
    rev: s.rev,
    hotels: live(s.hotels).filter((h) => h.needsResearch).map((h) => ({ hotel: h, stop: brief(stopOf(h.stopId)) })),
    stops: live(s.stops).filter((x) => x.needsResearch).map((st) => ({ stop: st, hotels: live(s.hotels).filter((h) => h.stopId === st.id).map((h) => ({ id: h.id, name: h.name, slug: h.slug, priceTotal: h.priceTotal, booking: h.booking })) })),
    moves: live(s.moves).filter((m) => m.needsResearch),
    recentLog: s.log.slice(0, 15),
  });
} else if (cmd === "get") {
  const s = await state();
  out(s[a]?.find((x) => x.id === b) ?? null);
} else if (cmd === "stop") {
  const s = await state();
  out({ stop: s.stops.find((x) => x.id === a), hotels: live(s.hotels).filter((h) => h.stopId === a), moves: live(s.moves) });
} else if (cmd === "upsert") {
  const item = JSON.parse(readFileSync(b, "utf8"));
  const r = await fetch(`${BASE}/api/ops`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-research-token": token() },
    body: JSON.stringify({ op: "upsert", collection: a, item, text: c }),
  });
  const body = await r.json();
  if (!r.ok) { console.error(r.status, body.error); process.exit(1); }
  console.log(`saved ${a}/${item.id}, rev ${body.rev}`);
} else {
  console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 10).join("\n"));
  process.exit(cmd ? 1 : 0);
}
