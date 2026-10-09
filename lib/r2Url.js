// Public URL for an object in the R2 uploads bucket. Returns null when the public
// base is unset/blank/non-https, so the upload route can refuse BEFORE writing
// instead of persisting a relative "/uploads/x" URL that 404s on the Worker origin.
export function buildR2Url(base, fname) {
  const b = String(base || "").trim().replace(/\/+$/, "");
  if (!/^https:\/\//i.test(b)) return null;
  return `${b}/uploads/${fname}`;
}
