import { useState } from "react";
import { personName } from "@/lib/seed";
import { researchQueue } from "@/lib/trip";
import type { AppApi } from "./TripApp";
import { FriendMark, Icon, Row, Screen, Section, Segmented } from "./ui";

const when = (iso: string) =>
  new Date(iso).toLocaleString("he-IL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });

export function ChangesTab({ api }: { api: AppApi }) {
  const [view, setView] = useState<"queue" | "log">("queue");
  const q = researchQueue(api.state);
  const stopName = (id: string) => api.state.stops.find((s) => s.id === id)?.name ?? "";
  const count = q.stops.length + q.hotels.length + q.moves.length;

  return (
    <Screen title="שינויים" leading={api.meButton}>
      <div className="mb-6">
        <Segmented label="תצוגה" value={view} onChange={setView}
          options={[["queue", count ? `לבדיקה של קלוד (${count})` : "לבדיקה של קלוד"], ["log", "היסטוריה"]]} />
      </div>

      {view === "queue" && (count === 0 ? (
        <Empty icon="sparkle" title="קלוד בדק הכל">
          כל מלון, עצירה או נסיעה שתוסיפו או תשנו יופיעו כאן, עד שקלוד יבדוק מחיר, ציון, מרחקים, יתרונות וחסרונות.
        </Empty>
      ) : (
        <>
          <p className="mb-5 px-4 text-[15px] leading-[20px] text-label2">
            כאן מחכים הדברים שהוספתם או שיניתם. קלוד יבדוק כל אחד ויוסיף את מה שחסר. הסימון של מי ההצעה נשאר גם אחרי הבדיקה.
          </p>
          {q.hotels.length > 0 && (
            <Section title="מלונות">
              {q.hotels.map((h) => (
                <Row key={h.id} onClick={() => api.open({ kind: "hotel", id: h.id })}>
                  <bdi className="block">{h.name}</bdi>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[15px] text-label2">
                    {stopName(h.stopId)}
                    {h.addedBy !== undefined && <FriendMark by={h.addedBy} />}
                  </span>
                </Row>
              ))}
            </Section>
          )}
          {q.stops.length > 0 && (
            <Section title="עצירות, תאריכים וחדרים">
              {q.stops.map((s) => (
                <Row key={s.id} onClick={() => api.showStop(s.id)}>
                  <span className="block">{s.name}</span>
                  {s.addedBy !== undefined && <span className="mt-0.5 block"><FriendMark by={s.addedBy} /></span>}
                </Row>
              ))}
            </Section>
          )}
          {q.moves.length > 0 && (
            <Section title="נסיעות ופעילויות">
              {q.moves.map((m) => (
                <Row key={m.id} onClick={() => api.open({ kind: "day", date: m.date })}>
                  <span className="block">{m.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[15px] text-label2 tabular">
                    {Number(m.date.slice(8))} בנובמבר
                    {m.addedBy !== undefined && <FriendMark by={m.addedBy} />}
                  </span>
                </Row>
              ))}
            </Section>
          )}
        </>
      ))}

      {view === "log" && (api.state.log.length === 0 ? (
        <Empty icon="changes" title="עוד אין שינויים">כל עריכה תופיע כאן, עם השם של מי שעשה אותה.</Empty>
      ) : (
        <Section>
          {api.state.log.map((l) => (
            <Row key={l.id} leading={<Icon name={l.by ? "person" : "changes"} size={22} className="text-label3" />}>
              <span className="block text-[15px] leading-[20px]"><b className="font-semibold">{l.by ? personName(l.by) : "מישהו"}</b> {l.text}</span>
              <span className="mt-0.5 block text-[13px] text-label2 tabular">{when(l.at)}</span>
            </Row>
          ))}
        </Section>
      ))}
    </Screen>
  );
}

function Empty({ icon, title, children }: { icon: string; title: string; children: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <Icon name={icon} size={44} weight={1.6} className="text-label3" />
      <h2 className="mt-3 text-[22px] font-bold">{title}</h2>
      <p className="mt-1 text-[15px] leading-[20px] text-label2">{children}</p>
    </div>
  );
}
