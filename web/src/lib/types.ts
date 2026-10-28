export type PersonId = "shahar" | "adi" | "roni" | "yahel" | "ofir" | "lauren" | "shir";
export type Country = "vn" | "th";

/** Booking's category scores, 0–10. */
export type Subscores = {
  location?: number;
  cleanliness?: number;
  value?: number;
  facilities?: number;
  comfort?: number;
  staff?: number;
};

export type BookingFacts = {
  score: number;
  reviews: number;
  /** Official stars ("stars") or Booking's own estimate ("squares"). */
  stars?: { n: number; kind: "stars" | "squares" };
  photos?: number;
  type?: string;
  subs: Subscores;
};

export type Hotel = {
  id: string;
  stopId: string;
  name: string;
  /** Booking path such as "vn/new-day-sapa-sa-pa3". */
  slug?: string;
  url?: string;
  ll?: [number, number];
  booking?: BookingFacts;
  /** Total for the whole stay and group, USD. */
  priceTotal?: number;
  room?: string;
  facilities?: string[];
  pros?: string[];
  cons?: string;
  shop?: string;
  note?: string;
  /** Who suggested it, when a friend added it. */
  addedBy?: PersonId | null;
  needsResearch?: boolean;
  researchedAt?: string;
  hidden?: boolean;
};

export type Stop = {
  id: string;
  name: string;
  country: Country;
  /** ISO dates, check-in and check-out. */
  from: string;
  to: string;
  people: PersonId[];
  /** Headcount the prices were researched for. Booking searches use `people.length`. */
  adults: number;
  rooms: number;
  /** Who sleeps in which room, 1-based. People missing here aren't assigned yet. */
  roomOf?: Partial<Record<PersonId, number>>;
  center?: { name: string; ll: [number, number] };
  area?: string;
  why?: string;
  rides?: string;
  pickId?: string;
  bookedId?: string;
  /** No hotel needed (e.g. the loop's homestays). */
  lodgingNote?: string;
  addedBy?: PersonId | null;
  needsResearch?: boolean;
  hidden?: boolean;
};

export type MoveKind = "flight" | "bus" | "boat" | "car" | "event" | "walk";

export type Move = {
  id: string;
  date: string;
  time?: string;
  kind: MoveKind;
  title: string;
  detail?: string;
  alt?: string;
  price?: string;
  link?: string;
  status: "booked" | "todo" | "info";
  addedBy?: PersonId | null;
  needsResearch?: boolean;
  hidden?: boolean;
};

export type LogEntry = {
  id: string;
  at: string;
  by?: PersonId | null;
  /** Written by Claude's research, not by one of us. */
  claude?: boolean;
  text: string;
  target?: { kind: "stop" | "hotel" | "move" | "note"; id: string };
};

export type TripState = {
  rev: number;
  stops: Stop[];
  hotels: Hotel[];
  moves: Move[];
  notes: Record<string, string[]>;
  log: LogEntry[];
};

export type Op =
  | { op: "setPick"; stopId: string; hotelId: string }
  | { op: "addHotel"; stopId: string; name: string; url?: string; note?: string; ll?: [number, number]; makePick?: boolean }
  | { op: "editHotel"; hotelId: string; name?: string; url?: string; note?: string }
  | { op: "hideHotel"; hotelId: string }
  | { op: "editStop"; stopId: string; from?: string; to?: string; name?: string }
  | { op: "setRooms"; stopId: string; people: PersonId[]; rooms: number; roomOf: Partial<Record<PersonId, number>> }
  | { op: "addStop"; name: string; country: Country; from: string; to: string; people: PersonId[] }
  | { op: "hideStop"; stopId: string }
  | { op: "addMove"; date: string; time?: string; kind: MoveKind; title: string; detail?: string }
  | { op: "editMove"; moveId: string; date?: string; time?: string; title?: string; detail?: string }
  | { op: "hideMove"; moveId: string }
  | { op: "addNote"; date: string; text: string }
  // Research updates, token-protected.
  | { op: "upsert"; collection: "stops" | "hotels" | "moves"; item: Stop | Hotel | Move; text?: string };

export type OpRequest = Op & { by?: PersonId | null };
