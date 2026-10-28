"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { personName } from "@/lib/seed";
import { researchQueue, TRIP_END, TRIP_START, todayISO } from "@/lib/trip";
import type { OpRequest, PersonId, TripState } from "@/lib/types";
import { CalendarTab } from "./CalendarTab";
import { ChangesTab } from "./ChangesTab";
import { DaySheet } from "./DaySheet";
import { HotelSheet } from "./HotelSheet";
import { MeSheet, Welcome } from "./Onboarding";
import { RouteTab } from "./RouteTab";
import { StopView } from "./StopView";
import { AddHotelSheet, AddMoveSheet, AddNoteSheet, AddStopSheet, EditStopSheet, RoomsSheet } from "./forms";
import { Icon } from "./ui";

export type Tab = "route" | "days" | "changes";
export type Modal =
  | { kind: "day"; date: string }
  | { kind: "hotel"; id: string }
  | { kind: "addHotel"; stopId: string }
  | { kind: "editStop"; stopId: string }
  | { kind: "rooms"; stopId: string }
  | { kind: "addStop" }
  | { kind: "addMove"; date: string }
  | { kind: "addNote"; date: string }
  | { kind: "me" }
  | null;

export type AppApi = {
  state: TripState;
  me: PersonId | null;
  today: string | null;
  run: (op: OpRequest) => Promise<boolean>;
  open: (m: Modal) => void;
  showStop: (id: string) => void;
  showDay: (date: string) => void;
  busy: boolean;
  meButton: React.ReactNode;
};

const ME_KEY = "trip.me";
const WELCOME_KEY = "trip.welcomed";

/* Per-phone settings live in localStorage; the server renders as if nothing is stored yet. */
const LOCAL_EVENT = "trip:local";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(LOCAL_EVENT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(LOCAL_EVENT, cb); };
};
const readLocal = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeLocal = (key: string, value: string | null) => {
  try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch {}
  window.dispatchEvent(new Event(LOCAL_EVENT));
};
const useLocal = (key: string, server: string | null = null) =>
  useSyncExternalStore(subscribe, () => readLocal(key), () => server);
const noop = () => () => {};

