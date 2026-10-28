import { personName } from "@/lib/seed";
import { DOW, TRIP_END, TRIP_START, dayNum, fmtRange, moon, movesOn, peopleOn, pickOf, stopForNight, weekday } from "@/lib/trip";
import type { Move } from "@/lib/types";
import { HotelRow } from "./StopView";
import type { AppApi } from "./TripApp";
import { FriendBadge, Icon, Moon, ResearchBadge, Row, Section, Sheet, TextButton } from "./ui";

const shift = (d: string, n: number) => {
  const x = new Date(d + "T12:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const KIND_ICON: Record<Move["kind"], string> = { flight: "flight", bus: "bus", boat: "boat", car: "car", event: "event", walk: "walk" };

export function DaySheet({ api, date, onClose, onDate }: { api: AppApi; date: string; onClose: () => void; onDate: (d: string) => void }) {
  const st = stopForNight(api.state, date);
  const moves = movesOn(api.state, date);
  const notes = api.state.notes[date] ?? [];
  const people = peopleOn(api.state, date);
  const lit = Math.round(moon(date).lit * 100);
  const full = date === "2026-11-24";
  const pick = st && pickOf(api.state, st);
  const prevD = shift(date, -1), nextD = shift(date, 1);

  return (
    <Sheet open onClose={onClose} tall
      title={<span className="tabular">{dayNum(date)} בנובמבר</span>}
      leading={<TextButton onClick={onClose}>סגירה</TextButton>}
      trailing={
        <span className="flex">
          <button type="button" aria-label="היום הקודם" disabled={prevD < TRIP_START} onClick={() => onDate(prevD)} className="flex size-11 items-center justify-center text-accent disabled:opacity-30"><Icon name="chevron" size={22} className="rotate-180" /></button>
          <button type="button" aria-label="היום הבא" disabled={nextD > TRIP_END} onClick={() => onDate(nextD)} className="flex size-11 items-center justify-center text-accent disabled:opacity-30"><Icon name="chevron" size={22} /></button>
        </span>
      }>
      <div className="flex items-center gap-4 pb-5 pt-3">
        <Moon date={date} size={full ? 64 : 52} glow={full} />
        <div>
          <div className="text-[15px] text-label2">יום {DOW[weekday(date)]}</div>
          <div className={`text-[28px] font-bold leading-tight ${full ? "text-moon" : ""}`}>{full ? "פול מון בפנגן" : st?.name ?? (date === TRIP_END ? "חוזרים הביתה" : "בדרכים")}</div>
          <div className="text-[13px] text-label3 tabular">הירח מואר ב־{lit}%</div>
        </div>
      </div>

      <Section title="מי פה">
        <div className="flex flex-wrap gap-1.5 px-4 py-3">
          {people.map((p) => <span key={p} className="rounded-full bg-fill px-3 py-1 text-[15px] font-medium">{personName(p)}</span>)}
        </div>
      </Section>

      <Section title="תנועה ופעילויות" action={<TextButton onClick={() => api.open({ kind: "addMove", date })}>הוספה</TextButton>}>
        {moves.length === 0 && <Row><span className="text-[15px] text-label2">אין נסיעות ביום הזה.</span></Row>}
        {moves.map((m) => <MoveRow key={m.id} m={m} />)}
      </Section>

      {notes.length > 0 && (
        <Section title="שימו לב">
          {notes.map((n, i) => <Row key={i} leading={<Icon name="info" size={20} className="text-warn" />}><span className="text-[15px] leading-snug">{n}</span></Row>)}
        </Section>
      )}

      <Section title="ישנים הלילה ב" >
        {st ? (
          <>
            <Row onClick={() => api.showStop(st.id)}>
              <span className="font-semibold">{st.name}</span>
              <span className="ms-2 text-[15px] text-label2 tabular">{fmtRange(st.from, st.to)}</span>
            </Row>
            {pick && <HotelRow api={api} stop={st} hotel={pick} />}
            {!pick && st.lodgingNote && <Row><span className="text-[15px] text-label2">{st.lodgingNote}</span></Row>}
          </>
        ) : (
          <Row><span className="text-[15px] text-label2">{date === TRIP_END ? "טסים הביתה." : "אין עצירה בתאריך הזה."}</span></Row>
        )}
      </Section>

      <TextButton onClick={() => api.open({ kind: "addNote", date })}>הוספת הערה ליום</TextButton>
    </Sheet>
  );
}

function MoveRow({ m }: { m: Move }) {
  return (
    <div className="flex gap-3 border-b border-sep px-4 py-3 last:border-b-0">
      <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${m.kind === "event" ? "bg-[color-mix(in_srgb,var(--moon-glow)_30%,transparent)] text-moon" : "bg-accent-fill text-accent"}`}>
        <Icon name={KIND_ICON[m.kind]} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">{m.title}</span>
          {m.time && <span className="ltr shrink-0 text-[13px] text-label2 tabular">{m.time}</span>}
        </div>
        {m.detail && <p className="mt-0.5 text-[15px] leading-snug text-label2">{m.detail}</p>}
        {m.alt && <p className="mt-1 text-[13px] leading-snug text-label3">{m.alt}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {m.status === "booked" && <span className="rounded-full bg-ok-fill px-2 py-0.5 text-[12px] font-semibold text-ok">מוזמן</span>}
          {m.status === "todo" && !m.needsResearch && <span className="rounded-full bg-fill px-2 py-0.5 text-[12px] font-semibold text-label2">להזמין</span>}
          {m.needsResearch && <ResearchBadge />}
          {m.addedBy !== undefined && <FriendBadge by={m.addedBy} />}
          {m.price && <span className="ltr text-[13px] font-semibold tabular">{m.price}</span>}
          {m.link && <a href={m.link} target="_blank" rel="noopener noreferrer" className="flex min-h-8 items-center gap-1 text-[15px] text-accent">מחיר עדכני <Icon name="external" size={15} /></a>}
        </div>
      </div>
    </div>
  );
}
