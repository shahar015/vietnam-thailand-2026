import { useState } from "react";
import { normalize, PRIOR_MEAN, typeLabel } from "@/lib/score";
import { bookingUrl, getThere, perNight, pickOf } from "@/lib/trip";
import type { AppApi } from "./TripApp";
import { FriendBadge, Icon, PrimaryButton, ResearchBadge, SecondaryButton, Section, Sheet, TextButton } from "./ui";

const SUBS: [keyof NonNullable<import("@/lib/types").BookingFacts["subs"]>, string][] = [
  ["location", "מיקום"], ["cleanliness", "ניקיון"], ["comfort", "נוחות"], ["staff", "צוות"], ["facilities", "מתקנים"], ["value", "תמורה"],
];

export function HotelSheet({ api, id, onClose }: { api: AppApi; id: string; onClose: () => void }) {
  const h = api.state.hotels.find((x) => x.id === id);
  const stop = h && api.state.stops.find((s) => s.id === h.stopId);
  const [confirm, setConfirm] = useState(false);
  if (!h || !stop) return null;
  const pick = pickOf(api.state, stop);
  const isPick = pick?.id === h.id;
  const n = h.booking ? normalize(h.booking) : null;
  const pp = perNight(h, stop);
  const there = getThere(h, stop);

  return (
    <Sheet open onClose={onClose} tall title={stop.name} leading={<TextButton onClick={onClose}>סגירה</TextButton>}>
      <div className="pb-2 pt-3">
        <h2 className="text-[24px] font-bold leading-tight" dir="ltr" style={{ textAlign: "right" }}>{h.name}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {isPick && <span className="rounded-full bg-label px-2 py-0.5 text-[12px] font-semibold text-bg">{stop.bookedId === h.id ? "הוזמן" : "ההמלצה"}</span>}
          {h.needsResearch && <ResearchBadge />}
          {h.addedBy !== undefined && <FriendBadge by={h.addedBy} />}
        </div>
      </div>

      {h.needsResearch && (
        <p className="mb-5 rounded-[12px] bg-warn-fill px-4 py-3 text-[15px] leading-snug text-label">
          עוד לא בדקתי את המלון הזה. כשאבדוק, אוסיף ציון, מחיר, מרחקים, יתרונות וחסרונות. הסימון שזו הצעה שלכם יישאר גם אחרי הבדיקה.
        </p>
      )}
      {h.note && <Section title="הערה"><p className="px-4 py-3 text-[15px]">{h.note}</p></Section>}

      {n && h.booking && (
        <Section title="ציון" footer={`נקודת המוצא: ממוצע של הדירוג ב־Booking ושל ${PRIOR_MEAN}, לפי כמות הביקורות. מלון עם מעט ביקורות נמשך יותר ל־${PRIOR_MEAN}.`}>
          <div className="flex items-center justify-around px-4 py-4 text-center">
            <div>
              <div className="font-rounded text-[40px] font-bold leading-none tabular">{n.score.toFixed(1)}</div>
              <div className="mt-1 text-[13px] text-label2">הציון שלנו</div>
            </div>
            <div className="h-10 w-px bg-sep" />
            <div>
              <div className="font-rounded text-[28px] font-semibold leading-none text-label2 tabular">{h.booking.score.toFixed(1)}</div>
              <div className="mt-1 text-[13px] text-label2">Booking · {h.booking.reviews.toLocaleString("en-US")} ביקורות</div>
            </div>
          </div>
          <div className="border-t border-sep px-4 py-3 text-[15px] tabular">
            <Line label="נקודת מוצא (לפי כמות ביקורות)" value={n.bayes.toFixed(2)} />
            {n.lines.map((l) => <Line key={l.label} label={l.label} value={l.delta === 0 ? "0" : `${l.delta > 0 ? "+" : "−"}${Math.abs(l.delta).toFixed(2)}`} tone={l.delta > 0 ? "up" : l.delta < 0 ? "down" : undefined} />)}
          </div>
          <div className="grid grid-cols-3 gap-y-3 border-t border-sep px-4 py-3 text-center">
            {SUBS.filter(([k]) => h.booking!.subs[k] != null).map(([k, label]) => (
              <div key={k}>
                <div className="text-[17px] font-semibold tabular">{h.booking!.subs[k]}</div>
                <div className="text-[12px] text-label2">{label}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="פרטים">
        <Fact icon="bed" label="סוג" value={[typeLabel(h.booking?.type), h.booking?.stars ? `${h.booking.stars.n} כוכבים` : null].filter(Boolean).join(" · ") || "לא נבדק"} />
        {h.priceTotal != null && <Fact icon="info" label="מחיר" value={`$${h.priceTotal} לכל השהות${pp ? ` · $${Math.round(pp)} לאדם ללילה` : ""}`} />}
        {h.room && <Fact icon="bed" label="חדרים" value={h.room} />}
        {there?.walk && <Fact icon="walk" label={`ל${stop.center?.name}`} value={there.walk} />}
        {there?.ride && <Fact icon="car" label={there.walk ? "במונית" : `ל${stop.center?.name}`} value={there.ride} />}
        {stop.country === "th" && <Fact icon="info" label="מינימרקט" value={h.shop ?? "לא נבדק"} />}
        {stop.country === "th" && stop.rides && <Fact icon="car" label="Grab ו־Bolt" value={stop.rides} />}
        {h.facilities?.length ? <Fact icon="star" label="מתקנים" value={h.facilities.join(" · ")} /> : null}
      </Section>

      {h.pros?.length ? (
        <Section title={isPick ? "למה הוא" : "מה טוב בו"}>
          <ul className="px-4 py-2">
            {h.pros.map((p) => (
              <li key={p} className="flex gap-2.5 border-b border-sep py-2 text-[15px] last:border-b-0">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-ok" />{p}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {!isPick && h.cons && (
        <Section title="למה הוא לא ההמלצה"><p className="px-4 py-3 text-[15px] leading-relaxed">{h.cons}</p></Section>
      )}

      <div className="mt-2 flex flex-col gap-2.5">
        <PrimaryButton href={bookingUrl(h, stop)}>פתיחה ב־Booking <Icon name="external" size={18} /></PrimaryButton>
        {!isPick && !stop.bookedId && (
          <SecondaryButton onClick={async () => { if (await api.run({ op: "setPick", stopId: stop.id, hotelId: h.id })) onClose(); }}>
            בחירה כהמלצה
          </SecondaryButton>
        )}
        {!confirm ? (
          <TextButton danger onClick={() => setConfirm(true)}>הסרה מהרשימה</TextButton>
        ) : (
          <div className="rounded-[12px] bg-cell p-4 text-center">
            <p className="text-[15px]">להסיר את {h.name} מהרשימה של {stop.name}?</p>
            <div className="mt-2 flex justify-center gap-6">
              <TextButton onClick={() => setConfirm(false)}>ביטול</TextButton>
              <TextButton danger strong onClick={async () => { if (await api.run({ op: "hideHotel", hotelId: h.id })) onClose(); }}>הסרה</TextButton>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function Line({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-label2">{label}</span>
      <span className={`ltr font-medium ${tone === "up" ? "text-ok" : tone === "down" ? "text-warn" : ""}`}>{value}</span>
    </div>
  );
}
function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-sep px-4 py-2.5 last:border-b-0">
      <Icon name={icon} size={19} className="mt-0.5 shrink-0 text-label3" />
      <div className="min-w-0">
        <div className="text-[13px] text-label2">{label}</div>
        <div className="text-[15px] leading-snug">{value}</div>
      </div>
    </div>
  );
}
