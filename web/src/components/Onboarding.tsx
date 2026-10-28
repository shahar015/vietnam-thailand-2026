import { useState } from "react";
import { PEOPLE } from "@/lib/seed";
import type { PersonId } from "@/lib/types";
import { Button, Icon, Row, Section, Sheet, resetTips } from "./ui";

const FEATURES: { icon: string; color: string; title: string; text: string }[] = [
  { icon: "map", color: "var(--tint)", title: "המסלול והמלונות", text: "הקישו על עצירה כדי לראות את ההמלצה, החלופות ולמה בחרנו." },
  { icon: "calendar", color: "#e5484d", title: "כל יום בנפרד", text: "בלשונית ימים, הקישו על תאריך: מי בטיול, טיסות ונסיעות, ואיפה ישנים." },
  { icon: "bed", color: "var(--green)", title: "מי ישן עם מי", text: "מחלקים לחדרים בכל עצירה, וכפתור Booking מחפש בדיוק לפי החלוקה." },
  { icon: "sparkle", color: "var(--purple)", title: "מציעים ומשנים", text: "כל אחד יכול להוסיף מלון או לשנות תאריכים. קלוד בודק כל הצעה, והשם שלכם נשאר עליה." },
];

/** First launch only: what the app does, then who you are. Both steps can be skipped. */
export function Welcome({ me, onChoose, onDone }: { me: PersonId | null; onChoose: (p: PersonId | null) => void; onDone: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  return (
    <Sheet onClose={onDone} title={step === 2 ? "מי את/ה?" : undefined}>
      {step === 1 ? (
        <div className="flex min-h-full flex-col">
          <div className="px-4 pb-8 pt-6 text-center">
            <h2 className="text-[34px] font-bold leading-[41px] tracking-[-0.02em]">הטיול שלנו</h2>
            <p className="mt-1 text-[17px] text-label2">וייטנאם ותאילנד, 2 עד 30 בנובמבר</p>
          </div>
          <ul className="flex flex-col gap-6 px-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="mt-0.5" style={{ color: f.color }}><Icon name={f.icon} size={34} weight={1.8} /></span>
                <span>
                  <span className="block text-[17px] font-semibold">{f.title}</span>
                  <span className="block text-[15px] leading-[20px] text-label2">{f.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex pt-10">
            <Button kind="prominent" onClick={() => setStep(2)}>המשך</Button>
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <p className="mb-5 px-4 text-[15px] leading-[20px] text-label2">השם יופיע ליד כל שינוי שתעשו, כדי שכולם ידעו של מי ההצעה. אפשר גם בלי.</p>
          <PeopleList me={me} onChoose={onChoose} />
          <div className="flex pt-2">
            <Button kind="prominent" onClick={onDone}>סיום</Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function PeopleList({ me, onChoose }: { me: PersonId | null; onChoose: (p: PersonId | null) => void }) {
  return (
    <Section>
      {PEOPLE.map((p) => (
        <Row key={p.id} onClick={() => onChoose(p.id)} chevron={false}
          trailing={me === p.id ? <Icon name="check" size={20} weight={2.6} className="text-tint" /> : undefined}>
          {p.name}
        </Row>
      ))}
      <Row onClick={() => onChoose(null)} chevron={false}
        trailing={!me ? <Icon name="check" size={20} weight={2.6} className="text-tint" /> : undefined}>
        <span className="text-label2">בלי שם</span>
      </Row>
    </Section>
  );
}

export function MeSheet({ me, onChoose, onClose, onReplay }: {
  me: PersonId | null; onChoose: (p: PersonId | null) => void; onClose: () => void; onReplay: () => void;
}) {
  return (
    <Sheet onClose={onClose} title="מי אני?" height="fit">
      <p className="mb-5 px-4 pt-1 text-[15px] leading-[20px] text-label2">השם יופיע ליד כל שינוי שתעשו. הבחירה נשמרת רק בטלפון הזה.</p>
      <PeopleList me={me} onChoose={(p) => { onChoose(p); onClose(); }} />
      <Section>
        <Row onClick={() => { resetTips(); onReplay(); }} chevron={false} tone="tint">להציג שוב את ההסברים</Row>
      </Section>
    </Sheet>
  );
}
