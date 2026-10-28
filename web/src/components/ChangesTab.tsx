import { useState, type ReactNode } from "react";
import { personName } from "@/lib/seed";
import { researchQueue } from "@/lib/trip";
import type { AppApi } from "./TripApp";
import { FriendBadge, Icon, LargeTitle, Row, Section } from "./ui";

const when = (iso: string) =>
  new Date(iso).toLocaleString("he-IL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });

export function ChangesTab({ api, meButton }: { api: AppApi; meButton: ReactNode }) {
  const [view, setView] = useState<"queue" | "log">("queue");
  const q = researchQueue(api.state);
  const stopName = (id: string) => api.state.stops.find((s) => s.id === id)?.name ?? "";
  const count = q.stops.length + q.hotels.length + q.moves.length;

  return (
    <main>
      <LargeTitle title="שינויים" leading={meButton} />
      <div className="px-4 pt-3">
        <div className="mb-5 grid grid-cols-2 rounded-[9px] bg-fill p-0.5 text-[15px] font-medium" role="tablist">
          {([["queue", `ממתין לבדיקה${count ? ` (${count})` : ""}`], ["log", "כל השינויים"]] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)}
              className={`min-h-9 rounded-[7px] ${view === id ? "bg-cell shadow-sm" : "text-label2"}`}>{label}</button>
          ))}
        </div>

        {view === "queue" && (
          count === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-label2">הכל נבדק. כל דבר חדש שתוסיפו יופיע כאן עד שאבדוק אותו.</p>
          ) : (
            <>
              {q.hotels.length > 0 && (
                <Section title="מלונות">
                  {q.hotels.map((h) => (
                    <Row key={h.id} onClick={() => api.open({ kind: "hotel", id: h.id })}>
                      <span className="ltr block font-medium" dir="ltr" style={{ textAlign: "right" }}>{h.name}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-label2">{stopName(h.stopId)} {h.addedBy !== undefined && <FriendBadge by={h.addedBy} />}</span>
                    </Row>
                  ))}
                </Section>
              )}
              {q.stops.length > 0 && (
                <Section title="עצירות ותאריכים">
                  {q.stops.map((s) => (
                    <Row key={s.id} onClick={() => api.showStop(s.id)}>
                      <span className="font-medium">{s.name}</span>
                      {s.addedBy !== undefined && <span className="mt-1 block"><FriendBadge by={s.addedBy} /></span>}
                    </Row>
                  ))}
                </Section>
              )}
              {q.moves.length > 0 && (
                <Section title="נסיעות ופעילויות">
                  {q.moves.map((m) => (
                    <Row key={m.id} onClick={() => api.open({ kind: "day", date: m.date })}>
                      <span className="font-medium">{m.title}</span>
                      <span className="mt-1 flex items-center gap-2 text-[13px] text-label2 tabular">{Number(m.date.slice(8))}.11 {m.addedBy !== undefined && <FriendBadge by={m.addedBy} />}</span>
                    </Row>
                  ))}
                </Section>
              )}
            </>
          )
        )}

        {view === "log" && (
          api.state.log.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-label2">עוד אין שינויים. כל עריכה תופיע כאן עם השם של מי שעשה אותה.</p>
          ) : (
            <Section>
              {api.state.log.map((l) => (
                <Row key={l.id} leading={<Icon name={l.by ? "person" : "changes"} size={20} className="text-label3" />}>
                  <span className="text-[15px] leading-snug"><b className="font-semibold">{l.by ? personName(l.by) : "מישהו"}</b> {l.text}</span>
                  <span className="mt-0.5 block text-[12px] text-label3 tabular">{when(l.at)}</span>
                </Row>
              ))}
            </Section>
          )
        )}
      </div>
    </main>
  );
}
