import type { ReactNode } from "react";
import { scoreOf, fmtRange, nights, perNight, pickOf, visibleStops, dates, stopForNight, dayNum } from "@/lib/trip";
import type { Stop } from "@/lib/types";
import type { AppApi } from "./TripApp";
import { FriendBadge, Icon, LargeTitle, Moon, ResearchBadge, Row, Section } from "./ui";

export function RouteTab({ api, meButton }: { api: AppApi; meButton: ReactNode }) {
  const stops = visibleStops(api.state);
  const vn = stops.filter((s) => s.country === "vn");
  const th = stops.filter((s) => s.country === "th");
  return (
    <main>
      <LargeTitle title="וייטנאם ותאילנד" subtitle="2–30 בנובמבר · 28 לילות" leading={meButton}
        trailing={<button type="button" onClick={() => api.open({ kind: "addStop" })} className="flex size-11 items-center justify-center text-accent" aria-label="הוספת עצירה"><Icon name="plus" size={24} /></button>} />
      <MoonStrip api={api} />
      <div className="px-4">
        <Section title="וייטנאם">{vn.map((s) => <StopRow key={s.id} api={api} stop={s} />)}</Section>
        <Section title="תאילנד" footer="הציון הגדול הוא הציון שלנו: הדירוג ב־Booking, מתוקן לפי כמות הביקורות, כוכבים, איכות הדף, סוג המקום ומיקום.">
          {th.map((s) => <StopRow key={s.id} api={api} stop={s} />)}
        </Section>
      </div>
    </main>
  );
}

function StopRow({ api, stop }: { api: AppApi; stop: Stop }) {
  const pick = pickOf(api.state, stop);
  const pp = pick ? perNight(pick, stop) : undefined;
  const pendingHotels = api.state.hotels.some((h) => h.stopId === stop.id && h.needsResearch && !h.hidden);
  return (
    <Row onClick={() => api.showStop(stop.id)}
      leading={<span className="block h-10 w-1 rounded-full" style={{ background: `var(--${stop.country})` }} aria-hidden />}>
      <span className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[17px] font-semibold">{stop.name}</span>
        <span className="shrink-0 text-[15px] text-label2 tabular">{fmtRange(stop.from, stop.to)} · {nights(stop)} {nights(stop) === 1 ? "לילה" : "לילות"}</span>
      </span>
      {pick ? (
        <>
          <span className="mt-0.5 flex items-center gap-1.5 text-[15px] text-label2">
            {stop.bookedId && <Icon name="check" size={15} className="shrink-0 text-ok" label="הוזמן" />}
            <span className="min-w-0 truncate" dir="ltr" style={{ textAlign: "right" }}>{pick.name}</span>
          </span>
          <span className="mt-0.5 block text-[13px] text-label3 tabular">
            {stop.bookedId ? "הוזמן" : "ההמלצה"}
            {pick.booking && <> · ציון {scoreOf(pick)?.toFixed(1)}</>}
            {pp && !stop.bookedId && <> · ${Math.round(pp)} לאדם ללילה</>}
          </span>
        </>
      ) : (
        <span className="mt-0.5 block truncate text-[15px] text-label2">{stop.lodgingNote ? "לינה דרך הטיול המאורגן" : "עוד אין המלצה"}</span>
      )}
      {(stop.needsResearch || pendingHotels || stop.addedBy || pick?.addedBy) && (
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          {(stop.needsResearch || pendingHotels) && <ResearchBadge />}
          {stop.addedBy && <FriendBadge by={stop.addedBy} />}
          {!stop.addedBy && pick?.addedBy && <FriendBadge by={pick.addedBy} />}
        </span>
      )}
    </Row>
  );
}

/** Signature: every night of the trip with its real moon, building to the full moon on Phangan. */
export function MoonStrip({ api }: { api: AppApi }) {
  return (
    <div className="no-scrollbar mb-6 mt-3 flex gap-1 overflow-x-auto px-4 pb-1" role="list" aria-label="הלילות">
      {dates().map((d) => {
        const st = stopForNight(api.state, d);
        const full = d === "2026-11-24";
        return (
          <button key={d} type="button" role="listitem" onClick={() => api.open({ kind: "day", date: d })}
            aria-label={`${dayNum(d)} בנובמבר${st ? `, ${st.name}` : ""}`}
            className={`press flex w-11 shrink-0 flex-col items-center gap-1 rounded-[12px] py-2 ${full ? "bg-cell ring-1 ring-[var(--moon)]" : ""}`}>
            <Moon date={d} size={full ? 22 : 18} glow={full} />
            <span className={`tabular text-[15px] ${full ? "font-bold text-moon" : "font-medium"}`}>{dayNum(d)}</span>
            <span className="h-1 w-6 rounded-full" style={{ background: st ? `var(--${st.country})` : "var(--sep)" }} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
