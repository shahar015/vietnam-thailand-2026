import { personName } from "@/lib/seed";
import { typeLabel } from "@/lib/score";
import { DOW, bookingUrl, dates, dayNum, getThere, headcount, hotelsOf, nights, perNight, pickOf, roomsOf, scoreOf, weekday } from "@/lib/trip";
import type { Hotel, Stop } from "@/lib/types";
import type { AppApi } from "./TripApp";
import { BookedMark, Button, ClaudeMark, FriendMark, GlassPill, Icon, InfoStrip, Moon, Row, Screen, Section, Tip } from "./ui";

export const dateSpan = (st: Stop) => `${dayNum(st.from)} עד ${dayNum(st.to)} בנובמבר`;
const names = (ps: string[]) => (ps.length < 2 ? ps.join("") : `${ps.slice(0, -1).join(", ")} ו${ps.at(-1)}`);

export function StopView({ api, stopId, onBack }: { api: AppApi; stopId: string; onBack: () => void }) {
  const stop = api.state.stops.find((s) => s.id === stopId);
  if (!stop) return null;
  const list = hotelsOf(api.state, stop.id);
  const pick = pickOf(api.state, stop);
  const others = list.filter((h) => h.id !== pick?.id);
  const n = nights(stop);

  return (
    <div className="push-enter">
      <Screen title={stop.name} subtitle={`${dateSpan(stop)}, ${n === 1 ? "לילה אחד" : `${n} לילות`}`}
        back={{ label: "המסלול", onClick: onBack }}
        trailing={<GlassPill onClick={() => api.open({ kind: "editStop", stopId: stop.id })}>עריכה</GlassPill>}>

        {(stop.needsResearch || stop.addedBy !== undefined) && (
          <Section>
            <Row leading={<Icon name="sparkle" size={22} className={stop.needsResearch ? "text-orange" : "text-purple"} />}>
              <span className="block text-[15px] leading-[20px]">
                {stop.needsResearch
                  ? "קלוד עוד לא בדק את השינוי האחרון כאן. הוא יבדוק מחירים וזמינות לתאריכים ולחדרים החדשים."
                  : "העצירה הזו נוספה על ידי אחד מאיתנו."}
              </span>
              {stop.addedBy !== undefined && <span className="mt-1 block"><FriendMark by={stop.addedBy} /></span>}
            </Row>
          </Section>
        )}

        {stop.lodgingNote && (
          <Section title="לינה">
            <Row leading={<Icon name="bed" className="text-label2" />}><span className="text-[15px] leading-[20px]">{stop.lodgingNote}</span></Row>
          </Section>
        )}

        {pick && <PlaceCard api={api} stop={stop} hotel={pick} />}

        <Rooms api={api} stop={stop} />

        {!stop.bookedId && stop.why && list.length > 1 && (
          <Section title="למה דווקא הוא" footer="הכלל: מנצח הציון שלנו הכי גבוה, אלא אם יש מלון שנמוך ממנו ב־0.25 לכל היותר ועולה 60% או פחות. אז הוא מנצח בתמורה למחיר.">
            <p className="px-4 py-3.5 text-[17px] leading-[24px]">{stop.why}</p>
          </Section>
        )}

        {others.length > 0 && (
          <Tip id="add-hotel" title="מצאתם מלון אחר?">
            הוסיפו אותו בסוף הרשימה. אפשר לבחור אותו כהמלצה מיד, וקלוד יבדוק אותו ויוסיף ציון, יתרונות וחסרונות.
          </Tip>
        )}
        <Section title={stop.bookedId ? "אפשרויות שנבדקו" : stop.lodgingNote ? "מלון משלנו" : "חלופות"}
          footer={others.length > 0 ? "הציון הגדול הוא הציון שלנו: הדירוג ב־Booking, מתוקן לפי כמות הביקורות, כוכבים, איכות הדף, סוג המקום ומיקום." : undefined}>
          {others.map((h) => <HotelLine key={h.id} api={api} stop={stop} hotel={h} />)}
          <Row onClick={() => api.open({ kind: "addHotel", stopId: stop.id })} chevron={false} tone="tint"
            leading={<Icon name="plus" size={22} weight={2.2} className="text-tint" />}>
            {stop.lodgingNote && !pick ? "הוספת מלון שהזמנו או מציעים" : "הצעת מלון"}
          </Row>
        </Section>

        {stop.rides && (
          <Section title="מוניות ואפליקציות">
            <Row leading={<Icon name="car" className="text-label2" />}><span className="text-[15px] leading-[20px]">{stop.rides}</span></Row>
          </Section>
        )}

        <Section title="הלילות כאן">
          {dates(stop.from, stop.to).slice(0, -1).map((d) => (
            <Row key={d} onClick={() => api.open({ kind: "day", date: d })} leading={<Moon date={d} size={22} glow={d === "2026-11-24"} />}>
              יום {DOW[weekday(d)]}, {dayNum(d)} בנובמבר
            </Row>
          ))}
        </Section>
      </Screen>
    </div>
  );
}

