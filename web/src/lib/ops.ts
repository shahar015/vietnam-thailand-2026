import type { Hotel, LogEntry, Move, OpRequest, Stop, TripState } from "./types";

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export class OpError extends Error {}

/** Applies one change. Returns a new state; never mutates the input. */
export function applyOp(prev: TripState, req: OpRequest, opts: { admin?: boolean } = {}): TripState {
  const s: TripState = structuredClone(prev);
  const by = req.by ?? null;
  const at = new Date().toISOString();
  const log = (text: string, target?: LogEntry["target"]) => s.log.unshift({ id: uid("l"), at, by, text, target });
  const stop = (id: string) => s.stops.find((x) => x.id === id) ?? fail("העצירה לא נמצאה");
  const hotel = (id: string) => s.hotels.find((x) => x.id === id) ?? fail("המלון לא נמצא");
  const move = (id: string) => s.moves.find((x) => x.id === id) ?? fail("הנסיעה לא נמצאה");

  switch (req.op) {
    case "setPick": {
      const st = stop(req.stopId);
      const h = hotel(req.hotelId);
      st.pickId = h.id;
      log(`בחר/ה את ${h.name} כהמלצה ב${st.name}`, { kind: "stop", id: st.id });
      break;
    }
    case "addHotel": {
      const st = stop(req.stopId);
      const name = req.name.trim();
      if (!name) fail("חסר שם מלון");
      const h: Hotel = {
        id: uid("h"), stopId: st.id, name, url: req.url?.trim() || undefined, note: req.note?.trim() || undefined,
        ll: req.ll, addedBy: by, needsResearch: true,
      };
      s.hotels.push(h);
      if (req.makePick || req.booked) st.pickId = h.id;
      if (req.booked) st.bookedId = h.id;
      log(`הוסיף/ה את ${name} ב${st.name}${req.booked ? " וסימן/ה שהזמנו אותו" : req.makePick ? " והגדיר/ה כהמלצה" : ""}`, { kind: "hotel", id: h.id });
      break;
    }
    case "setBooked": {
      const st = stop(req.stopId);
      if (req.hotelId) {
        const h = hotel(req.hotelId);
        if (h.stopId !== st.id) fail("המלון לא שייך לעצירה הזו");
        st.bookedId = h.id;
        st.pickId = h.id;
        log(`סימן/ה שהזמנו את ${h.name} ב${st.name}`, { kind: "stop", id: st.id });
      } else {
        const was = st.bookedId && s.hotels.find((x) => x.id === st.bookedId)?.name;
        st.bookedId = undefined;
        log(`ביטל/ה את הסימון שהזמנו${was ? ` את ${was}` : ""} ב${st.name}`, { kind: "stop", id: st.id });
      }
      break;
    }
    case "editHotel": {
      const h = hotel(req.hotelId);
      if (req.name !== undefined) h.name = req.name.trim() || h.name;
      if (req.url !== undefined) h.url = req.url.trim() || undefined;
      if (req.note !== undefined) h.note = req.note.trim() || undefined;
      h.needsResearch = true;
      log(`ערך/ה את ${h.name}`, { kind: "hotel", id: h.id });
      break;
    }
    case "hideHotel": {
      const h = hotel(req.hotelId);
      h.hidden = true;
      const st = stop(h.stopId);
      if (st.pickId === h.id) st.pickId = undefined;
      if (st.bookedId === h.id) st.bookedId = undefined;
      log(`הסיר/ה את ${h.name}`, { kind: "hotel", id: h.id });
      break;
    }
    case "editStop": {
      const st = stop(req.stopId);
      if (req.from && req.to && req.from >= req.to) fail("תאריך היציאה צריך להיות אחרי תאריך ההגעה");
      const before = `${st.from}–${st.to}`;
      if (req.from) st.from = req.from;
      if (req.to) st.to = req.to;
      if (req.name?.trim()) st.name = req.name.trim();
      st.needsResearch = true;
      log(`שינה/תה את ${st.name}: ${before} ← ${st.from}–${st.to}`, { kind: "stop", id: st.id });
      break;
    }
    case "setRooms": {
      const st = stop(req.stopId);
      const rooms = Math.max(1, Math.min(8, Math.round(req.rooms)));
      const people = [...new Set(req.people)];
      const roomOf: Stop["roomOf"] = {};
      for (const p of people) {
        const r = req.roomOf[p];
        if (r && r >= 1 && r <= rooms) roomOf[p] = r;
      }
      // A different headcount or room count changes prices and availability.
      const recheck = people.length !== st.people.length || rooms !== st.rooms;
      // `adults` stays the headcount prices were researched for, until Claude rechecks.
      st.people = people;
      st.rooms = rooms;
      st.roomOf = roomOf;
      if (recheck) st.needsResearch = true;
      log(`עדכן/ה את החדרים ב${st.name}: ${people.length} אנשים ב־${rooms} ${rooms === 1 ? "חדר" : "חדרים"}`, { kind: "stop", id: st.id });
      break;
    }
    case "addStop": {
      if (!req.name.trim()) fail("חסר שם");
      if (req.from >= req.to) fail("תאריך היציאה צריך להיות אחרי תאריך ההגעה");
      const st: Stop = {
        id: uid("s"), name: req.name.trim(), country: req.country, from: req.from, to: req.to,
        people: req.people, adults: req.people.length, rooms: Math.max(1, Math.ceil(req.people.length / 2)),
        addedBy: by, needsResearch: true,
      };
      s.stops.push(st);
      log(`הוסיף/ה עצירה: ${st.name}`, { kind: "stop", id: st.id });
      break;
    }
    case "hideStop": {
      const st = stop(req.stopId);
      st.hidden = true;
      log(`הסיר/ה את ${st.name}`, { kind: "stop", id: st.id });
      break;
    }
    case "addMove": {
      if (!req.title.trim()) fail("חסרה כותרת");
      const m: Move = {
        id: uid("m"), date: req.date, time: req.time?.trim() || undefined, kind: req.kind, title: req.title.trim(),
        detail: req.detail?.trim() || undefined, status: "todo", addedBy: by, needsResearch: true,
      };
      s.moves.push(m);
      log(`הוסיף/ה ל־${req.date.slice(8)}.11: ${m.title}`, { kind: "move", id: m.id });
      break;
    }
    case "editMove": {
      const m = move(req.moveId);
      if (req.date) m.date = req.date;
      if (req.time !== undefined) m.time = req.time.trim() || undefined;
      if (req.title?.trim()) m.title = req.title.trim();
      if (req.detail !== undefined) m.detail = req.detail.trim() || undefined;
      m.needsResearch = true;
      log(`ערך/ה: ${m.title}`, { kind: "move", id: m.id });
      break;
    }
    case "hideMove": {
      const m = move(req.moveId);
      m.hidden = true;
      log(`הסיר/ה: ${m.title}`, { kind: "move", id: m.id });
      break;
    }
    case "addNote": {
      if (!req.text.trim()) fail("ההערה ריקה");
      (s.notes[req.date] ??= []).push(req.text.trim());
      log(`הוסיף/ה הערה ל־${req.date.slice(8)}.11`, { kind: "note", id: req.date });
      break;
    }
    case "upsert": {
      if (!opts.admin) fail("אין הרשאה");
      const list = s[req.collection] as (Stop | Hotel | Move)[];
      const i = list.findIndex((x) => x.id === req.item.id);
      if (i >= 0) list[i] = req.item;
      else list.push(req.item);
      if (req.text) {
        const kind = req.collection === "stops" ? "stop" : req.collection === "hotels" ? "hotel" : "move";
        s.log.unshift({ id: uid("l"), at, by: null, claude: true, text: req.text, target: { kind, id: req.item.id } });
      }
      break;
    }
    default:
      fail("פעולה לא מוכרת");
  }
  s.rev = prev.rev + 1;
  s.log = s.log.slice(0, 300);
  return s;
}

function fail(msg: string): never {
  throw new OpError(msg);
}
