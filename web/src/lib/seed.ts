import type { BookingFacts, Hotel, Move, PersonId, Stop, TripState } from "./types";

export const PEOPLE: { id: PersonId; name: string }[] = [
  { id: "shahar", name: "שחר" },
  { id: "adi", name: "עדי" },
  { id: "roni", name: "רוני" },
  { id: "yahel", name: "יהל" },
  { id: "ofir", name: "אופיר" },
  { id: "lauren", name: "לורן" },
  { id: "shir", name: "שיר" },
];
export const personName = (id?: PersonId | null) => PEOPLE.find((p) => p.id === id)?.name ?? "";

const VN: PersonId[] = ["shahar", "adi", "roni", "yahel", "ofir", "lauren"];
const DUO: PersonId[] = ["shahar", "adi"];
const TRIO: PersonId[] = ["shahar", "adi", "shir"];
/** A starting split the group can change in the app. */
const VN_ROOMS = { shahar: 1, adi: 1, roni: 2, yahel: 2, ofir: 3, lauren: 3 };
const ONE_ROOM = { shahar: 1, adi: 1, shir: 1 };

/** Subscores come in Booking's page order: location, cleanliness, value, facilities, comfort, staff. */
function bf(score: number, reviews: number, stars: number | null, photos: number, type: string, s: number[], squares = false): BookingFacts {
  const [location, cleanliness, value, facilities, comfort, staff] = s;
  return {
    score, reviews, photos, type,
    stars: stars ? { n: stars, kind: squares ? "squares" : "stars" } : undefined,
    subs: { location, cleanliness, value, facilities, comfort, staff },
  };
}
const ll = (s: string) => s.split(",").map(Number) as [number, number];

