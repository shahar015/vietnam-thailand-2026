# Vietnam + Thailand, November 2026

A shared trip planner for seven friends. Shahar (the owner) chats in English; everything the group sees is **Hebrew, right to left, phone-first**.

- Live app: https://vietnam-thailand-2026.vercel.app
- Repo: github.com/shahar015/vietnam-thailand-2026, branch `main`. Every push to `main` deploys to production.
- The old GitHub Pages site (`docs/index.html`) only redirects to the app. Don't run `build-site.sh`; it would overwrite the redirect with the retired single-file page (`trip-plan.html`).

## The trip

- People: שחר `shahar`, עדי `adi`, רוני `roni`, יהל `yahel`, אופיר `ofir` (a woman), לורן `lauren` (Ofir's friend), שיר `shir`.
- Vietnam 2–16 Nov, six of them (everyone except Shir): Hanoi 2–3 (booked: Hanoi Golden Lotus), Sapa 3–6, Ha Giang 6–7, the loop 7–9, Hoi An 9–13, Hanoi 13–16. Roni, Yahel, Ofir and Lauren stay in Vietnam after the 16th.
- Thailand: Shahar + Adi in Chiang Mai 16–19; Shir joins on Koh Samui 19–23; Phangan 23–26 (Full Moon Party the night of Tue 24→25); Koh Tao 26–28; Shahar + Adi alone in Bangkok 28–30, flying home on the 30th.
- International flights are booked. Domestic flights, buses and ferries are in the app as moves with prices and links.
- Hotel taste: a real hotel feel, not hostels; good location; mid-range, not Amari, Kalima or Marriott level. On Samui: near Ark Bar but quieter. They disliked vegan-only "Away Chiang Mai".

## How it works

Next.js 16 (App Router, `cacheComponents: true`), React 19, Tailwind v4, TypeScript, pnpm. The app lives in `web/`; the Vercel project (`vietnam-thailand-2026`, scope `shahar015s-projects`, root directory `web`, region `sin1`) is linked at the repo root.

- **State** is one JSON document, `trip/state.json`, in the private Vercel Blob store `trip-state`. `web/src/lib/seed.ts` is only the starting state: **editing it does not change the live app** once the Blob exists. Change live data through the API.
- **Writes** are ops: `POST /api/ops` → `lib/ops.ts` `applyOp` (pure) → `lib/store.ts` `commit`, which retries on an ETag conflict. `GET /api/state` reads. Clients refresh every 45 s and when the app is reopened.
- **Friends' edits** stamp `addedBy` (a person, or `null` for no name) and set `needsResearch: true`. Those items appear in the Changes tab under "לבדיקה של קלוד".
- **Research** uses the admin op `upsert` (replace or insert a whole stop, hotel or move), allowed only with the header `x-research-token` = env `RESEARCH_TOKEN`. The value is in Vercel and in the git-ignored repo-root `.env.local`. Never print it or put it in the repo.
- Without `BLOB_READ_WRITE_TOKEN` (local dev), state is kept in memory, and the page and the API routes hold separate copies, so a change made through the API doesn't show on a page reload. Only a local quirk.

Key files: `lib/types.ts` (data model and ops), `lib/score.ts` (our score), `lib/trip.ts` (dates, rooms, prices, Booking links, map legs), `components/` (screens; `ui.tsx` holds the shared iOS building blocks), `lib/geo.json` (Natural Earth 1:50m coastlines for the map).

### Data rules worth knowing

- `Stop.people` = who comes; `Stop.rooms` and `Stop.roomOf` = who sleeps where. Booking links search `people.length` adults in `rooms` rooms.
- `Stop.adults` = the headcount the prices were researched for. Per-person price is `priceTotal / nights / adults`. After re-researching prices for a new group, set `adults = people.length`.
- `Hotel.priceTotal` is USD for the whole stay, for that stop's group and room count.
- `Stop.bookedId` = the hotel we actually booked (op `setBooked`, or `addHotel` with `booked: true`); it wins over `pickId` everywhere. A booked hotel a friend added still waits for Claude, who should fill in its details but never change the booking.
- Never delete; set `hidden: true`. Keep `addedBy` forever: the purple "הצעה של X" mark must stay after research.
- Pick rule: the highest normalized score wins, unless another hotel is within 0.25 of it and costs 60% or less. Then the cheaper one wins on value. `Stop.why` explains the pick in Hebrew. A friend can set a pick themselves; respect it unless asked.

## Research runbook (checking friends' suggestions)

1. `node web/scripts/trip.mjs queue` lists everything waiting, with the stop's dates, group and existing hotels.
2. For each **hotel**, get Booking facts from the hotel's Booking page:
   - rating and review count
   - stars, official or Booking's own "squares"
   - photo count
   - property type
   - the six subscores in page order: location, cleanliness, value, facilities, comfort, staff
   - coordinates
   - price for the stop's dates, headcount and room count

   Plain `curl` and server-side fetches of Booking are usually blocked. A real browser works: inside a booking.com tab, a same-origin `fetch` plus `DOMParser` can read the LD+JSON `aggregateRating`, `[data-testid="rating-stars"|"rating-squares"]` `aria-label`, `hotelPhotos` ids, `PropertyType`, `[data-testid="review-subscore"]` and `data-atlas-latlng`. If Booking can't be reached, use other sources, say so in `note`, and leave `needsResearch: true`.
3. Fill the hotel and upsert it:
   - `booking` (a `BookingFacts`), `slug` (`cc/name` from the Booking URL), `ll`, `priceTotal`
   - `room`, `facilities`, `pros` (2–3 short Hebrew points), `cons` (one Hebrew sentence: why it isn't the pick)
   - `shop`: nearest 7-Eleven or minimarket, Thailand only
   - set `needsResearch: false` and `researchedAt` (ISO date); keep `addedBy`

   Run `node web/scripts/trip.mjs upsert hotels hotel.json "קלוד בדק את X: ציון Y, $Z לאדם ללילה"`. The log shows it as Claude.
4. For a **stop** flagged after a change of dates, people or rooms: recheck prices and availability of its hotels for the new dates and group. Upsert each hotel, re-pick by the rule, and update `why`. Then upsert the stop with `adults = people.length` and `needsResearch: false`.
5. For a **move**: check times, prices and a booking link, fill `time`, `price`, `link`, `status`, set `needsResearch: false`, upsert.
6. Write log texts and every user-facing string in Hebrew. Refer to the researcher as קלוד ("קלוד בדק…"), never "אני".

## Design rules (the owner is strict about these)

The owner rejected the first design as "AI slop". The current one follows the apple-design, frontend-design and ui-ux-pro-max skills; use them for any UI change.

- Light appearance only (the group asked for it). iOS 26 idiom:
  - a floating glass tab bar (מסלול, ימים, שינויים)
  - round glass nav buttons and large titles that collapse into the bar
  - inset grouped lists with 22px radius
  - sheets with a grabber, a round ✕ (cancel) and a tinted ✓ (save)
  - Apple Maps style info strips on hotel cards
- Colors: Apple's increased-contrast system colors, one meaning each. Blue `#0066cc` acts, green `#248a3d` is booked, orange `#c93400` waits for Claude, purple `#8944ab` is a friend's suggestion. Glass only on the functional layer (bars, sheets, buttons), never on content.
- The one loud element is the route map. The moon appears only in the calendar and the day view.
- No pills or badges for status: an icon plus words. No middle-dot meta strings; separate pieces with spacing instead (comma-joined numbers also reorder in right-to-left text). English hotel names go in `<bdi className="block text-right">`.
- Right-to-left gotchas:
  - An absolutely positioned element with no explicit side anchors to the right; give it `left-0`/`top-0`.
  - Forward chevrons point left.
  - Switches show "on" with the knob on the left, as iOS does in Hebrew.
- First-launch welcome and one-time tips (`Tip` in `ui.tsx`, dismissed ids in localStorage `trip.tips`; "מי אני?" → "להציג שוב את ההסברים" resets them).

## Working on the code

```bash
pnpm --dir web install
pnpm --dir web build
pnpm --dir web start -p 3100
```

- Check `npx tsc --noEmit` and `npx eslint src` in `web/`. Verify UI at 390×844 in a browser before pushing.
- Anything with gestures (dragging people between rooms, sheet swipe-to-dismiss) must be tested with **touch** input, not a mouse: a Playwright context with `hasTouch: true, isMobile: true` and CDP `Input.dispatchTouchEvent`. A mouse test once passed while real phones scrolled and cancelled the drag. Custom CSS classes go in a layer (`@layer base`/`components`): unlayered rules beat every Tailwind utility. That broke the grips' `touch-none` and the last row's `border-b-0`.
- Saving: Blob `get()` returns a weak ETag (`W/"…"`); strip `W/` before `put(..., { ifMatch })` or every write after the first fails as a conflict.
- Next 16 with `cacheComponents`: no `export const dynamic`; read request data under `await connection()` inside `<Suspense>`.
- Per-phone settings use `useSyncExternalStore` over localStorage, not `setState` in an effect (lint forbids that).
- Commit messages end with the Co-Authored-By line. Push to `main` to deploy; check with `npx vercel list vietnam-thailand-2026`.