export function TripApp({ initial }: { initial: TripState }) {
  const [state, setState] = useState(initial);
  const [tab, setTab] = useState<Tab>("route");
  const [stopId, setStopId] = useState<string | null>(null);
  const [day, setDay] = useState(TRIP_START);
  const [modal, setModal] = useState<Modal>(null);
  const [, setStack] = useState<Modal[]>([]);
  const me = useLocal(ME_KEY) as PersonId | null;
  // "1" on the server so the welcome sheet never flashes before the phone's storage is read.
  const welcomed = useLocal(WELCOME_KEY, "1");
  const [replay, setReplay] = useState(false);
  const welcome = !welcomed || replay;
  const today = useSyncExternalStore(noop, todayISO, () => null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Open on today during the trip, or on a day from a #d24 link. Deferred so the first paint matches the server.
  useEffect(() => {
    queueMicrotask(() => {
      const t = todayISO();
      if (t >= TRIP_START && t <= TRIP_END) setDay(t);
      const m = /^#d(\d{1,2})$/.exec(location.hash);
      if (m) { setTab("days"); setDay(`2026-11-${m[1].padStart(2, "0")}`); }
    });
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
    const t = setTimeout(() => setToast(null), toast === "נשמר" ? 2000 : 5000); // errors stay long enough to read
    return () => clearTimeout(t);
  }, [toast]);

  const run = useCallback(async (op: OpRequest) => {
    setBusy(true);
    try {
      const res = await fetch("/api/ops", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ by: me, ...op }) });
      const body = await res.json();
      if (!res.ok) { setToast(body.error ?? "השינוי לא נשמר. נסו שוב."); return false; }
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

  // One sheet at a time: a form opened from a hotel or a day replaces it, and closing the form brings it back.
  const open = useCallback((m: Modal) => {
    setModal((cur) => {
      if (cur && m && (cur.kind === "day" || cur.kind === "hotel") && m.kind !== "day" && m.kind !== "hotel") setStack((s) => [...s, cur]);
      return m;
    });
  }, []);
  const close = useCallback(() => {
    setStack((s) => {
      setModal(s.at(-1) ?? null);
      return s.slice(0, -1);
    });
  }, []);

  const chooseMe = useCallback((id: PersonId | null) => writeLocal(ME_KEY, id), []);
  const finishWelcome = useCallback(() => { setReplay(false); writeLocal(WELCOME_KEY, "1"); }, []);

  const meButton = (
    <button type="button" onClick={() => setModal({ kind: "me" })} aria-label={me ? `אני ${personName(me)}. להחליף` : "מי אני?"}
      className="glass press-glass flex size-11 items-center justify-center rounded-full">
      {me ? (
        <span className="flex size-[34px] items-center justify-center rounded-full bg-[linear-gradient(#a1a1a6,#86868b)] text-[16px] font-semibold text-white">{personName(me).slice(0, 1)}</span>
      ) : <Icon name="person" size={21} weight={2.1} />}
    </button>
  );

  const api: AppApi = useMemo(() => ({
    state, me, run, open, busy, today, meButton,
    showStop: (id: string) => { setModal(null); setStack([]); setTab("route"); setStopId(id); window.scrollTo({ top: 0 }); },
    showDay: (date: string) => { setModal(null); setStack([]); setTab("days"); setDay(date); window.scrollTo({ top: 0 }); },
    // meButton is rebuilt each render; it only depends on `me`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state, me, run, open, busy, today]);

  const pending = useMemo(() => {
    const q = researchQueue(state);
    return q.stops.length + q.hotels.length + q.moves.length;
  }, [state]);

  const goTab = (id: Tab) => {
    if (id === tab && id === "route") setStopId(null);
    setTab(id);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] pb-[calc(env(safe-area-inset-bottom)+110px)]">
      {tab === "route" && !stopId && <RouteTab api={api} />}
      {tab === "route" && stopId && <StopView key={stopId} api={api} stopId={stopId} onBack={() => setStopId(null)} />}
      {tab === "days" && <CalendarTab api={api} day={day} onDay={setDay} />}
      {tab === "changes" && <ChangesTab api={api} />}

      <nav aria-label="ניווט ראשי" className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-40 mx-auto max-w-[480px] px-5">
        <div className="glass flex h-[64px] items-center rounded-full p-1">
          {([["route", "מסלול", "map"], ["days", "ימים", "calendar"], ["changes", "שינויים", "changes"]] as const).map(([id, label, icon]) => {
            const on = tab === id;
            return (
              <button key={id} type="button" onClick={() => goTab(id)} aria-current={on ? "page" : undefined}
                className={`relative flex h-full flex-1 flex-col items-center justify-center gap-[3px] rounded-full text-[10px] font-semibold transition-colors ${on ? "bg-[rgb(0_0_0/0.06)] text-tint" : "text-label"}`}>
                <Icon name={icon} size={25} weight={on ? 2.3 : 1.8} />
                {label}
                {id === "changes" && pending > 0 && (
                  <span className="absolute top-1 ms-8 min-w-[19px] rounded-full bg-[#ff3b30] px-1.5 text-[12px] font-semibold leading-[19px] text-white tabular"
                    aria-label={`${pending} מחכים לבדיקה של קלוד`}>{pending}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {modal?.kind === "day" && <DaySheet api={api} date={modal.date} onClose={close} onDate={(d) => setModal({ kind: "day", date: d })} />}
      {modal?.kind === "hotel" && <HotelSheet api={api} id={modal.id} onClose={close} />}
      {modal?.kind === "addHotel" && <AddHotelSheet api={api} stopId={modal.stopId} onClose={close} />}
      {modal?.kind === "editStop" && <EditStopSheet api={api} stopId={modal.stopId} onClose={close} />}
      {modal?.kind === "rooms" && <RoomsSheet api={api} stopId={modal.stopId} onClose={close} />}
      {modal?.kind === "addStop" && <AddStopSheet api={api} onClose={close} />}
      {modal?.kind === "addMove" && <AddMoveSheet api={api} date={modal.date} onClose={close} />}
      {modal?.kind === "addNote" && <AddNoteSheet api={api} date={modal.date} onClose={close} />}
      {modal?.kind === "me" && <MeSheet me={me} onChoose={chooseMe} onClose={() => setModal(null)} onReplay={() => { setModal(null); setReplay(true); }} />}
      {welcome && !modal && <Welcome me={me} onChoose={chooseMe} onDone={finishWelcome} />}

      {toast && (
        <div role="status" aria-live="polite" className="fade-enter pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+86px)] z-[60] flex justify-center">
          <span className="glass flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[15px] font-semibold">
            {toast === "נשמר"
              ? <Icon name="check" size={17} weight={2.6} className="text-green" />
              : <Icon name="info" size={18} weight={2.2} className="text-red" />}
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