const stops: Stop[] = [
  { id: "han1", name: "האנוי", country: "vn", from: "2026-11-02", to: "2026-11-03", people: VN, adults: 6, rooms: 3, roomOf: VN_ROOMS,
    center: { name: "אגם הואן קיים", ll: [21.0288313, 105.8525357] }, area: "העיר העתיקה", bookedId: "golden-lotus", pickId: "golden-lotus" },
  { id: "sapa", name: "סאפה", country: "vn", from: "2026-11-03", to: "2026-11-06", people: VN, adults: 6, rooms: 3, roomOf: VN_ROOMS,
    center: { name: "הכיכר והכנסייה", ll: [22.335203, 103.842254] }, area: "מרכז העיר, בין הכיכר לאגם", pickId: "mountain-queen",
    why: "הציון המנורמל הכי גבוה בסאפה, בפער של 0.4 מכל השאר: 9.5 על 1,428 ביקורות, 4 כוכבים, וצוות 9.9. הוא גם הכי קרוב לכיכר. הוא עולה כפול מ־New Day, אבל $29 לאדם ללילה עם ארוחת בוקר עדיין זול." },
  { id: "hg", name: "הא ג׳יאנג", country: "vn", from: "2026-11-06", to: "2026-11-07", people: VN, adults: 6, rooms: 3, roomOf: VN_ROOMS,
    center: { name: "העיר הא ג׳יאנג", ll: [22.8233, 104.9836] },
    lodgingNote: "מגיעים בסביבות 23:00. רוב חברות הלופ נותנות מיטה בהוסטל שלהן בלילה שלפני היציאה. לבקש כשמזמינים." },
  { id: "loop", name: "לופ הא ג׳יאנג", country: "vn", from: "2026-11-07", to: "2026-11-09", people: VN, adults: 6, rooms: 3, roomOf: VN_ROOMS,
    center: { name: "דונג ואן", ll: [23.2783, 105.3628] },
    lodgingNote: "בדרך כלל ההומסטיי כלול בטיול המאורגן. לוודא כשמזמינים." },
  { id: "hoian", name: "הוי אן", country: "vn", from: "2026-11-09", to: "2026-11-13", people: VN, adults: 6, rooms: 3, roomOf: VN_ROOMS,
    center: { name: "הגשר היפני", ll: [15.8771541, 108.3260034] }, area: "ליד העיר העתיקה", pickId: "hoianese",
    why: "9.8 על יותר מ־1,000 ביקורות, וכל קטגוריה 9.6 ומעלה. ל־Lion King ציון מנורמל כמעט זהה, אבל הוא עולה 50% יותר." },
  { id: "han2", name: "האנוי", country: "vn", from: "2026-11-13", to: "2026-11-16", people: VN, adults: 6, rooms: 3, roomOf: VN_ROOMS,
    center: { name: "אגם הואן קיים", ll: [21.0288313, 105.8525357] }, area: "העיר העתיקה", pickId: "ambery",
    why: "שני מלונות בראש עם 9.4: Ambery ו־Amara. Ambery עולה 40% פחות על אותו ציון, אז הוא מנצח. מיקום וצוות 9.8." },
  { id: "cm", name: "צ׳יאנג מאי", country: "th", from: "2026-11-16", to: "2026-11-19", people: DUO, adults: 2, rooms: 1, roomOf: ONE_ROOM,
    center: { name: "שער טה פה", ll: [18.7877625, 98.9932697] }, area: "ליד שער טה פה", pickId: "kiri",
    why: "הכי טוב בכל קטגוריה (9.4–9.8), 4 כוכבים, בריכה ו־7־Eleven ב־40 מ׳. Signature עולה חצי, אבל נמוך ב־0.6 בציון המנורמל, אז הפער גדול מדי.",
    rides: "Grab ו־Bolt עובדים. Bolt בדרך כלל קצת יותר זול." },
  { id: "samui", name: "קו סמוי", country: "th", from: "2026-11-19", to: "2026-11-23", people: TRIO, adults: 3, rooms: 1, roomOf: ONE_ROOM,
    center: { name: "Ark Bar", ll: [9.530268, 100.064635] }, area: "צ׳אוונג, ליד Ark Bar", pickId: "chaweng-garden",
    why: "הכי מבוסס בסמוי: 9.0 על 2,580 ביקורות. על החוף, עם 2 בריכות וארוחת בוקר, 3 דקות מ־Ark Bar בלי לגור בתוך הרעש.",
    rides: "Grab עובד בצ׳אוונג אבל יקר. Bolt לא פועל בסמוי. InDrive בדרך כלל זול יותר." },
  { id: "phangan", name: "קו פנגן", country: "th", from: "2026-11-23", to: "2026-11-26", people: TRIO, adults: 3, rooms: 1, roomOf: ONE_ROOM,
    center: { name: "האד רין", ll: [9.6756244, 100.065587] }, area: "באן טאי. להאד רין רק במונית", pickId: "yangyai-lodge",
    why: "9.6 על 365 ביקורות, עם בריכה, וב־$27 לאדם ללילה. CheeVa על החוף מקבל ציון מנורמל גבוה רק ב־0.2, אבל עולה 77% יותר, אז הלודג׳ מנצח בתמורה למחיר. שימו לב: הוא לא על החוף, והמיטה השלישית היא קומותיים.",
    rides: "Grab ו־Bolt לא עובדים. סונגטאו או מונית דרך המלון, סוגרים מחיר מראש." },
  { id: "tao", name: "קו טאו", country: "th", from: "2026-11-26", to: "2026-11-28", people: TRIO, adults: 3, rooms: 1, roomOf: ONE_ROOM,
    center: { name: "מרכז סאירי", ll: [10.0972788, 99.827833] }, area: "חוף סאירי", pickId: "simple-life",
    why: "בקו טאו המקומות עם הציונים הכי גבוהים הם הוסטלים. מבין המלונות, Simple Life מוביל: 2 בריכות, מרפסת ומיקום 9.4.",
    rides: "Grab ו־Bolt לא עובדים. טנדרים ומוניות־אופנוע במחיר קבוע." },
  { id: "bkk", name: "בנגקוק", country: "th", from: "2026-11-28", to: "2026-11-30", people: DUO, adults: 2, rooms: 1, roomOf: ONE_ROOM,
    center: { name: "BTS אסוק", ll: [13.7371261, 100.5602488] }, area: "אסוק, סוקומווית", pickId: "paradox",
    why: "9.0 על 1,768 ביקורות, 4 כוכבים, בריכה, חדר כושר ו־2 מסעדות, וארוחת בוקר כלולה. SQ זול ב־$47 ונמוך רק ב־0.2, אבל החיסכון קטן מדי כדי לנצח.",
    rides: "Grab ו־Bolt עובדים. ה־BTS ליד מהיר יותר בשעות העומס." },
];

