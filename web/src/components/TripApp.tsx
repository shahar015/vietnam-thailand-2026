"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PEOPLE, personName } from "@/lib/seed";
import { researchQueue } from "@/lib/trip";
import type { OpRequest, PersonId, TripState } from "@/lib/types";
import { ChangesTab } from "./ChangesTab";
import { DaySheet } from "./DaySheet";
import { HotelSheet } from "./HotelSheet";
import { NightsTab } from "./NightsTab";
import { RouteTab } from "./RouteTab";
import { StopView } from "./StopView";
import { AddHotelSheet, AddMoveSheet, AddNoteSheet, AddStopSheet, EditStopSheet } from "./forms";
import { Icon, Sheet, TextButton } from "./ui";

export type Tab = "route" | "nights" | "changes";
export type Modal =
  | { kind: "day"; date: string }
  | { kind: "hotel"; id: string }
  | { kind: "addHotel"; stopId: string }
  | { kind: "editStop"; stopId: string }
  | { kind: "addStop" }
  | { kind: "addMove"; date: string }
  | { kind: "addNote"; date: string }
  | { kind: "me" }
  | null;

export type AppApi = {
  state: TripState;
  me: PersonId | null;
  run: (op: OpRequest) => Promise<boolean>;
  open: (m: Modal) => void;
  showStop: (id: string) => void;
  busy: boolean;
};

const ME_KEY = "trip.me";