/** The pick, laid out like a place card in Apple Maps. */
function PlaceCard({ api, stop, hotel }: { api: AppApi; stop: Stop; hotel: Hotel }) {
  const pp = perNight(hotel, stop);
  const there = getThere(hotel, stop);
  const mins = (s?: string) => s?.match(/~(\d+)/)?.[1];
  const b = hotel.booking;
  const items = [
    b && { label: "הציון שלנו", value: scoreOf(hotel)!.toFixed(1) },
    b && { label: "Booking", value: b.score.toFixed(1), sub: `${b.reviews.toLocaleString("en-US")} ביקורות` },
    pp != null && { label: "לאדם ללילה", value: `$${Math.round(pp)}` },
    there && { label: `עד ${stop.center?.name ?? "המרכז"}`, value: `${mins(there.walk ?? there.ride)} דק׳`, sub: there.walk ? "ברגל" : "במונית" },
  ].filter(Boolean) as { label: string; value: string; sub?: string }[];
  const kind = [typeLabel(b?.type), b?.stars ? `${b.stars.n} כוכבים` : null].filter(Boolean).join(", ");

  return (
    <Section title={stop.bookedId ? "הוזמן" : "המלון שאנחנו ממליצים עליו"}>
      <button type="button" onClick={() => api.open({ kind: "hotel", id: hotel.id })} className="press block w-full px-4 pb-3 pt-4 text-start">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <bdi className="block text-right text-[22px] font-bold leading-[28px]">{hotel.name}</bdi>
            {kind && <span className="mt-0.5 block text-[15px] text-label2">{kind}</span>}
          </span>
          <span className="mt-1.5"><Icon name="chevron" size={15} weight={2.4} className="text-[#c4c4c7]" /></span>
        </span>
        {(stop.bookedId || hotel.needsResearch || hotel.addedBy !== undefined) && (
          <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {stop.bookedId && <BookedMark />}
            {hotel.needsResearch && <ClaudeMark />}
            {hotel.addedBy !== undefined && <FriendMark by={hotel.addedBy} />}
          </span>
        )}
      </button>
      {items.length > 0 && <div className="px-1 pb-3"><InfoStrip items={items} /></div>}
      <div className="flex gap-2.5 px-4 pb-4">
        <Button kind="prominent" href={bookingUrl(hotel, stop)}>Booking <Icon name="external" size={17} /></Button>
        <Button onClick={() => api.open({ kind: "hotel", id: hotel.id })}>פרטים</Button>
      </div>
    </Section>
  );
}

function Rooms({ api, stop }: { api: AppApi; stop: Stop }) {
  const { rooms, unassigned } = roomsOf(stop);
  const people = headcount(stop);
  return (
    <>
      <Tip id="rooms" title="מי ישן עם מי" arrow>
        מחלקים לחדרים ומסמנים מי בכלל מגיע לכאן. כפתור Booking מחפש לפי מספר האנשים והחדרים.
      </Tip>
      <Section title="חדרים"
        footer={stop.lodgingNote ? undefined : `Booking יחפש ${people} ${people === 1 ? "אדם" : "אנשים"} ב־${stop.rooms === 1 ? "חדר אחד" : `${stop.rooms} חדרים`}, ${dateSpan(stop)}.`}>
        {rooms.map((r, i) => (
          <Row key={i} leading={<Icon name="bed" className="text-label2" />}
            trailing={<span className="text-[17px]">{r.length ? names(r.map(personName)) : <span className="text-label3">ריק</span>}</span>}>
            חדר {i + 1}
          </Row>
        ))}
        {unassigned.length > 0 && (
          <Row leading={<Icon name="people" className="text-orange" />} trailing={<span className="text-[17px]">{names(unassigned.map(personName))}</span>}>
            <span className="text-orange">בלי חדר</span>
          </Row>
        )}
        <Row onClick={() => api.open({ kind: "rooms", stopId: stop.id })} chevron={false} tone="tint">
          עריכת חדרים ומי מגיע
        </Row>
      </Section>
    </>
  );
}

/** One hotel in a list, with our score on the trailing side so the column reads like a ranking. */
export function HotelLine({ api, stop, hotel }: { api: AppApi; stop: Stop; hotel: Hotel }) {
  const pp = perNight(hotel, stop);
  const there = getThere(hotel, stop);
  const s = scoreOf(hotel);
  // Separate pieces rather than one comma-joined string, so numbers don't reorder in right-to-left text.
  const meta = [
    pp != null ? `$${Math.round(pp)} לאדם ללילה` : null,
    there?.walk ? there.walk.split(" (")[0].replace("~", "") : there?.ride ? there.ride.split(" (")[0].replace("~", "") : null,
  ].filter(Boolean) as string[];
  return (
    <Row onClick={() => api.open({ kind: "hotel", id: hotel.id })}
      trailing={s != null ? (
        <span className="flex flex-col items-end leading-none tabular">
          <span className="text-[20px] font-semibold text-label">{s.toFixed(1)}</span>
          <span className="mt-1 text-[12px] text-label2">Booking {hotel.booking!.score.toFixed(1)}</span>
        </span>
      ) : undefined}>
      <bdi className="block text-right text-[17px] leading-[22px]">{hotel.name}</bdi>
      {meta.length > 0 && (
        <span className="mt-0.5 flex flex-wrap gap-x-3 text-[15px] text-label2 tabular">{meta.map((m) => <span key={m}>{m}</span>)}</span>
      )}
      {(hotel.needsResearch || hotel.addedBy !== undefined) && (
        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          {hotel.needsResearch && <ClaudeMark />}
          {hotel.addedBy !== undefined && <FriendMark by={hotel.addedBy} />}
        </span>
      )}
    </Row>
  );
}
