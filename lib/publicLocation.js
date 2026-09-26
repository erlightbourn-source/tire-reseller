// Listings' `location` field is free text the seller typed (see
// ListingForm.js "City / location"), and at least one live seller entered
// their full street address ("539 Charles St, Providence, RI 02903"),
// which then rendered on cards, the listing detail page, and in JSON-LD
// (push-ada-evalE finding E6). publicLocation() reduces that free text to a
// city/state-only display string wherever a listing's location is shown to
// buyers, without touching what's stored in the database.
//
// Rule: drop any comma-segment that starts with a house number
// ("539 Charles St"), strip any US ZIP code, and join what's left. If
// nothing sensible remains, return "" so callers can hide the location
// entirely rather than show a stray comma or fragment.

const HOUSE_NUMBER_LEAD = /^\s*\d+\s+\S/;
const US_ZIP = /\b\d{5}(-\d{4})?\b/g;

export function publicLocation(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .split(",")
    .filter((segment) => !HOUSE_NUMBER_LEAD.test(segment))
    .map((segment) => segment.replace(US_ZIP, "").trim())
    .filter(Boolean)
    .join(", ");
}