const H = (h: Hotel) => h;
const hotels: Hotel[] = [
  // Hanoi, night 1 (booked)
  H({ id: "golden-lotus", stopId: "han1", name: "Hanoi Golden Lotus Hotel & Spa", slug: "vn/gia-thinh", ll: ll("21.033769727918404,105.85331037640572"),
    booking: bf(8.7, 2117, 3, 31, "HOTEL", [9.7, 8.6, 9, 8.4, 8.7, 9.6]), facilities: ["ספא", "מסעדה", "ארוחת בוקר טובה"],
    pros: ["מיקום 9.7, צוות 9.6", "2,117 ביקורות", "ספא ומסעדה"] }),

  // Sapa
  H({ id: "mountain-queen", stopId: "sapa", name: "Sapa Mountain Queen House", slug: "vn/mountain-queen-house", ll: ll("22.338612579106,103.843606096893"),
    booking: bf(9.5, 1428, 4, 45, "HOTEL", [9.7, 9.6, 9.5, 9.3, 9.6, 9.9]), priceTotal: 523, room: "חדר קינג ו־2 חדרים עם 2 מיטות קווין · ארוחת בוקר",
    facilities: ["ארוחת בוקר", "מסעדה", "בר"], pros: ["9.5 על 1,428 ביקורות, הכי מבוסס בסאפה", "4 כוכבים, צוות 9.9", "הכי קרוב לכיכר"] }),
  H({ id: "new-day", stopId: "sapa", name: "Hôtel new day SaPa", slug: "vn/new-day-sapa-sa-pa3", ll: ll("22.3372673,103.8484173"),
    booking: bf(9.4, 383, 3, 45, "HOTEL", [9.6, 9.5, 9.6, 9.4, 9.5, 9.6]), priceTotal: 259, room: "3 חדרי טווין · ארוחת בוקר · ביטול חינם",
    facilities: ["ארוחת בוקר", "מסעדה"], pros: ["חצי מחיר מההמלצה", "9.4 ומעלה בכל קטגוריה", "ביטול חינם"],
    cons: "נמוך ב־0.4 בציון המנורמל: 3 כוכבים ורק 383 ביקורות. אם התקציב חשוב, זו הבחירה." }),
  H({ id: "palais-sapa", stopId: "sapa", name: "Palais De Sapa Boutique Hotel", slug: "vn/palais-de-sapa", ll: ll("22.3364867197677,103.84691132853"),
    booking: bf(9.6, 153, 4, 45, "HOTEL", [9.7, 9.7, 9.6, 9.5, 9.7, 9.9]), priceTotal: 521, room: "3 חדרי דלוקס · ארוחת בוקר",
    facilities: ["ארוחת בוקר מצוינת", "בר"], pros: ["ניקיון ונוחות 9.7", "4 כוכבים", "Booking מדרג את ארוחת הבוקר \"Wonderful\""],
    cons: "אותו מחיר כמו ההמלצה עם רק 153 ביקורות, כך שהציון פחות מבוסס." }),
  H({ id: "may-ho", stopId: "sapa", name: "May Ho Hotel Sapa", slug: "vn/may-ho-sapa", ll: ll("22.3375901378219,103.847766364418"),
    booking: bf(9.1, 846, 3, 43, "HOTEL", [9.6, 9, 9.4, 9, 9.1, 9.7]), priceTotal: 188, room: "ביטול חינם, תשלום במלון",
    facilities: ["בר"], pros: ["הכי זול: ~$10 לאדם ללילה", "846 ביקורות, צוות 9.7"],
    cons: "בלי ארוחת בוקר, וניקיון ומתקנים 9.0. בסיסי יותר." }),

  // Hoi An
  H({ id: "hoianese", stopId: "hoian", name: "Hoianese Quiet Old Town Hotel", slug: "vn/hoianese-old-town-boutique-hotel", ll: ll("15.881585670923506,108.32495793700218"),
    booking: bf(9.8, 1055, null, 45, "HOTEL", [9.7, 9.8, 9.8, 9.6, 9.8, 9.9]), priceTotal: 399, room: "מרפסות · ארוחת בוקר · ביטול חינם",
    facilities: ["ארוחת בוקר טובה"], pros: ["9.8 על 1,055 ביקורות", "ניקיון, נוחות וצוות 9.8–9.9", "רחוב שקט ליד העיר העתיקה"] }),
  H({ id: "lion-king", stopId: "hoian", name: "Lion King Hotel", slug: "vn/lion-king-thanh-pho-hoi-an", ll: ll("15.880456,108.326866"),
    booking: bf(9.6, 1069, 3, 35, "HOTEL", [9.9, 9.6, 9.6, 9.3, 9.6, 9.9]), priceTotal: 602, room: "חדרים מול הבריכה",
    facilities: ["בריכה", "בר", "מרפסת"], pros: ["בריכה", "מיקום וצוות 9.9", "ציון מנורמל כמעט זהה להמלצה"],
    cons: "עולה $200 יותר (50% יותר) על אותה איכות." }),
  H({ id: "vinh-khang", stopId: "hoian", name: "Vinh Khang Homestay", slug: "vn/vinh-khang-homestay-thanh-pho-hoi-an1", ll: ll("15.881176596145,108.327459071912"),
    booking: bf(9.7, 565, 3, 41, "BED_AND_BREAKFAST", [9.9, 9.5, 9.8, 9.4, 9.5, 9.9], true), priceTotal: 360, room: "חדרים לשלושה · ביטול חינם",
    pros: ["9.7, וצוות ומיקום 9.9", "זול ב־$40"], cons: "זה B&B משפחתי, לא מלון. מחשבים לו −0.15 על הסוג." }),
  H({ id: "hoang-trinh", stopId: "hoian", name: "Hoang Trinh Hotel Hoi An", slug: "vn/hoang-trinh", ll: ll("15.880142252409945,108.32318365573883"),
    booking: bf(9.2, 550, 2, 45, "HOTEL", [9.8, 9.1, 9.4, 9.1, 9.2, 9.8]), priceTotal: 369, room: "ארוחת בוקר · ביטול חינם",
    facilities: ["בריכה", "ספא", "ארוחת בוקר מצוינת"], pros: ["בריכה וספא", "Booking מדרג את ארוחת הבוקר \"Wonderful\"", "זול ב־$30"],
    cons: "2 כוכבים, וניקיון ונוחות 9.1–9.2." }),

  // Hanoi, before Thailand
  H({ id: "ambery", stopId: "han2", name: "The Ambery Hanoi Boutique Hotel", slug: "vn/ngoc-diep-asia", ll: ll("21.035049757307505,105.84826648235321"),
    booking: bf(9.3, 1232, 3, 45, "HOTEL", [9.8, 9.3, 9.4, 9, 9.4, 9.8]), priceTotal: 445, room: "ביטול חינם · ארוחת בוקר טובה",
    pros: ["9.3 על 1,232 ביקורות", "מיקום וצוות 9.8", "קבלה 24 שעות. מגיעים ב־22:00"] }),
  H({ id: "amara", stopId: "han2", name: "Amara Hanoi Hotel and Spa", slug: "vn/amara-hanoi", ll: ll("21.0330464,105.8497745"),
    booking: bf(9.1, 2859, 4, 45, "HOTEL", [9.7, 9.3, 9.2, 9.1, 9.3, 9.5]), priceTotal: 745, room: "חדר משפחה ו־2 חדרים · ארוחת בוקר",
    facilities: ["ספא", "מסעדה", "ארוחת בוקר מצוינת"], pros: ["4 כוכבים וספא", "2,859 ביקורות", "ציון מנורמל זהה להמלצה"],
    cons: "עולה $300 יותר על אותו ציון." }),
  H({ id: "aviary", stopId: "han2", name: "Aviary Hanoi Hotel & Travel", slug: "vn/aviary-hanoi-amp-spa", ll: ll("21.033436,105.852178"),
    booking: bf(9.0, 712, 4, 45, "HOTEL", [9.6, 9, 9, 8.8, 9, 9.6]), priceTotal: 609, room: "3 חדרי דלוקס · ביטול חינם",
    facilities: ["ספא", "ארוחת בוקר יוצאת דופן"], pros: ["4 כוכבים וספא", "הכי קרוב לאגם"], cons: "ציון נמוך יותר ועולה $160 יותר." }),
  H({ id: "golden-sun", stopId: "han2", name: "Golden Sun Hotel", slug: "vn/golden-sun-amp-spa", ll: ll("21.03265584253823,105.84930472606636"),
    booking: bf(9.0, 2804, 3, 45, "HOTEL", [9.7, 9, 9.2, 8.9, 9, 9.7]), priceTotal: 659, room: "3 חדרים · ארוחת בוקר · ביטול חינם",
    facilities: ["מסעדה", "מרפסת"], pros: ["2,804 ביקורות", "ארוחת בוקר כלולה"], cons: "3 כוכבים, ועולה $210 יותר מההמלצה." }),

  // Chiang Mai
  H({ id: "kiri", stopId: "cm", name: "KIRI HOTEL Chiang Mai", slug: "th/kiri-emuue-ngechiiyngaihm", ll: ll("18.79010317783069,98.9918533997917"),
    booking: bf(9.3, 688, 4, 43, "HOTEL", [9.7, 9.5, 9.4, 9.1, 9.5, 9.8]), priceTotal: 290, shop: "7־Eleven ב־40 מ׳",
    facilities: ["בריכה", "בר", "ארוחת בוקר מצוינת"], pros: ["הכי טוב בכל קטגוריה (9.4–9.8)", "4 כוכבים ובריכה", "Booking מדרג את ארוחת הבוקר \"Wonderful\""] }),
  H({ id: "signature-thapae", stopId: "cm", name: "The Signature Hotel @ Thapae", slug: "th/the-signature-thapae", ll: ll("18.78829112487873,98.9965426409617"),
    booking: bf(9.0, 381, 3, 31, "HOTEL", [9.6, 9.2, 9.2, 8.8, 9.3, 9.6]), priceTotal: 136, shop: "7־Eleven ב־50 מ׳",
    facilities: ["מסעדה", "ארוחת בוקר"], pros: ["חצי מחיר", "9.0 על 381 ביקורות"],
    cons: "נמוך ב־0.6 בציון המנורמל: 3 כוכבים ודף עם 31 תמונות. אם רוצים לחסוך, זו הבחירה." }),
  H({ id: "pe-la", stopId: "cm", name: "PE-LA Thapae Boutique Hotel", slug: "th/pe-la-thapae-boutique", ll: ll("18.787395344336,98.9930585623757"),
    booking: bf(9.1, 116, null, 45, "HOTEL", [9.8, 9.4, 9.1, 9, 9.6, 9.7]), priceTotal: 344, shop: "7־Eleven ב־15 מ׳",
    pros: ["ממש על השער, מיקום 9.8", "נוחות 9.6"], cons: "יקר מההמלצה, בלי כוכבים ובלי בריכה, ורק 116 ביקורות." }),
  H({ id: "wonderwall", stopId: "cm", name: "Wonderwall Hotel", slug: "th/wonderwall", ll: ll("18.78998,98.993142"),
    booking: bf(8.5, 193, 3, 45, "HOTEL", [9.7, 8.6, 8.8, 8.3, 8.4, 9.1]), priceTotal: 166, shop: "Lotus's ב־130 מ׳, 7־Eleven ב־150 מ׳",
    pros: ["זול, ליד השער"], cons: "ניקיון 8.6 ומתקנים 8.3. בסיסי." }),

  // Samui
  H({ id: "chaweng-garden", stopId: "samui", name: "Chaweng Garden Beach Resort", slug: "th/chaweng-garden-beach-resort", ll: ll("9.531334218548698,100.06354093551636"),
    booking: bf(9.0, 2580, 3, 45, "RESORT", [9.5, 9.1, 8.8, 9, 9.1, 9.5]), priceTotal: 422, room: "חדר לשלושה מול הגינה · ארוחת בוקר · ביטול חינם", shop: "7־Eleven ב־80 מ׳",
    facilities: ["2 בריכות", "חוף פרטי", "ארוחת בוקר"], pros: ["9.0 על 2,580 ביקורות", "על החוף, 2 בריכות", "קרוב ל־Ark Bar בלי לגור בתוך הרעש"] }),
  H({ id: "baan-samui", shop: "Saver Mart ב־45 מ׳, FamilyMart ב־120 מ׳", stopId: "samui", name: "Baan Samui Resort", slug: "th/baan-samui-resort", ll: ll("9.527829334886183,100.06013989448547"),
    booking: bf(8.8, 451, 4, 45, "RESORT", [9.5, 9.1, 8.6, 8.8, 9.2, 9.6]), priceTotal: 675, room: "2 חדרים",
    facilities: ["2 בריכות", "על החוף", "2 מסעדות"], pros: ["4 כוכבים, על החוף", "דרום צ׳אוונג, שקט יותר"],
    cons: "עולה $250 יותר, וציון נמוך יותר." }),
  H({ id: "lub-d-samui", shop: "7־Eleven ב־270 מ׳", stopId: "samui", name: "Lub d Koh Samui Chaweng Beach", slug: "th/lub-d-koh-samui-chaweng-beach", ll: ll("9.530696878051325,100.0657295013583"),
    booking: bf(8.7, 2465, 4, 45, "HOTEL", [9.4, 9, 8.5, 9, 9.1, 9.2]), priceTotal: 384, room: "חדר לארבעה עם מיטת קומותיים",
    facilities: ["2 בריכות", "על החוף"], pros: ["4 כוכבים, על החוף", "2,465 ביקורות"],
    cons: "Booking מתאר אותו כמקום עם \"Vibrant Social Vibe\", כלומר מסיבתי, וביקשתם שקט. גם המיטה השלישית היא קומותיים." }),
  H({ id: "long-beach-lodge", stopId: "samui", name: "Long Beach Lodge", slug: "th/long-beach-lodge-chaweng-beach-koh-samui", ll: ll("9.528146759794376,100.06154537200928"),
    booking: bf(8.5, 969, 3, 45, "RESORT", [9.6, 8.7, 8.6, 8.2, 8.7, 9.2]), priceTotal: 282, room: "בונגלו משפחתי על החוף", shop: "Tops ב־180 מ׳",
    pros: ["בונגלו על החוף", "הכי זול ושקט"], cons: "בלי בריכה, ומתקנים 8.2." }),

  // Phangan
  H({ id: "yangyai-lodge", shop: "7־Eleven ב־700 מ׳ (10 דק׳ הליכה)", stopId: "phangan", name: "Yangyai Garden Lodge", slug: "th/yangyai-garden", ll: ll("9.706640677097,100.030031456622"),
    booking: bf(9.6, 365, null, 38, "HOTEL", [9.0, 9.5, 9.5, 9.4, 9.5, 9.8]), priceTotal: 241, room: "חדר זוגי עם מרפסת וחדר טווין (מיטת קומותיים)",
    facilities: ["בריכה"], pros: ["9.6 על 365 ביקורות, צוות 9.8", "בריכה", "הכי זול: ~$27 לאדם ללילה"] }),
  H({ id: "cheeva", stopId: "phangan", name: "CheeVa Beach Resort", slug: "th/cheeva-beach-resort", ll: ll("9.69652612220166,100.028978797623"),
    booking: bf(9.6, 486, null, 38, "RESORT", [9.3, 9.7, 9.6, 9.5, 9.7, 9.9]), priceTotal: 427, room: "בונגלו עם 2 חדרי שינה על החוף", shop: "7־Eleven ב־440 מ׳",
    facilities: ["בריכה", "על החוף"], pros: ["בונגלו עם 2 חדרי שינה על החוף", "ניקיון ונוחות 9.7"],
    cons: "עולה $186 יותר (77% יותר) על ציון כמעט זהה. אם חשוב לכם חוף מול הדלת, הוא שווה את זה." }),
  H({ id: "yangyai-hotel", shop: "7־Eleven ב־740 מ׳", stopId: "phangan", name: "Yangyai Garden Hotel", slug: "th/yangyai-garden-tambon-ko-tao", ll: ll("9.70704841234361,100.02989193884353"),
    booking: bf(9.7, 224, 3, 41, "HOTEL", [8.9, 9.7, 9.8, 9.7, 9.7, 10]), priceTotal: 309,
    facilities: ["בריכה"], pros: ["9.7, צוות 10", "3 כוכבים ובריכה"], cons: "מיקום 8.9, ועולה $68 יותר מהלודג׳ השכן." }),
  H({ id: "sand-terrace", shop: "7־Eleven ב־320 מ׳", stopId: "phangan", name: "Sand Terrace Beach Bungalows", slug: "th/sand-terrace-beach-bungalows-koh-phangan1", ll: ll("9.698117,100.023248"),
    booking: bf(9.3, 441, 3, 43, "HOTEL", [9.2, 9.5, 9.3, 9.1, 9.5, 9.9]), priceTotal: 482, room: "2 בונגלואים · ביטול חינם",
    pros: ["2 בונגלואים נפרדים", "9.3 על 441 ביקורות"], cons: "הכי יקר, ואין בריכה ברשימת המתקנים." }),
  H({ id: "morning-star", stopId: "phangan", name: "Morning Star Resort", slug: "th/morning-star-resort", ll: ll("9.696752638143273,100.03038883209229"),
    booking: bf(8.7, 617, 3, 45, "RESORT", [8.7, 8.8, 9, 8.7, 8.8, 9.5]), priceTotal: 290, room: "חדר משפחה דלוקס · ביטול חינם", shop: "7־Eleven ב־410 מ׳",
    facilities: ["בריכה", "חוף פרטי", "ארוחת בוקר"], pros: ["בריכה, חוף פרטי וארוחת בוקר"], cons: "נמוך בכל הקטגוריות (8.7–9.0)." }),

  // Koh Tao
  H({ id: "simple-life", stopId: "tao", name: "Simple Life Resort Koh Tao", slug: "th/simple-life-resort-koh-tao", ll: ll("10.0991231065061,99.8317641667998"),
    booking: bf(8.6, 142, 3, 45, "HOTEL", [9.4, 8.7, 8.4, 8.7, 8.9, 8.9]), priceTotal: 213, room: "חדר לשלושה עם מרפסת · ביטול חינם", shop: "7־Eleven ב־190 מ׳",
    facilities: ["2 בריכות", "ארוחת בוקר"], pros: ["2 בריכות ומרפסת", "מיקום 9.4"] }),
  H({ id: "grand-beach", stopId: "tao", name: "Grand Beach Resort", slug: "th/grand-beach-resort", ll: ll("10.0993943192085,99.8292533308268"),
    booking: bf(8.4, 723, null, 45, "RESORT", [9.4, 8.6, 8.8, 8.2, 8.5, 9.4]), priceTotal: 142, room: "2 חדרים זוגיים · ביטול חינם", shop: "7־Eleven ב־80 מ׳",
    facilities: ["על החוף"], pros: ["על החוף, 2 חדרים", "זול ב־$71"], cons: "בלי בריכה ובלי כוכבים." }),
  H({ id: "samatha", shop: "7־Eleven ב־210 מ׳", stopId: "tao", name: "Samatha Bed & Breakfast", slug: "th/samatha-bed-amp-breakfast", ll: ll("10.101265781531568,99.82941636441802"),
    booking: bf(8.4, 314, 4, 38, "BED_AND_BREAKFAST", [9.1, 8.8, 8.6, 8.4, 8.9, 9.1], true), priceTotal: 243, room: "סוויטה עם מיטת קינג אחת",
    pros: ["סוויטה עם סלון", "מסעדה ובר"], cons: "B&B, ומיטת קינג אחת לשלושה." }),
  H({ id: "palm-leaf", shop: "7־Eleven ב־460 מ׳", stopId: "tao", name: "Palm Leaf Resort Koh Tao", slug: "th/palm-leaf-resort-koh-tao", ll: ll("10.103074701687333,99.82798933982849"),
    booking: bf(8.3, 1113, 3, 45, "RESORT", [9, 8.7, 8.3, 8.3, 8.9, 8.3]), priceTotal: 315, room: "חדר משפחה",
    facilities: ["על החוף", "חוף פרטי"], pros: ["על החוף", "1,113 ביקורות"], cons: "יקר ב־$100, בלי בריכה, ציון 8.3." }),

  // Bangkok
  H({ id: "paradox", stopId: "bkk", name: "Paradox Bangkok Sukhumvit", slug: "th/paradox-bangkok-sukhumvit", ll: ll("13.739314738889716,100.5584742128849"),
    booking: bf(9.0, 1768, 4, 45, "HOTEL", [9.4, 9.3, 8.9, 9, 9.4, 9.6]), priceTotal: 211, room: "חדר פרימייר · ארוחת בוקר · ביטול חינם", shop: "7־Eleven ב־110 מ׳",
    facilities: ["בריכה", "חדר כושר", "2 מסעדות"], pros: ["4 כוכבים, בריכה, חדר כושר", "9.0 על 1,768 ביקורות", "ארוחת בוקר כלולה"] }),
  H({ id: "sq-bangkok", stopId: "bkk", name: "SQ Bangkok", slug: "th/sq-boutique", ll: ll("13.739737,100.560312"), shop: "7־Eleven ב־45 מ׳",
    booking: bf(8.8, 796, 4, 38, "HOTEL", [9.6, 9.2, 8.9, 8.8, 9.3, 9.5]), priceTotal: 164, room: "חדר זוגי",
    facilities: ["מסעדה", "ארוחת בוקר"], pros: ["4 כוכבים, זול ב־$47", "מיקום 9.6"], cons: "בלי בריכה. החיסכון קטן מדי (22%) כדי לנצח." }),
  H({ id: "hotel-433", shop: "7־Eleven ב־65 מ׳", stopId: "bkk", name: "Hotel 433 - Asoke Sukhumvit", slug: "th/433", ll: ll("13.7384855,100.5575517"),
    booking: bf(9.2, 311, 3, 45, "HOTEL", [9.7, 9.5, 9.2, 9.2, 9.5, 9.8]), priceTotal: 261, room: "חדר דלוקס · ביטול חינם",
    pros: ["9.2, ניקיון ונוחות 9.5"], cons: "עולה $50 יותר, בלי בריכה ובלי מסעדה, ורק 311 ביקורות." }),
  H({ id: "montraj", shop: "7־Eleven ב־130 מ׳", stopId: "bkk", name: "Montraj Coach Sukhumvit", slug: "th/the-coach-bangkok", ll: ll("13.735268644986379,100.56004942460632"),
    booking: bf(8.6, 2785, 4, 45, "HOTEL", [9.4, 9, 8.7, 8.6, 9, 9.3]), priceTotal: 197, room: "חדר טווין",
    facilities: ["בריכה", "חדר כושר"], pros: ["4 כוכבים, בריכה", "2,785 ביקורות"], cons: "ציונים 8.6–9.0, מלון גדול וותיק יותר." }),
];

