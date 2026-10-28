import { personName } from "@/lib/seed";
import { DOW, TRIP_END, moon, movesOn, peopleOn, pickOf, stopForNight, weekday } from "@/lib/trip";
import type { Move } from "@/lib/types";
import { HotelLine, dateSpan } from "./StopView";
import type { AppApi } from "./TripApp";
import { ClaudeMark, FriendMark, Icon, Moon, Row, RowIcon, Section, Sheet } from "./ui";

const KIND: Record<Move["kind"], { icon: string; color: string; name: string }> = {
  flight: { icon: "flight", color: "#0a84ff", name: "טיסה" },
  bus: { icon: "bus", color: "#30a46c", name: "אוטובוס" },
  boat: { icon: "boat", color: "#0fa5b5", name: "סירה" },
  car: { icon: "car", color: "#8e8e93", name: "רכב" },
  walk: { icon: "walk", color: "#8e8e93", name: "הליכה" },
  event: { icon: "event", color: "#e0a100", name: "פעילות" },
};

export function DaySheet({ api, date, onClose }: { api: AppApi; date: string; onClose: () => void; onDate?: (d: string) => void }) {
  return (
    <Sheet onClose={onClose} title={`${Number(date.slice(8))} בנובמבר`}>
      <DayDetail api={api} date={date} />
      <Section>
        <Row onClick={() => api.showDay(date)} leading={<Icon name="calendar" className="text-tint" />}>
          <span className="text-tint">כל הימים בלוח</span>
        </Row>
      </Section>
    </Sheet>
  );
}

/** Everything about one day: the moon, who's here, what moves, notes, and where we sleep. */
export function DayDetail({ api, date }: { api: AppApi; date: string }) {
  const st = stopForNight(api.state, date);
  const moves = movesOn(api.state, date);
  const notes = api.state.notes[date] ?? [];
  const people = peopleOn(api.state, date);
  const full = date === "2026-11-24";
  const pick = st && pickOf(api.state, st);
  const lit = Math.round(moon(date).lit * 100);

  return (
    <>
      <div className="flex items-center gap-4 px-1 pb-6 pt-1">
        <Moon date={date} size={full ? 60 : 48} glow={full} />
        <div className="min-w-0">
          <div className="text-[15px] text-label2">יום {DOW[weekday(date)]}, {Number(date.slice(8))} בנובמבר</div>
          <div className="text-[28px] font-bold leading-[34px]">{full ? "פול מון בפנגן" : st?.name ?? (date === TRIP_END ? "חוזרים הביתה" : "בדרכים")}</div>
          <div className="text-[13px] text-label2 tabular">{full ? "ירח מלא" : `הירח מואר ב־${lit}%`}</div>
        </div>
      </div>

      <Section title="מי בטיול">
        <div className="flex flex-wrap gap-2 px-4 py-3.5">
          {people.map((p) => (
            <span key={p} className="flex items-center gap-1.5 rounded-full bg-fill py-1 pe-3 ps-1 text-[15px] font-medium">
              <span className="flex size-6 items-center justify-center rounded-full bg-[linear-gradient(#a1a1a6,#86868b)] text-[12px] font-semibold text-white">{personName(p).slice(0, 1)}</span>
              {personName(p)}
            </span>
          ))}
        </div>
      </Section>

      <Section title="נסיעות ופעילויות"
        action={<button type="button" onClick={() => api.open({ kind: "addMove", date })} className="min-h-9 px-1 text-[15px] font-semibold text-tint">הוספה</button>}>
        {moves.length === 0 && <Row><span className="text-[15px] text-label2">אין נסיעות ביום הזה.</span></Row>}
        {moves.map((m) => <MoveRow key={m.id} m={m} />)}
      </Section>

      <Section title="הערות"
        action={<button type="button" onClick={() => api.open({ kind: "addNote", date })} className="min-h-9 px-1 text-[15px] font-semibold text-tint">הוספה</button>}>
        {notes.length === 0 && <Row><span className="text-[15px] text-label2">אין הערות ליום הזה.</span></Row>}
        {notes.map((n, i) => (
          <Row key={i} leading={<Icon name="info" size={22} className="text-orange" />}><span className="text-[17px] leading-[22px]">{n}</span></Row>
        ))}
      </Section>

      <Section title="איפה ישנים">
        {st ? (
          <>
            <Row onClick={() => api.showStop(st.id)}>
              <span className="block font-semibold">{st.name}</span>
              <span className="block text-[15px] text-label2">{dateSpan(st)}</span>
            </Row>
            {pick && <HotelLine api={api} stop={st} hotel={pick} />}
            {!pick && st.lodgingNote && <Row><span className="text-[15px] leading-[20px] text-label2">{st.lodgingNote}</span></Row>}
          </>
        ) : (
          <Row><span className="text-[15px] text-label2">{date === TRIP_END ? "טסים הביתה." : "אין עצירה בתאריך הזה."}</span></Row>
        )}
      </Section>
    </>
  );
}

function MoveRow({ m }: { m: Move }) {
  const k = KIND[m.kind];
  return (
    <div className="flex items-start">
      <span className="py-3 ps-4" aria-label={k.name}><RowIcon name={k.icon} color={k.color} /></span>
      <div className="sep hair-b ms-3 min-w-0 flex-1 py-3 pe-4">
        <div className="text-[17px] font-semibold leading-[22px]">{m.title}</div>
        {m.time && <div className="text-[15px] text-label2 tabular"><bdi>{m.time}</bdi></div>}
        {m.detail && <p className="mt-1 text-[15px] leading-[20px]">{m.detail}</p>}
        {m.alt && <p className="mt-1 text-[13px] leading-[18px] text-label2">{m.alt}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {m.status === "booked" && <span className="text-[13px] font-semibold text-green">מוזמן</span>}
          {m.status === "todo" && !m.needsResearch && <span className="text-[13px] font-semibold text-label2">עוד לא הוזמן</span>}
          {m.needsResearch && <ClaudeMark />}
          {m.addedBy !== undefined && <FriendMark by={m.addedBy} />}
          {m.price && <span className="text-[13px] font-semibold tabular"><bdi>{m.price}</bdi></span>}
        </div>
        {m.link && (
          <a href={m.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-9 items-center gap-1 text-[15px] font-semibold text-tint">
            מחירים ושעות עדכניים <Icon name="external" size={15} />
          </a>
        )}
      </div>
    </div>
  );
}
