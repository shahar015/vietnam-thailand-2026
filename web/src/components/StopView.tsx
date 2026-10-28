import type { ReactNode } from "react";
import { personName } from "@/lib/seed";
import { DOW, dates, dayNum, fmtRange, getThere, hotelsOf, nights, perNight, pickOf, scoreOf, weekday } from "@/lib/trip";
import type { Hotel, Stop } from "@/lib/types";
import type { AppApi } from "./TripApp";
import { FriendBadge, Icon, LargeTitle, Moon, Pill, ResearchBadge, Row, Scores, Section } from "./ui";

export function StopView({ api, stopId, onBack, meButton }: { api: AppApi; stopId: string; onBack: () => void; meButton: ReactNode }) {
  const stop = api.state.stops.find((s) => s.id === stopId);
  if (!stop) return null;
  const list = hotelsOf(api.state, stop.id);
  const pick = pickOf(api.state, stop);
  const others = list.filter((h) => h.id !== pick?.id);
  const n = nights(stop);

  return (
    <main>
      <LargeTitle title={stop.name} back={{ label: "מסלול", onClick: onBack }}
        subtitle={<span className="tabular">{fmtRange(stop.from, stop.to)} · {n} {n === 1 ? "לילה" : "לילות"} · {stop.people.map(personName).join(", ")}</span>}
        trailing={<>
          <button type="button" onClick={() => api.open({ kind: "editStop", stopId: stop.id })} className="min-h-11 px-2 text-[17px] text-accent">עריכה</button>
          {meButton}
        </>} />

      <div className="mt-5 px-4">
        {(stop.needsResearch || stop.addedBy) && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {stop.needsResearch && <ResearchBadge />}
            {stop.addedBy && <FriendBadge by={stop.addedBy} />}
          </div>
        )}

        {stop.lodgingNote && (
          <Section title="לינה">
            <Row leading={<Icon name="bed" className="text-label2" />}><span className="text-[15px]">{stop.lodgingNote}</span></Row>
          </Section>
        )}

        {pick && (
          <Section title={stop.bookedId ? "הוזמן" : "ההמלצה"}>
            <HotelRow api={api} stop={stop} hotel={pick} big />
          </Section>
        )}

        {!stop.bookedId && stop.why && list.length > 1 && <WhyBlock stop={stop} hotels={list} pickId={pick?.id} />}

        {!stop.lodgingNote && (
          <Section title={stop.bookedId ? "אפשרויות שנבדקו" : "חלופות"}
            footer="כל אחד יכול להוסיף מלון. הוא יסומן כ״ממתין לבדיקה״ עד שאחקור אותו ואוסיף ציון, יתרונות וחסרונות.">
            {others.map((h) => <HotelRow key={h.id} api={api} stop={stop} hotel={h} />)}
            <Row onClick={() => api.open({ kind: "addHotel", stopId: stop.id })} chevron={false}
              leading={<span className="flex size-7 items-center justify-center rounded-full bg-accent-fill text-accent"><Icon name="plus" size={18} /></span>}>
              <span className="text-accent">הוספת מלון</span>
            </Row>
          </Section>
        )}

        {stop.rides && (
          <Section title="Grab ו־Bolt">
            <Row><span className="text-[15px] leading-snug">{stop.rides}</span></Row>
          </Section>
        )}

        <Section title="הלילות כאן">
          {dates(stop.from, stop.to).slice(0, -1).map((d) => (
            <Row key={d} onClick={() => api.open({ kind: "day", date: d })} leading={<Moon date={d} size={20} />}>
              <span className="tabular">יום {DOW[weekday(d)]}, {dayNum(d)} בנובמבר</span>
            </Row>
          ))}
        </Section>
      </div>
    </main>
  );
}

