import { useEffect, useRef, useState, type ReactNode } from "react";
import { PEOPLE } from "@/lib/seed";
import { TRIP_END, TRIP_START } from "@/lib/trip";
import type { Country, MoveKind, PersonId } from "@/lib/types";
import { RoomBoard } from "./RoomBoard";
import type { AppApi } from "./TripApp";
import { Button, Field, Icon, inputCls, Picker, Row, Section, Segmented, Sheet, Switch } from "./ui";

/* Who made the change. Defaults to "me", optional. */
function Author({ value, onChange }: { value: PersonId | null; onChange: (p: PersonId | null) => void }) {
  return (
    <Section footer="לא חובה. השם יופיע ליד השינוי.">
      <Row trailing={
        <Picker label="מי עושה את השינוי" value={value ?? ""} onChange={(v) => onChange((v || null) as PersonId | null)}
          options={[...PEOPLE.map((p) => [p.id, p.name] as [string, string]), ["", "בלי שם"]]} />
      }>מי משנה</Row>
    </Section>
  );
}

function FormSheet({ title, onClose, onSave, canSave, busy, children }: {
  title: string; onClose: () => void; onSave: () => void; canSave: boolean; busy: boolean; children: ReactNode;
}) {
  return (
    <Sheet onClose={onClose} title={title} done={{ label: "שמירה", onClick: onSave, disabled: !canSave, busy }}>
      <div className="pt-2">{children}</div>
    </Sheet>
  );
}

/* ---------- Add a hotel, with free OpenStreetMap autocomplete (Photon) ---------- */
type Place = { name: string; sub: string; ll: [number, number] };

