import { DOW, TRIP_END, TRIP_START, dayNum, headcount, movesOn, nights, perNight, pickOf, scoreOf, stopForNight, visibleStops, weekday } from "@/lib/trip";
import type { Stop } from "@/lib/types";
import type { AppApi } from "./TripApp";
import { TripMap } from "./TripMap";
import { BookedMark, ClaudeMark, FriendMark, GlassButton, Row, RowIcon, Screen, Section, Tip } from "./ui";

export function RouteTab({ api }: { api: AppApi }) {
  const stops = visibleStops(api.state);
  const vn = stops.filter((s) => s.country === "vn");
  const th = stops.filter((s) => s.country === "th");
  return (
    <Screen title="וייטנאם ותאילנד" subtitle="2 עד 30 בנובמבר" leading={api.meButton}
      trailing={<GlassButton icon="plus" label="הוספת עצירה" onClick={() => api.open({ kind: "addStop" })} />}>
      <NextUp api={api} />
      <TripMap state={api.state} today={api.today ?? undefined} />
      <Tip id="route-stops" title="הקישו על עצירה" arrow>
        רואים את המלון שאנחנו ממליצים עליו, החלופות, למה בחרנו, ומי ישן עם מי.
      </Tip>
      <Section title="וייטנאם">{vn.map((s) => <StopRow key={s.id} api={api} stop={s} />)}</Section>
      <Section title="תאילנד">{th.map((s) => <StopRow key={s.id} api={api} stop={s} />)}</Section>
    </Screen>
  );
}

/** Before the trip: how long until we land. During it: where we are today. */
function NextUp({ api }: { api: AppApi }) {
  const t = api.today;
  if (!t || t > TRIP_END) return null;
  const before = t < TRIP_START;
  const date = before ? TRIP_START : t;
  const st = stopForNight(api.state, date);
  const n = movesOn(api.state, date).length;
  const days = Math.round((Date.parse(TRIP_START) - Date.parse(t)) / 864e5);
  return (
    <Section>
      <Row onClick={() => api.showDay(date)} leading={<RowIcon name="calendar" color="#e5484d" />}>
        <span className="block text-[17px] font-semibold">
          {before ? (days === 1 ? "מחר נוחתים בהאנוי" : `עוד ${days} ימים נוחתים בהאנוי`) : `היום ב${st?.name ?? "דרכים"}`}
        </span>
        <span className="block text-[15px] text-label2">
          יום {DOW[weekday(date)]}, {dayNum(date)} בנובמבר{n > 0 && `, ${n === 1 ? "נסיעה אחת" : `${n} נסיעות ופעילויות`}`}
        </span>
      </Row>
    </Section>
  );
}

function StopRow({ api, stop }: { api: AppApi; stop: Stop }) {
  const pick = pickOf(api.state, stop);
  const pp = pick ? perNight(pick, stop) : undefined;
  const pending = stop.needsResearch || api.state.hotels.some((h) => h.stopId === stop.id && h.needsResearch && !h.hidden);
  const n = nights(stop);
  const friend = stop.addedBy ?? pick?.addedBy;
  return (
    <Row onClick={() => api.showStop(stop.id)} label={`${stop.name}, ${dayNum(stop.from)} עד ${dayNum(stop.to)} בנובמבר`}
      leading={
        <span className="flex w-[46px] flex-col items-center leading-none tabular">
          <span className="ltr text-[17px] font-semibold">{dayNum(stop.from)}–{dayNum(stop.to)}</span>
          <span className="mt-1 text-[12px] text-label2">{n === 1 ? "לילה" : `${n} לילות`}</span>
        </span>
      }>
      <span className="block text-[17px] font-semibold">{stop.name}</span>
      <span className="block truncate text-[15px] text-label2">
        {pick ? <bdi>{pick.name}</bdi> : stop.lodgingNote ? "לינה דרך הטיול המאורגן" : "עוד אין המלצה"}
      </span>
      {(stop.bookedId || (pick && !stop.bookedId) || pending || friend !== undefined) && (
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {stop.bookedId && <BookedMark />}
          {pick && !stop.bookedId && pick.booking && (
            <>
              <span className="text-[13px] text-label2 tabular">ציון {scoreOf(pick)?.toFixed(1)}</span>
              {pp != null && <span className="text-[13px] text-label2 tabular">${Math.round(pp)} לאדם ללילה</span>}
            </>
          )}
          {pending && <ClaudeMark />}
          {friend !== undefined && <FriendMark by={friend} />}
        </span>
      )}
      <span className="sr-only">{headcount(stop)} אנשים</span>
    </Row>
  );
}