const GF = (f: string, t: string, d: string) =>
  "https://www.google.com/travel/flights?hl=iw&curr=USD&q=" + encodeURIComponent(`Flights from ${f} to ${t} on ${d} one way`);

let mid = 0;
const M = (m: Omit<Move, "id">): Move => ({ id: `m${++mid}`, ...m });
const moves: Move[] = [
  M({ date: "2026-11-02", time: "בבוקר", kind: "flight", title: "נחיתה בהאנוי", detail: "הטיסה מהארץ. Grab לעיר העתיקה, בערך 45 דקות.", status: "booked" }),
  M({ date: "2026-11-03", time: "06:00–13:00", kind: "bus", title: "האנוי ← סאפה", detail: "Inter Bus Line (סליפר) ב־06:00, Eco Sapa (לימוזין) ב־07:00, או Sapa Express ב־06:45/07:15. 5.5–6 שעות.", price: "$14–23 לאדם", link: "https://www.baolau.com/en/s/Hanoi/Sapa/bus", status: "todo" }),
  M({ date: "2026-11-06", time: "17:00–23:00", kind: "bus", title: "סאפה ← הא ג׳יאנג", detail: "Bang Phan. אין אוטובוס לילה אמיתי, הנסיעה 6 שעות. האחרון יוצא ב־19:00.", price: "~$15 לאדם", link: "https://www.baolau.com/en/s/Sapa/Ha-Giang/bus", status: "todo" }),
  M({ date: "2026-11-07", time: "3 ימים", kind: "car", title: "הלופ, 7–9.11", detail: "לינה, ארוחות, דלק ומדריך בדרך כלל כלולים.", alt: "QT Motorbikes ~$195 · Jasmine $155–288 · Mama's ~$170–200 · Bong $125–205. איזי ריידר $160–220, נהיגה עצמית $90–170 (דורשת רישיון בינלאומי לאופנוע).", status: "todo" }),
  M({ date: "2026-11-09", time: "16:00–21:00", kind: "car", title: "הא ג׳יאנג ← שדה התעופה בהאנוי", detail: "ואן פרטי ישר לשדה, 4.5–5 שעות. דרך חברת הלופ או GoAsia.", price: "$17–38 לאדם", link: "https://goasia.cc/en/vietnam/ha-giang-to-hanoi", status: "todo" }),
  M({ date: "2026-11-09", time: "22:25–23:45", kind: "flight", title: "האנוי ← דה נאנג", detail: "Vietjet VJ1513", price: "~$47 לאדם", link: GF("HAN", "DAD", "2026-11-09"), alt: "הטיסה של 16:55 לא אפשרית אחרי יום אחרון של לופ.", status: "todo" }),
  M({ date: "2026-11-09", time: "בלילה", kind: "car", title: "דה נאנג ← הוי אן", detail: "2 רכבי Grab של 7 מקומות, 45–60 דקות.", price: "$14–18 לרכב", status: "info" }),
  M({ date: "2026-11-13", time: "18:00", kind: "car", title: "הוי אן ← שדה התעופה בדה נאנג", detail: "יוצאים עד 18:00 בגלל פקקים.", price: "$14–18 לרכב", status: "info" }),
  M({ date: "2026-11-13", time: "20:35–21:55", kind: "flight", title: "דה נאנג ← האנוי", detail: "Vietjet VJ516", price: "~$30 לאדם", link: GF("DAD", "HAN", "2026-11-13"), alt: "או VJ522 ב־22:15, באותו מחיר", status: "todo" }),
  M({ date: "2026-11-16", time: "15:20–17:00", kind: "flight", title: "האנוי ← צ׳יאנג מאי", detail: "Thai AirAsia FD871, ישירה", price: "~$137 לאדם", link: GF("HAN", "CNX", "2026-11-16"), status: "todo" }),
  M({ date: "2026-11-19", time: "11:30–13:15", kind: "flight", title: "צ׳יאנג מאי ← קו סמוי", detail: "Bangkok Airways PG242, ישירה", price: "~$284 לאדם", link: GF("CNX", "USM", "2026-11-19"), alt: "דרך בנגקוק: PG216 + PG145, 10:10–15:20, ~$231", status: "todo" }),
  M({ date: "2026-11-23", kind: "boat", title: "סמוי ← פנגן", detail: "Lomprayah ממזח בנגרק לטונג סאלה, 30 דקות, כל שעה בערך מ־08:00 עד 17:30. עם הסעות משני המלונות: 700 ฿.", price: "350 ฿ לאדם", link: "https://www.lomprayah.com/booking?type=oneway&from=38&to=10", alt: "Haad Rin Queen ב־10:30 או 17:00 ישר להאד רין, 200 ฿", status: "todo" }),
  M({ date: "2026-11-24", time: "מהערב עד הזריחה", kind: "event", title: "מסיבת פול מון", detail: "חוף האד רין. כניסה בערך 200 ฿. מונית מבאן טאי 15 דקות, בלילה של המסיבה 400–600 ฿. סוגרים מחיר מראש.", status: "info" }),
  M({ date: "2026-11-26", kind: "boat", title: "פנגן ← קו טאו", detail: "Lomprayah מטונג סאלה. קטמרן 08:30, 13:00 או 16:45; ספידבוט 11:15 או 15:00. 1–1.5 שעות.", price: "600 ฿ לאדם", link: "https://www.lomprayah.com/booking?type=oneway&from=10&to=9", status: "todo" }),
  M({ date: "2026-11-28", time: "10:15–13:00", kind: "boat", title: "קו טאו ← שדה התעופה בצ׳ומפון", detail: "Lomprayah: קטמרן והסעה לשדה בכרטיס אחד. הסירה היחידה שמגיעה בזמן.", price: "1,000 ฿ לאדם", link: "https://www.lomprayah.com/booking?type=oneway&from=9&to=36", status: "todo" }),
  M({ date: "2026-11-28", time: "15:40–16:40", kind: "flight", title: "צ׳ומפון ← בנגקוק (DMK)", detail: "Thai AirAsia FD3147, ישירה", price: "~$50 לאדם", link: GF("CJM", "DMK", "2026-11-28"), status: "todo" }),
  M({ date: "2026-11-30", kind: "flight", title: "טסים הביתה", detail: "כבר מוזמן. לבדוק מאיזה שדה (BKK או DMK).", status: "booked" }),
];

const notes: Record<string, string[]> = {
  "2026-11-02": ["הצ׳ק־אין אחרי הצהריים. אפשר להשאיר תיקים בקבלה."],
  "2026-11-09": ["יום ארוך: מגיעים להוי אן בערך ב־01:00. החלופה: אוטובוס לילה (21:30) ו־VU203 ב־10.11 ב־10:05."],
  "2026-11-16": ["בבוקר עוד כולם ביחד. רוני, יהל, אופיר ולורן ממשיכות בוייטנאם."],
  "2026-11-19": ["שיר מצטרפת בסמוי."],
  "2026-11-23": ["סביב הפול מון הסירות מתמלאות. להזמין 3–5 ימים לפני."],
  "2026-11-24": ["לפעמים מזיזים את המסיבה. לבדוק שוב כמה ימים לפני."],
  "2026-11-28": ["נפרדים משיר.", "אם מזג האוויר מבטל את הסירה של 10:15, מפספסים את הטיסה. לבדוק תחזית יום לפני."],
};

export const SEED: TripState = { rev: 1, stops, hotels, moves, notes, log: [] };
