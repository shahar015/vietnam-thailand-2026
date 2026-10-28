import type { ReactNode } from "react";
import { DOW_SHORT, dates, dayNum, movesOn, stopForNight, weekday } from "@/lib/trip";
import { MoonStrip } from "./RouteTab";
import type { AppApi } from "./TripApp";
import { Icon, LargeTitle, Moon, Section } from "./ui";

export function NightsTab({ api, meButton }: { api: AppApi; meButton: ReactNode }) {
  const all = dates();
  const weeks: string[][] = [];
  all.forEach((d) => {
    if (!weeks.length || weekday(d) === 0) weeks.push([]);
    weeks.at(-1)!.push(d);
  });
  return (
    <main>
      <LargeTitle title="לילות" subtitle="הירח של כל לילה, עד הפול מון ב־24" leading={meButton} />
      <MoonStrip api={api} />
      <div className="px-4">
        {weeks.map((w) => (
          <Section key={w[0]} title={`${dayNum(w[0])}–${dayNum(w.at(-1)!)} בנובמבר`}>
            {w.map((d) => {
              const st = stopForNight(api.state, d);
              const moves = movesOn(api.state, d);
              const full = d === "2026-11-24";
              const pending = moves.some((m) => m.needsResearch);
              return (
                <button key={d} type="button" onClick={() => api.open({ kind: "day", date: d })}
                  className="press flex min-h-14 w-full items-center gap-3 border-b border-sep px-4 py-2.5 text-start last:border-b-0">
                  <span className="w-9 shrink-0 text-center">
                    <span className="block text-[12px] text-label3">{DOW_SHORT[weekday(d)]}</span>
                    <span className={`block text-[20px] font-semibold leading-tight tabular ${full ? "text-moon" : ""}`}>{dayNum(d)}</span>
                  </span>
                  <Moon date={d} size={full ? 26 : 20} glow={full} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: st ? `var(--${st.country})` : "var(--sep)" }} aria-hidden />
                      <span className={`truncate font-medium ${full ? "text-moon" : ""}`}>{full ? "פול מון" : st?.name ?? "טסים הביתה"}</span>
                    </span>
                    {moves.length > 0 && <span className="block truncate text-[13px] text-label2">{moves.map((m) => m.title).join(" · ")}</span>}
                  </span>
                  {pending && <span className="size-2 rounded-full bg-warn" aria-label="ממתין לבדיקה" />}
                  <Icon name="chevron" size={17} className="text-label3" />
                </button>
              );
            })}
          </Section>
        ))}
      </div>
    </main>
  );
}
