// Builds the JSON body ListingForm sends. Pure (takes a FormData-like object) so it
// is unit-testable without React.

/**
 * On edit, dotYear is sent only when the seller changed it to a new non-empty
 * value. Resending the stored value would make a legacy listing whose year is
 * outside the now-validated range fail every edit (e.g. a price change) with a
 * dotYear 400. Create always sends it (the server requires it).
 */
export function buildListingBody(form, initial, editing, photos) {
  const body = Object.fromEntries(form.entries());
  body.photos = photos;
  body.runFlat = form.get("runFlat") === "on"; // checkbox -> explicit boolean
  body.shipping = form.get("shipping") === "on";

  if (editing) {
    const sent = String(body.dotYear ?? "").trim();
    const stored = String(initial?.dotYear ?? "");
    if (!sent || sent === stored) delete body.dotYear;
  }
  return body;
}