export function TripApp({ initial }: { initial: TripState }) {
  const [state, setState] = useState(initial);
  const [tab, setTab] = useState<Tab>("route");
  const [stopId, setStopId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [stack, setStack] = useState<Modal[]>([]);
  const [me, setMe] = useState<PersonId | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try { setMe((localStorage.getItem(ME_KEY) as PersonId) || null); } catch {}
    const m = /^#d(\d{1,2})$/.exec(location.hash);
    if (m) setModal({ kind: "day", date: `2026-11-${m[1].padStart(2, "0")}` });
  }, []);

  // Pick up friends' changes when the app comes back to the foreground.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/state", { cache: "no-store" }).then((r) => r.ok && r.json()).then((s) => s && setState((cur) => (s.rev >= cur.rev ? s : cur))).catch(() => {});
    };
    document.addEventListener("visibilitychange", refresh);
    const t = setInterval(refresh, 45000);
    return () => { document.removeEventListener("visibilitychange", refresh); clearInterval(t); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const run = useCallback(async (op: OpRequest) => {
    setBusy(true);
    try {
      const res = await fetch("/api/ops", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ by: me, ...op }) });
      const body = await res.json();
      if (!res.ok) { setToast(body.error ?? "השמירה נכשלה"); return false; }
      setState(body);
      setToast("נשמר");
      return true;
    } catch {
      setToast("אין חיבור. השינוי לא נשמר.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [me]);

  // Sheets stack one level: opening a form from a day closes the day, and closing the form brings it back.
  const open = useCallback((m: Modal) => {
    setModal((cur) => {
      if (cur && m && (cur.kind === "day" || cur.kind === "hotel") && m.kind !== "day" && m.kind !== "hotel") setStack((s) => [...s, cur]);
      return m;
    });
  }, []);
  const close = useCallback(() => {
    setStack((s) => {
      const prev = s.at(-1) ?? null;
      setModal(prev);
      return s.slice(0, -1);
    });
    if (location.hash) history.replaceState(null, "", location.pathname);
  }, []);

  const api: AppApi = useMemo(() => ({
    state, me, run, open, busy,
    showStop: (id: string) => { setModal(null); setStack([]); setTab("route"); setStopId(id); window.scrollTo({ top: 0 }); },
  }), [state, me, run, open, busy]);

  const pending = useMemo(() => {
    const q = researchQueue(state);
    return q.stops.length + q.hotels.length + q.moves.length;
  }, [state]);

  const chooseMe = (id: PersonId | null) => {
    setMe(id);
    try { id ? localStorage.setItem(ME_KEY, id) : localStorage.removeItem(ME_KEY); } catch {}
    setModal(null);
  };

  const meButton = (
    <button type="button" onClick={() => setModal({ kind: "me" })} aria-label={me ? `אני ${personName(me)}. החלפה` : "מי אני?"}
      className="flex size-11 items-center justify-center">
      <span className={`flex size-9 items-center justify-center rounded-full text-[15px] font-semibold ${me ? "bg-accent text-white dark:text-black" : "bg-fill text-label2"}`}>
        {me ? personName(me).slice(0, 1) : <Icon name="person" size={18} />}
      </span>
    </button>
  );

  return (
    <div className="mx-auto min-h-dvh max-w-xl pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[env(safe-area-inset-top)]">
      {tab === "route" && !stopId && <RouteTab api={api} meButton={meButton} />}
      {tab === "route" && stopId && <StopView api={api} stopId={stopId} onBack={() => setStopId(null)} meButton={meButton} />}
      {tab === "nights" && <NightsTab api={api} meButton={meButton} />}
      {tab === "changes" && <ChangesTab api={api} meButton={meButton} />}

      <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-sep pb-[env(safe-area-inset-bottom)]" aria-label="ניווט ראשי">
        <div className="mx-auto grid max-w-xl grid-cols-3">
          {([["route", "מסלול", "route"], ["nights", "לילות", "moon"], ["changes", "שינויים", "changes"]] as const).map(([id, label, icon]) => (
            <button key={id} type="button" onClick={() => { setTab(id); if (id === "route") setStopId(null); window.scrollTo({ top: 0 }); }}
              aria-current={tab === id ? "page" : undefined}
              className={`relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${tab === id ? "text-accent" : "text-label3"}`}>
              <Icon name={icon} size={25} />
              {label}
              {id === "changes" && pending > 0 && (
                <span className="absolute top-1.5 ms-7 min-w-[18px] rounded-full bg-[#ff3b30] px-1 text-[11px] font-semibold leading-[18px] text-white" aria-label={`${pending} ממתינים לבדיקה`}>{pending}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {modal?.kind === "day" && <DaySheet api={api} date={modal.date} onClose={close} onDate={(d) => setModal({ kind: "day", date: d })} />}
      {modal?.kind === "hotel" && <HotelSheet api={api} id={modal.id} onClose={close} />}
      {modal?.kind === "addHotel" && <AddHotelSheet api={api} stopId={modal.stopId} onClose={close} />}
      {modal?.kind === "editStop" && <EditStopSheet api={api} stopId={modal.stopId} onClose={close} />}
      {modal?.kind === "addStop" && <AddStopSheet api={api} onClose={close} />}
      {modal?.kind === "addMove" && <AddMoveSheet api={api} date={modal.date} onClose={close} />}
      {modal?.kind === "addNote" && <AddNoteSheet api={api} date={modal.date} onClose={close} />}
      <Sheet open={modal?.kind === "me"} onClose={() => setModal(null)} title="מי אני?" leading={<TextButton onClick={() => setModal(null)}>סגירה</TextButton>}>
        <p className="mb-3 mt-1 text-[15px] text-label2">השם מופיע ליד כל שינוי שתעשו. אפשר גם בלי.</p>
        <div className="overflow-hidden rounded-[14px] bg-cell">
          {PEOPLE.map((p) => (
            <button key={p.id} type="button" onClick={() => chooseMe(p.id)} className="press flex min-h-11 w-full items-center justify-between border-b border-sep px-4 py-3 text-start last:border-b-0">
              <span>{p.name}</span>
              {me === p.id && <Icon name="check" size={20} className="text-accent" />}
            </button>
          ))}
          <button type="button" onClick={() => chooseMe(null)} className="press flex min-h-11 w-full items-center justify-between px-4 py-3 text-start text-label2">
            <span>בלי שם</span>
            {!me && <Icon name="check" size={20} className="text-accent" />}
          </button>
        </div>
      </Sheet>

      {toast && (
        <div role="status" className="fade-enter pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-[60] flex justify-center">
          <span className="rounded-full bg-label px-4 py-2 text-[15px] font-medium text-bg shadow-lg">{toast}</span>
        </div>
      )}
    </div>
  );
}
