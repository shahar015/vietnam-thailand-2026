import { DOW, DOW_SHORT, TRIP_END, TRIP_START, dates, dayMonth, dayNum, isFullMoon, monthName, movesOn, stopForNight, visibleStops, weekday } from "@/lib/trip";
import { DayDetail } from "./DaySheet";
import type { AppApi } from "./TripApp";
import { Moon, Screen, Tip } from "./ui";

/** "YYYY-MM" for every month from the trip's start to the last stop's checkout. */
function tripMonths(lastDay: string): string[] {
  const out: string[] = [];
  let [y, m] = TRIP_START.slice(0, 7).split("-").map(Number);
  const end = lastDay.slice(0, 7);
  for (;;) {
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    out.push(ym);
    if (ym >= end) return out;
    m = m === 12 ? 1 : m + 1;
    if (m === 1) y += 1;
  }
}

const lastDayOf = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${ym}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
};

export function CalendarTab({ api, day, onDay }: { api: AppApi; day: string; onDay: (d: string) => void }) {
  const lastStop = visibleStops(api.state).at(-1);
  const months = tripMonths(lastStop ? lastStop.to : TRIP_START);
  const subtitle = months.length === 1 ? `${monthName(months[0])} 2026` : `${monthName(months[0])} עד ${monthName(months[months.length - 1])} 2026`;

  return (
    <Screen title="ימים" subtitle={subtitle} leading={api.meButton}>
      <Tip id="calendar-days" title="הקישו על יום" arrow>
        מתחת ללוח יופיע מי בטיול באותו יום, הטיסות והנסיעות, הערות, ואיפה ישנים.
      </Tip>
      {months.map((ym) => <Month key={ym} api={api} ym={ym} day={day} onDay={onDay} titled={months.length > 1} />)}
      <DayDetail key={day} api={api} date={day} />
    </Screen>
  );
}

function Month({ api, ym, day, onDay, titled }: { api: AppApi; ym: string; day: string; onDay: (d: string) => void; titled: boolean }) {
  const month = dates(`${ym}-01`, lastDayOf(ym));
  const cells: (string | null)[] = [...Array(weekday(month[0])).fill(null), ...month];
  while (cells.length % 7) cells.push(null);
  const name = monthName(`${ym}-01`);

  return (
    <section className="mb-8 rounded-[22px] bg-cell px-2 pb-2 pt-3" aria-label={`לוח ${name}`}>
      {titled && <h2 className="px-2 pb-2 text-[20px] font-bold">{name}</h2>}
      <div className="grid grid-cols-7 pb-1 text-center text-[13px] font-semibold text-label2" aria-hidden>
        {DOW_SHORT.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const inTrip = d >= TRIP_START && d <= TRIP_END;
          const on = d === day;
          const isToday = d === api.today;
          const full = isFullMoon(d);
          const busy = movesOn(api.state, d).length > 0;
          const st = stopForNight(api.state, d);
          return (
            <button key={d} type="button" disabled={!inTrip} onClick={() => onDay(d)} aria-pressed={on}
              aria-label={`יום ${DOW[weekday(d)]}, ${dayMonth(d)}${st ? `, ${st.name}` : ""}${busy ? ", יש נסיעות" : ""}${full ? ", ירח מלא" : ""}`}
              className="flex h-[54px] flex-col items-center justify-start gap-[3px] pt-1 disabled:opacity-100">
              <span className={`flex size-9 items-center justify-center rounded-full text-[19px] tabular transition-colors ${
                on ? "bg-tint font-semibold text-white" : isToday ? "font-semibold text-[#ff3b30]" : inTrip ? "text-label" : "text-[#c7c7cc]"}`}>
                {dayNum(d)}
              </span>
              {full ? <Moon date={d} size={11} glow /> : busy && inTrip ? <span className="size-[6px] rounded-full bg-[#a1a1a6]" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
