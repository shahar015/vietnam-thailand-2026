import { DOW, DOW_SHORT, TRIP_END, TRIP_START, dates, dayNum, movesOn, stopForNight, weekday } from "@/lib/trip";
import { DayDetail } from "./DaySheet";
import type { AppApi } from "./TripApp";
import { Moon, Screen, Tip } from "./ui";

export function CalendarTab({ api, day, onDay }: { api: AppApi; day: string; onDay: (d: string) => void }) {
  const month = dates("2026-11-01", "2026-11-30");
  const lead = weekday(month[0]);
  const cells: (string | null)[] = [...Array(lead).fill(null), ...month];
  while (cells.length % 7) cells.push(null);

  return (
    <Screen title="ימים" subtitle="נובמבר 2026" leading={api.meButton}>
      <Tip id="calendar-days" title="הקישו על יום" arrow>
        מתחת ללוח יופיע מי בטיול באותו יום, הטיסות והנסיעות, הערות, ואיפה ישנים.
      </Tip>
      <section className="mb-8 rounded-[22px] bg-cell px-2 pb-2 pt-3" aria-label="לוח נובמבר">
        <div className="grid grid-cols-7 pb-1 text-center text-[13px] font-semibold text-label2" aria-hidden>
          {DOW_SHORT.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const inTrip = d >= TRIP_START && d <= TRIP_END;
            const on = d === day;
            const isToday = d === api.today;
            const full = d === "2026-11-24";
            const busy = movesOn(api.state, d).length > 0;
            const st = stopForNight(api.state, d);
            return (
              <button key={d} type="button" disabled={!inTrip} onClick={() => onDay(d)} aria-pressed={on}
                aria-label={`יום ${DOW[weekday(d)]}, ${dayNum(d)} בנובמבר${st ? `, ${st.name}` : ""}${busy ? ", יש נסיעות" : ""}${full ? ", ירח מלא" : ""}`}
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
      <DayDetail key={day} api={api} date={day} />
    </Screen>
  );
}
