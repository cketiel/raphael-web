import type { TripRead } from "./types";

/** Lower case and without accents: "José" is found typing "jose". */
function fold(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Does this trip match what the user typed? Every word must appear somewhere in the trip, in any
 * order, so "garcia 1520" finds Mrs. García's trip with a 1520 in its address or number. A term
 * with at least three digits also matches phones whatever their punctuation: "3055551234" finds
 * "(305) 555-1234".
 *
 * Runs in the browser over the trips already loaded: nothing typed here is sent anywhere, which
 * matters because it is often a patient's name or phone.
 */
export function tripMatches(trip: TripRead, term: string, statusLabel: (s: string | null | undefined) => string | null | undefined) {
  const words = fold(term).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const text = fold(
    [
      trip.id,
      trip.tripId,
      trip.customerName,
      trip.pickupAddress,
      trip.dropoffAddress,
      trip.pickup,
      trip.dropoff,
      trip.pickupPhone,
      trip.dropoffPhone,
      trip.authorization,
      trip.providerName,
      trip.spaceTypeName,
      trip.status,
      statusLabel(trip.status),
    ]
      .filter((x) => x !== null && x !== undefined && x !== "")
      .join(" "),
  );
  const digits = [trip.pickupPhone, trip.dropoffPhone].map((p) => (p ?? "").replace(/\D/g, "")).join(" ");

  return words.every((word) => {
    if (text.includes(word)) return true;
    const wordDigits = word.replace(/\D/g, "");
    return wordDigits.length >= 3 && wordDigits === word.replace(/[\s().+-]/g, "") && digits.includes(wordDigits);
  });
}
