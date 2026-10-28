import { useState } from "react";
import { normalize, PRIOR_MEAN, typeLabel } from "@/lib/score";
import type { BookingFacts } from "@/lib/types";
import { bookingUrl, getThere, headcount, perNight, pickOf } from "@/lib/trip";
import type { AppApi } from "./TripApp";
import { BookedMark, Button, ClaudeMark, FriendMark, Icon, InfoStrip, Row, Section, Sheet } from "./ui";

const SUBS: [keyof BookingFacts["subs"], string][] = [
  ["location", "מיקום"], ["cleanliness", "ניקיון"], ["comfort", "נוחות"], ["staff", "צוות"], ["facilities", "מתקנים"], ["value", "תמורה"],
];
const signed = (d: number) => (d === 0 ? "0" : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(2)}`);

export function HotelSheet({ api, id, onClose }: { api: AppApi; id: string; onClose: () => void }) {
  const h = api.state.hotels.find((x) => x.id === id);
  const stop = h && api.state.stops.find((s) => s.id === h.stopId);
  const [confirm, setConfirm] = useState(false);
  if (!h || !stop) return null;
  const isPick = pickOf(api.state, stop)?.id === h.id;
  const n = h.booking ? normalize(h.booking) : null;
  const pp = perNight(h, stop);
  const there = getThere(h, stop);
  const mins = (s?: string) => s?.match(/~(\d+)/)?.[1];
  const kind = [typeLabel(h.booking?.type), h.booking?.stars ? `${h.booking.stars.n} ${h.booking.stars.kind === "stars" ? "כוכבים" : "כוכבים לפי Booking"}` : null].filter(Boolean).join(", ");

  const strip = [
    n && { label: "הציון שלנו", value: n.score.toFixed(1) },
    h.booking && { label: "Booking", value: h.booking.score.toFixed(1), sub: `${h.booking.reviews.toLocaleString("en-US")} ביקורות` },
    pp != null && { label: "לאדם ללילה", value: `$${Math.round(pp)}`, sub: `$${h.priceTotal} סה״כ` },
    there && { label: `עד ${stop.center?.name ?? "המרכז"}`, value: `${mins(there.walk ?? there.ride)} דק׳`, sub: there.walk ? "ברגל" : "במונית" },
  ].filter(Boolean) as { label: string; value: string; sub?: string }[];

  return (
    <Sheet onClose={onClose} title={stop.name}>
      <div className="px-1 pb-5 pt-1">
        <bdi className="block text-right text-[28px] font-bold leading-[34px] tracking-[-0.01em]">{h.name}</bdi>
        <div className="mt-1 text-[15px] text-label2">{kind || "עוד לא נבדק"}</div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {isPick && (stop.bookedId === h.id ? <BookedMark /> : <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-tint"><Icon name="star" size={14} weight={2.2} />ההמלצה ב{stop.name}</span>)}
          {h.needsResearch && <ClaudeMark />}
          {h.addedBy !== undefined && <FriendMark by={h.addedBy} />}
        </div>
      </div>

      <Section footer={`Booking נפתח עם התאריכים ועם ${headcount(stop)} אנשים ב־${stop.rooms === 1 ? "חדר אחד" : `${stop.rooms} חדרים`}, לפי החלוקה לחדרים.`}>
        {strip.length > 0 && <div className="px-1 pt-3"><InfoStrip items={strip} /></div>}
        <div className="flex gap-2.5 p-4">
          <Button kind="prominent" href={bookingUrl(h, stop)}>Booking <Icon name="external" size={17} /></Button>
          {!isPick && !stop.bookedId && (
            <Button onClick={async () => { if (await api.run({ op: "setPick", stopId: stop.id, hotelId: h.id })) onClose(); }}>בחירה כהמלצה</Button>
          )}
        </div>
      </Section>

      {h.needsResearch && (
        <Section>
          <Row leading={<Icon name="sparkle" size={22} className="text-orange" />}>
            <span className="text-[15px] leading-[20px]">
              קלוד עוד לא בדק את המלון. כשיבדוק, יוסיף ציון, מחיר, מרחקים, יתרונות וחסרונות. הסימון של מי ההצעה יישאר גם אחרי הבדיקה.
            </span>
          </Row>
        </Section>
      )}
      {h.note && <Section title="למה הוצע"><p className="px-4 py-3.5 text-[17px] leading-[24px]">{h.note}</p></Section>}

      {h.pros?.length ? (
        <Section title="מה טוב בו">
          {h.pros.map((p) => (
            <Row key={p} leading={<Icon name="check" size={20} weight={2.4} className="text-green" />}><span className="text-[17px] leading-[22px]">{p}</span></Row>
          ))}
        </Section>
      ) : null}
      {!isPick && h.cons && (
        <Section title="למה הוא לא ההמלצה"><p className="px-4 py-3.5 text-[17px] leading-[24px]">{h.cons}</p></Section>
      )}

      {(h.room || h.facilities?.length || there || h.shop || (stop.country === "th" && stop.rides)) && (
        <Section title="פרטים">
          {h.room && <Row leading={<Icon name="bed" className="text-label2" />}><Fact label="חדרים" value={h.room} /></Row>}
          {h.facilities?.length ? <Row leading={<Icon name="star" className="text-label2" />}><Fact label="במלון" value={h.facilities.join(", ")} /></Row> : null}
          {there?.walk && <Row leading={<Icon name="walk" className="text-label2" />}><Fact label={`עד ${stop.center?.name}`} value={there.walk} /></Row>}
          {there?.ride && <Row leading={<Icon name="car" className="text-label2" />}><Fact label={there.walk ? "במונית" : `עד ${stop.center?.name}`} value={there.ride} /></Row>}
          {stop.country === "th" && <Row leading={<Icon name="cart" className="text-label2" />}><Fact label="מינימרקט" value={h.shop ?? "עוד לא נבדק"} /></Row>}
          {stop.country === "th" && stop.rides && <Row leading={<Icon name="car" className="text-label2" />}><Fact label="Grab ו־Bolt" value={stop.rides} /></Row>}
        </Section>
      )}

      {n && h.booking && (
        <>
          <Section title="איך מחושב הציון"
            footer={`נקודת המוצא: ממוצע בין הדירוג ב־Booking ל־${PRIOR_MEAN}, לפי כמות הביקורות. מלון עם מעט ביקורות נמשך יותר ל־${PRIOR_MEAN}.`}>
            <Row trailing={<span className="ltr tabular text-label">{n.bayes.toFixed(2)}</span>}>נקודת מוצא</Row>
            {n.lines.map((l) => (
              <Row key={l.label} trailing={<span className={`ltr tabular ${l.delta > 0 ? "text-green" : l.delta < 0 ? "text-orange" : ""}`}>{signed(l.delta)}</span>}>
                <span className="text-[17px]">{l.label}</span>
              </Row>
            ))}
            <Row trailing={<span className="ltr text-[17px] font-bold tabular text-label">{n.score.toFixed(1)}</span>}><span className="font-semibold">הציון שלנו</span></Row>
          </Section>
          <Section title="ציונים ב־Booking">
            <div className="grid grid-cols-3 gap-y-4 px-2 py-4 text-center">
              {SUBS.filter(([k]) => h.booking!.subs[k] != null).map(([k, label]) => (
                <div key={k}>
                  <div className="text-[20px] font-semibold tabular">{h.booking!.subs[k]}</div>
                  <div className="text-[13px] text-label2">{label}</div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      <Section>
        {!confirm ? (
          <Row onClick={() => setConfirm(true)} chevron={false} tone="red">הסרה מהרשימה</Row>
        ) : (
          <div className="p-4 text-center">
            <p className="text-[15px] leading-[20px]">להסיר את <bdi>{h.name}</bdi> מהרשימה של {stop.name}? כולם יראו שהוסר.</p>
            <div className="mt-3 flex gap-2.5">
              <Button onClick={() => setConfirm(false)}>ביטול</Button>
              <Button kind="red" onClick={async () => { if (await api.run({ op: "hideHotel", hotelId: h.id })) onClose(); }}>הסרה</Button>
            </div>
          </div>
        )}
      </Section>
    </Sheet>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span className="block">
      <span className="block text-[13px] text-label2">{label}</span>
      <span className="block text-[17px] leading-[22px]">{value}</span>
    </span>
  );
}