function slugName(url: string) {
  const m = url.match(/booking\.com\/hotel\/[a-z]{2}\/([^.?/]+)/i);
  return m ? m[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}

export function AddHotelSheet({ api, stopId, onClose }: { api: AppApi; stopId: string; onClose: () => void }) {
  const stop = api.state.stops.find((s) => s.id === stopId)!;
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [ll, setLl] = useState<[number, number] | undefined>();
  const [makePick, setMakePick] = useState(false);
  const [by, setBy] = useState<PersonId | null>(api.me);
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const chosen = useRef(false);

  useEffect(() => {
    if (chosen.current || name.trim().length < 3) { setResults([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const p = new URLSearchParams({ q: name, limit: "8", lang: "en" });
        if (stop.center) {
          const [la, lo] = stop.center.ll;
          p.set("lat", String(la)); p.set("lon", String(lo));
          p.set("bbox", [lo - 0.2, la - 0.2, lo + 0.2, la + 0.2].join(",")); // only places around this stop
        }
        ["tourism:hotel", "tourism:guest_house", "tourism:hostel", "tourism:motel", "tourism:apartment", "tourism:chalet"].forEach((t) => p.append("osm_tag", t));
        const r = await fetch(`https://photon.komoot.io/api/?${p}`, { signal: ctrl.signal });
        const j = await r.json();
        setResults((j.features ?? []).filter((f: { properties: { name?: string } }) => f.properties.name).map((f: { properties: Record<string, string>; geometry: { coordinates: [number, number] } }) => ({
          name: f.properties.name,
          sub: [f.properties.street, f.properties.city ?? f.properties.district, f.properties.country].filter(Boolean).join(", "),
          ll: [f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number],
        })));
      } catch {} finally { setSearching(false); }
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [name, stop.center]);

  const onUrl = (v: string) => {
    setUrl(v);
    const n = slugName(v);
    if (n && !name) { chosen.current = true; setName(n); }
  };
  const save = async () => {
    if (await api.run({ op: "addHotel", stopId, name, url: url || undefined, note: note || undefined, ll, makePick, by })) onClose();
  };

  return (
    <FormSheet title={`מלון ב${stop.name}`} onClose={onClose} onSave={save} canSave={name.trim().length > 1} busy={api.busy}>
      <div className="mb-3 flex h-11 items-center gap-2 rounded-full bg-fill px-3.5">
        <Icon name="search" size={19} className="text-label2" />
        <input className={inputCls} dir="auto" autoFocus value={name} placeholder="שם המלון" aria-label="שם המלון"
          onChange={(e) => { chosen.current = false; setLl(undefined); setName(e.target.value); }} />
      </div>
      {(results.length > 0 || searching) && (
        <Section footer="הצעות ממפת OpenStreetMap, רק מקומות ליד העצירה.">
          {searching && results.length === 0 && <Row><span className="text-[15px] text-label2">מחפש…</span></Row>}
          {results.map((r, i) => (
            <Row key={i} chevron={false} leading={<Icon name="pin" className="text-red" />}
              onClick={() => { chosen.current = true; setName(r.name); setLl(r.ll); setResults([]); }}>
              <bdi className="block text-right text-[17px]">{r.name}</bdi>
              <bdi className="block text-right text-[13px] text-label2">{r.sub}</bdi>
            </Row>
          ))}
        </Section>
      )}
      <Section footer="אפשר גם להדביק קישור מ־Booking. השם יתמלא ממנו.">
        <Field label="קישור">
          <input className={inputCls} dir="ltr" inputMode="url" value={url} placeholder="booking.com/hotel/…" onChange={(e) => onUrl(e.target.value)} />
        </Field>
        <Field label="למה הוא">
          <input className={inputCls} value={note} placeholder="לא חובה" onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Section>
      <Section footer="אפשר לבחור אותו כהמלצה כבר עכשיו. הוא יסומן ״קלוד עוד לא בדק״ עד שקלוד יבדוק אותו.">
        <Row trailing={<Switch checked={makePick} onChange={setMakePick} label="לבחור כהמלצה" />}>לבחור כהמלצה</Row>
      </Section>
      <Author value={by} onChange={setBy} />
    </FormSheet>
  );
}

/* ---------- Rooms and who comes ---------- */
export function RoomsSheet({ api, stopId, onClose }: { api: AppApi; stopId: string; onClose: () => void }) {
  const stop = api.state.stops.find((s) => s.id === stopId)!;
  const [people, setPeople] = useState<PersonId[]>(stop.people);
  const [rooms, setRooms] = useState(stop.rooms);
  const [roomOf, setRoomOf] = useState<Partial<Record<PersonId, number>>>(() => {
    const r: Partial<Record<PersonId, number>> = {};
    for (const p of stop.people) if (stop.roomOf?.[p]) r[p] = stop.roomOf[p];
    return r;
  });
  const [by, setBy] = useState<PersonId | null>(api.me);

  const sizes = (map: typeof roomOf, n: number) => Array.from({ length: n }, (_, i) => people.filter((p) => map[p] === i + 1).length);
  const toggle = (p: PersonId, on: boolean) => {
    if (on) {
      setPeople((cur) => PEOPLE.map((x) => x.id).filter((x) => x === p || cur.includes(x)));
      const s = sizes(roomOf, rooms);
      setRoomOf((m) => ({ ...m, [p]: s.indexOf(Math.min(...s)) + 1 })); // into the emptiest room
    } else {
      setPeople((cur) => cur.filter((x) => x !== p));
      setRoomOf((m) => { const n = { ...m }; delete n[p]; return n; });
    }
  };
  const setCount = (n: number) => {
    const c = Math.max(1, Math.min(8, n));
    setRooms(c);
    setRoomOf((m) => Object.fromEntries(Object.entries(m).filter(([, r]) => (r ?? 0) <= c)));
  };
  const auto = () => setRoomOf(Object.fromEntries(people.map((p, i) => [p, Math.min(rooms, Math.floor(i / Math.ceil(people.length / rooms)) + 1)])));

  const before = JSON.stringify([stop.people, stop.rooms, stop.people.map((p) => stop.roomOf?.[p] ?? 0)]);
  const after = JSON.stringify([people, rooms, people.map((p) => roomOf[p] ?? 0)]);
  const save = async () => { if (await api.run({ op: "setRooms", stopId, people, rooms, roomOf, by })) onClose(); };

  return (
    <FormSheet title={`חדרים ב${stop.name}`} onClose={onClose} onSave={save} canSave={people.length > 0 && before !== after} busy={api.busy}>
      <Section title="מי מגיע" footer="מי שלא מסומן לא נספר בחיפוש ב־Booking ולא מופיע בימים של העצירה.">
        {PEOPLE.map((p) => (
          <Row key={p.id} trailing={<Switch checked={people.includes(p.id)} onChange={(v) => toggle(p.id, v)} label={`${p.name} מגיע/ה`} />}>{p.name}</Row>
        ))}
      </Section>

      <Section>
        <Row trailing={
          <span className="flex items-center overflow-hidden rounded-full bg-fill">
            <button type="button" onClick={() => setCount(rooms - 1)} disabled={rooms <= 1} aria-label="פחות חדרים" className="flex h-9 w-12 items-center justify-center text-label disabled:opacity-30">−</button>
            <span className="h-5 w-px bg-sep" />
            <button type="button" onClick={() => setCount(rooms + 1)} disabled={rooms >= 8} aria-label="עוד חדר" className="flex h-9 w-12 items-center justify-center text-label disabled:opacity-30">+</button>
          </span>
        }>
          <span className="tabular">{rooms === 1 ? "חדר אחד" : `${rooms} חדרים`}</span>
        </Row>
      </Section>

      <div className="flex items-end justify-between px-4 pb-3">
        <h2 className="text-[20px] font-bold">מי ישן איפה</h2>
        {people.length > 1 && <button type="button" onClick={auto} className="min-h-9 px-1 text-[15px] font-semibold text-tint">חלוקה אוטומטית</button>}
      </div>
      {people.length === 0 ? (
        <p className="mb-8 px-4 text-[15px] text-label2">סמנו למעלה מי מגיע.</p>
      ) : (
        <RoomBoard people={people} rooms={rooms} roomOf={roomOf}
          onMove={(p, r) => setRoomOf((m) => { const n = { ...m }; if (r === 0) delete n[p]; else n[p] = r; return n; })} />
      )}
      <p className="-mt-3 mb-8 px-4 text-[13px] leading-[18px] text-label2">
        גוררים מהפס שבצד, או מקישים על שם ובוחרים חדר. Booking יחפש {people.length} {people.length === 1 ? "אדם" : "אנשים"} ב־{rooms === 1 ? "חדר אחד" : `${rooms} חדרים`}. שינוי במספר האנשים או החדרים מחכה לבדיקה של קלוד, כי המחירים משתנים.
      </p>
      <Author value={by} onChange={setBy} />
    </FormSheet>
  );
}

/* ---------- Dates of a stop ---------- */
export function EditStopSheet({ api, stopId, onClose }: { api: AppApi; stopId: string; onClose: () => void }) {
  const stop = api.state.stops.find((s) => s.id === stopId)!;
  const [name, setName] = useState(stop.name);
  const [from, setFrom] = useState(stop.from);
  const [to, setTo] = useState(stop.to);
  const [by, setBy] = useState<PersonId | null>(api.me);
  const [confirm, setConfirm] = useState(false);
  const changed = name !== stop.name || from !== stop.from || to !== stop.to;
  const save = async () => { if (await api.run({ op: "editStop", stopId, name, from, to, by })) onClose(); };
  return (
    <FormSheet title={`עריכת ${stop.name}`} onClose={onClose} onSave={save} canSave={changed && from < to} busy={api.busy}>
      <Section footer="שינוי תאריכים מחכה לבדיקה של קלוד, כי צריך לבדוק שוב מחירים וזמינות.">
        <Field label="שם"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="מגיעים"><input type="date" className={inputCls} min={TRIP_START} max={TRIP_END} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="עוזבים"><input type="date" className={inputCls} min={TRIP_START} max={TRIP_END} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </Section>
      <Section>
        <Row onClick={() => { onClose(); api.open({ kind: "rooms", stopId }); }}>חדרים ומי מגיע</Row>
      </Section>
      <Author value={by} onChange={setBy} />
      <Section>
        {!confirm ? (
          <Row onClick={() => setConfirm(true)} chevron={false} tone="red">הסרת העצירה מהמסלול</Row>
        ) : (
          <div className="p-4 text-center">
            <p className="text-[15px] leading-[20px]">להסיר את {stop.name} מהמסלול? כולם יראו שהוסרה.</p>
            <div className="mt-3 flex gap-2.5">
              <Button onClick={() => setConfirm(false)}>ביטול</Button>
              <Button kind="red" onClick={async () => { if (await api.run({ op: "hideStop", stopId, by })) onClose(); }}>הסרה</Button>
            </div>
          </div>
        )}
      </Section>
    </FormSheet>
  );
}

export function AddStopSheet({ api, onClose }: { api: AppApi; onClose: () => void }) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState<Country>("th");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [people, setPeople] = useState<PersonId[]>(["shahar", "adi"]);
  const [by, setBy] = useState<PersonId | null>(api.me);
  const save = async () => { if (await api.run({ op: "addStop", name, country, from, to, people, by })) onClose(); };
  return (
    <FormSheet title="עצירה חדשה" onClose={onClose} onSave={save} canSave={!!name.trim() && !!from && !!to && from < to && people.length > 0} busy={api.busy}>
      <div className="mb-4"><Segmented label="מדינה" value={country} onChange={setCountry} options={[["vn", "וייטנאם"], ["th", "תאילנד"]]} /></div>
      <Section>
        <Field label="איפה"><input className={inputCls} autoFocus value={name} placeholder="למשל פאי" onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="מגיעים"><input type="date" className={inputCls} min={TRIP_START} max={TRIP_END} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="עוזבים"><input type="date" className={inputCls} min={TRIP_START} max={TRIP_END} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </Section>
      <Section title="מי מגיע" footer="את החלוקה לחדרים אפשר לעשות אחרי השמירה, בעמוד של העצירה.">
        {PEOPLE.map((p) => (
          <Row key={p.id} trailing={<Switch checked={people.includes(p.id)} label={`${p.name} מגיע/ה`}
            onChange={(v) => setPeople((cur) => (v ? PEOPLE.map((x) => x.id).filter((x) => x === p.id || cur.includes(x)) : cur.filter((x) => x !== p.id)))} />}>{p.name}</Row>
        ))}
      </Section>
      <Author value={by} onChange={setBy} />
    </FormSheet>
  );
}

const KINDS: [MoveKind, string][] = [["flight", "טיסה"], ["bus", "אוטובוס"], ["boat", "סירה"], ["car", "רכב"], ["event", "פעילות"]];

export function AddMoveSheet({ api, date, onClose }: { api: AppApi; date: string; onClose: () => void }) {
  const [kind, setKind] = useState<MoveKind>("event");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [detail, setDetail] = useState("");
  const [by, setBy] = useState<PersonId | null>(api.me);
  const save = async () => { if (await api.run({ op: "addMove", date, kind, title, time, detail, by })) onClose(); };
  return (
    <FormSheet title={`הוספה ל־${Number(date.slice(8))} בנובמבר`} onClose={onClose} onSave={save} canSave={!!title.trim()} busy={api.busy}>
      <Section footer="מחכה לבדיקה של קלוד עד שיבדוק שעות ומחירים.">
        <Row trailing={<Picker label="סוג" value={kind} onChange={(v) => setKind(v as MoveKind)} options={KINDS} />}>סוג</Row>
        <Field label="מה"><input className={inputCls} autoFocus value={title} placeholder="למשל שיעור בישול" onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="מתי"><input className={inputCls} value={time} placeholder="לא חובה" onChange={(e) => setTime(e.target.value)} /></Field>
        <Field label="פרטים"><input className={inputCls} value={detail} placeholder="לא חובה" onChange={(e) => setDetail(e.target.value)} /></Field>
      </Section>
      <Author value={by} onChange={setBy} />
    </FormSheet>
  );
}

export function AddNoteSheet({ api, date, onClose }: { api: AppApi; date: string; onClose: () => void }) {
  const [text, setText] = useState("");
  const [by, setBy] = useState<PersonId | null>(api.me);
  const save = async () => { if (await api.run({ op: "addNote", date, text, by })) onClose(); };
  return (
    <FormSheet title={`הערה ל־${Number(date.slice(8))} בנובמבר`} onClose={onClose} onSave={save} canSave={!!text.trim()} busy={api.busy}>
      <Section>
        <textarea className={`${inputCls} block min-h-32 resize-none px-4 py-3.5 leading-[22px]`} autoFocus value={text} placeholder="מה חשוב לזכור ביום הזה?" aria-label="הערה" onChange={(e) => setText(e.target.value)} />
      </Section>
      <Author value={by} onChange={setBy} />
    </FormSheet>
  );
}
