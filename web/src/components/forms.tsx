import { useEffect, useRef, useState } from "react";
import { PEOPLE } from "@/lib/seed";
import { TRIP_END, TRIP_START } from "@/lib/trip";
import type { Country, MoveKind, PersonId } from "@/lib/types";
import type { AppApi } from "./TripApp";
import { Field, Icon, inputCls, Section, Sheet, TextButton } from "./ui";

/* Who made the change. Defaults to "me", optional. */
function Author({ value, onChange }: { value: PersonId | null; onChange: (p: PersonId | null) => void }) {
  return (
    <Section title="מי מוסיף/ה" footer="לא חובה. השם יופיע ליד השינוי.">
      <div className="flex flex-wrap gap-1.5 px-3 py-3">
        {PEOPLE.map((p) => (
          <button key={p.id} type="button" onClick={() => onChange(value === p.id ? null : p.id)} aria-pressed={value === p.id}
            className={`min-h-9 rounded-full px-3.5 text-[15px] font-medium ${value === p.id ? "bg-accent text-white dark:text-black" : "bg-fill text-label"}`}>
            {p.name}
          </button>
        ))}
      </div>
    </Section>
  );
}

function FormSheet({ title, onClose, onSave, canSave, busy, children }: {
  title: string; onClose: () => void; onSave: () => void; canSave: boolean; busy: boolean; children: React.ReactNode;
}) {
  return (
    <Sheet open onClose={onClose} title={title} tall
      leading={<TextButton onClick={onClose}>ביטול</TextButton>}
      trailing={<TextButton strong onClick={onSave} disabled={!canSave || busy}>{busy ? "שומר…" : "שמירה"}</TextButton>}>
      <div className="pt-3">{children}</div>
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
      <Section footer="מתחילים להקליד ומופיעות הצעות ממפת OpenStreetMap ליד העצירה. אפשר גם להדביק קישור מ־Booking.">
        <Field label="שם המלון">
          <div className="flex items-center gap-2">
            <Icon name="search" size={18} className="shrink-0 text-label3" />
            <input className={inputCls} dir="auto" autoFocus value={name} placeholder="למשל Sapa Lakeview Hotel"
              onChange={(e) => { chosen.current = false; setLl(undefined); setName(e.target.value); }} />
          </div>
        </Field>
        {(results.length > 0 || searching) && (
          <div className="border-b border-sep">
            {searching && results.length === 0 && <p className="px-4 py-2 text-[13px] text-label3">מחפש…</p>}
            {results.map((r, i) => (
              <button key={i} type="button" className="press flex w-full flex-col items-start px-4 py-2 text-start"
                onClick={() => { chosen.current = true; setName(r.name); setLl(r.ll); setResults([]); }}>
                <span className="text-[15px] font-medium" dir="auto">{r.name}</span>
                <span className="text-[12px] text-label3" dir="auto">{r.sub}</span>
              </button>
            ))}
          </div>
        )}
        <Field label="קישור (לא חובה)">
          <input className={inputCls} dir="ltr" inputMode="url" value={url} placeholder="https://www.booking.com/hotel/…" onChange={(e) => onUrl(e.target.value)} />
        </Field>
        <Field label="למה הוא? (לא חובה)">
          <textarea className={`${inputCls} min-h-16 resize-none`} value={note} placeholder="חבר המליץ, יש בריכה על הגג…" onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Section>
      <Section footer="אפשר לבחור אותו כהמלצה כבר עכשיו, עוד לפני שבדקתי אותו. הוא יישאר מסומן כ״ממתין לבדיקה״.">
        <label className="flex min-h-11 items-center justify-between px-4 py-2">
          <span>לבחור כהמלצה</span>
          <input type="checkbox" checked={makePick} onChange={(e) => setMakePick(e.target.checked)} className="size-6 accent-[var(--accent)]" />
        </label>
      </Section>
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
      <Section footer="שינוי תאריכים מסמן את העצירה כ״ממתינה לבדיקה״, כי צריך לבדוק שוב מחירים וזמינות.">
        <Field label="שם"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="מגיעים"><input type="date" className={inputCls} min={TRIP_START} max={TRIP_END} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="עוזבים"><input type="date" className={inputCls} min={TRIP_START} max={TRIP_END} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </Section>
      <Author value={by} onChange={setBy} />
      {!confirm ? (
        <TextButton danger onClick={() => setConfirm(true)}>הסרת העצירה מהמסלול</TextButton>
      ) : (
        <div className="rounded-[12px] bg-cell p-4 text-center">
          <p className="text-[15px]">להסיר את {stop.name} מהמסלול?</p>
          <div className="mt-2 flex justify-center gap-6">
            <TextButton onClick={() => setConfirm(false)}>ביטול</TextButton>
            <TextButton danger strong onClick={async () => { if (await api.run({ op: "hideStop", stopId, by })) onClose(); }}>הסרה</TextButton>
          </div>
        </div>
      )}
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
  const toggle = (p: PersonId) => setPeople((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  return (
    <FormSheet title="עצירה חדשה" onClose={onClose} onSave={save} canSave={!!name.trim() && !!from && !!to && from < to} busy={api.busy}>
      <Section>
        <Field label="איפה"><input className={inputCls} autoFocus value={name} placeholder="למשל פאי" onChange={(e) => setName(e.target.value)} /></Field>
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 rounded-[9px] bg-fill p-0.5 text-[15px] font-medium">
            {([["vn", "וייטנאם"], ["th", "תאילנד"]] as const).map(([c, label]) => (
              <button key={c} type="button" onClick={() => setCountry(c)} aria-pressed={country === c}
                className={`min-h-9 rounded-[7px] ${country === c ? "bg-cell shadow-sm" : "text-label2"}`}>{label}</button>
            ))}
          </div>
        </div>
        <Field label="מגיעים"><input type="date" className={inputCls} min={TRIP_START} max={TRIP_END} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="עוזבים"><input type="date" className={inputCls} min={TRIP_START} max={TRIP_END} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </Section>
      <Section title="מי שם">
        <div className="flex flex-wrap gap-1.5 px-3 py-3">
          {PEOPLE.map((p) => (
            <button key={p.id} type="button" onClick={() => toggle(p.id)} aria-pressed={people.includes(p.id)}
              className={`min-h-9 rounded-full px-3.5 text-[15px] font-medium ${people.includes(p.id) ? "bg-label text-bg" : "bg-fill"}`}>{p.name}</button>
          ))}
        </div>
      </Section>
      <Author value={by} onChange={setBy} />
    </FormSheet>
  );
}

const KINDS: [MoveKind, string, string][] = [
  ["flight", "טיסה", "flight"], ["bus", "אוטובוס", "bus"], ["boat", "סירה", "boat"], ["car", "רכב", "car"], ["event", "פעילות", "event"],
];

export function AddMoveSheet({ api, date, onClose }: { api: AppApi; date: string; onClose: () => void }) {
  const [kind, setKind] = useState<MoveKind>("event");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [detail, setDetail] = useState("");
  const [by, setBy] = useState<PersonId | null>(api.me);
  const save = async () => { if (await api.run({ op: "addMove", date, kind, title, time, detail, by })) onClose(); };
  return (
    <FormSheet title={`הוספה ל־${Number(date.slice(8))}.11`} onClose={onClose} onSave={save} canSave={!!title.trim()} busy={api.busy}>
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
        {KINDS.map(([k, label, icon]) => (
          <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k}
            className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-medium ${kind === k ? "bg-accent text-white dark:text-black" : "bg-cell"}`}>
            <Icon name={icon} size={17} />{label}
          </button>
        ))}
      </div>
      <Section footer="פריט חדש מסומן כ״ממתין לבדיקה״ עד שאבדוק שעות ומחירים.">
        <Field label="מה"><input className={inputCls} autoFocus value={title} placeholder="למשל שיעור בישול" onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="מתי (לא חובה)"><input className={inputCls} value={time} placeholder="10:00" onChange={(e) => setTime(e.target.value)} /></Field>
        <Field label="פרטים (לא חובה)"><textarea className={`${inputCls} min-h-16 resize-none`} value={detail} onChange={(e) => setDetail(e.target.value)} /></Field>
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
    <FormSheet title={`הערה ל־${Number(date.slice(8))}.11`} onClose={onClose} onSave={save} canSave={!!text.trim()} busy={api.busy}>
      <Section>
        <Field label="הערה"><textarea className={`${inputCls} min-h-24 resize-none`} autoFocus value={text} onChange={(e) => setText(e.target.value)} /></Field>
      </Section>
      <Author value={by} onChange={setBy} />
    </FormSheet>
  );
}
