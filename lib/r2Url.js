// Public URL for an object stored in the R2 uploads bucket. Returns null when
// R2_PUBLIC_BASE_URL is unset/blank/non-https so the upload route can fail loudly
// rather than persist a relative "/uploads/x" URL that 404s on the CF origin.
export function buildR2Url(base, fname) {
  const b = String(base || "").trim().replace(/\/+$/, "");
  if (!/^https:\/\//i.test(b)) return null;
  return `${b}/uploads/${fname}`;
}