export function HotelRow({ api, stop, hotel, big = false }: { api: AppApi; stop: Stop; hotel: Hotel; big?: boolean }) {
  const pp = perNight(hotel, stop);
  const there = getThere(hotel, stop);
  return (
    <Row onClick={() => api.open({ kind: "hotel", id: hotel.id })}>
      <span className="flex items-start justify-between gap-3">
        <span className={`ltr min-w-0 text-start ${big ? "text-[19px] font-semibold" : "text-[17px] font-medium"}`} dir="ltr">{hotel.name}</span>
        <span className="shrink-0 pt-0.5"><Scores booking={hotel.booking?.score} ours={scoreOf(hotel)} compact={!big} /></span>
      </span>
      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-label2 tabular">
        {pp != null && <span>${Math.round(pp)} לאדם ללילה</span>}
        {hotel.priceTotal != null && <span className="text-label3">(${hotel.priceTotal} סה״כ)</span>}
        {there?.walk && <span>{there.walk.split(" (")[0]}{stop.center ? ` ל${stop.center.name}` : ""}</span>}
        {!there?.walk && there?.ride && <span>{there.ride.split(" (")[0]}{stop.center ? ` ל${stop.center.name}` : ""}</span>}
      </span>
      {(hotel.needsResearch || hotel.addedBy || (big && hotel.pros?.length)) && (
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          {hotel.needsResearch && <ResearchBadge />}
          {hotel.addedBy !== undefined && hotel.addedBy !== null && <FriendBadge by={hotel.addedBy} />}
          {hotel.addedBy === null && <FriendBadge />}
          {big && !hotel.needsResearch && hotel.pros?.slice(0, 2).map((p) => <Pill key={p}>{p}</Pill>)}
        </span>
      )}
    </Row>
  );
}

/** Why the pick won, with every option's score and price on the same two bars. */
function WhyBlock({ stop, hotels, pickId }: { stop: Stop; hotels: Hotel[]; pickId?: string }) {
  const rows = hotels.filter((h) => h.booking).map((h) => ({ h, s: scoreOf(h)!, pp: perNight(h, stop) }));
  const maxPP = Math.max(1, ...rows.map((r) => r.pp ?? 0));
  const lo = Math.min(...rows.map((r) => r.s)) - 0.3;
  const hi = Math.max(...rows.map((r) => r.s));
  return (
    <Section title="למה ההמלצה הזו" footer="הכלל: מנצח הציון שלנו הכי גבוה, אלא אם יש מלון שנמוך ממנו ב־0.25 לכל היותר ועולה 60% או פחות. אז הוא מנצח בתמורה למחיר.">
      <div className="px-4 py-3">
        <p className="text-[15px] leading-relaxed">{stop.why}</p>
        <div className="mt-4 grid grid-cols-[minmax(0,1.3fr)_1fr_1fr] gap-x-3 gap-y-2 text-[12px]">
          <span className="text-label3">מלון</span>
          <span className="text-label3">הציון שלנו</span>
          <span className="text-label3">לאדם ללילה</span>
          {rows.map(({ h, s, pp }) => (
            <Bars key={h.id} name={h.name} pick={h.id === pickId} s={s} sw={(s - lo) / Math.max(0.1, hi - lo)} pp={pp} pw={(pp ?? 0) / maxPP} />
          ))}
        </div>
      </div>
    </Section>
  );
}
function Bars({ name, pick, s, sw, pp, pw }: { name: string; pick: boolean; s: number; sw: number; pp?: number; pw: number }) {
  const bar = (w: number, label: string) => (
    <span className="relative flex h-5 items-center overflow-hidden rounded-[5px] bg-fill">
      <span className="absolute inset-y-0 start-0 rounded-[5px]" style={{ width: `${Math.max(10, w * 100)}%`, background: pick ? "var(--accent)" : "var(--label3)", opacity: pick ? 0.9 : 0.35 }} />
      <span className={`relative px-1.5 font-semibold tabular ${pick ? "text-white dark:text-black" : ""}`}>{label}</span>
    </span>
  );
  return (
    <>
      <span className={`truncate self-center ${pick ? "font-semibold" : ""}`} dir="ltr" style={{ textAlign: "right" }}>{name}</span>
      {bar(sw, s.toFixed(1))}
      {pp != null ? bar(pw, `$${Math.round(pp)}`) : <span className="text-label3">—</span>}
    </>
  );
}
