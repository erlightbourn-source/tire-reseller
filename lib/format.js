export function formatPrice(cents) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

// Collapse a user-controlled value (a name, listing brand/size/location) to a
// single capped line before it goes into an email subject or body. cleanStr()
// only trims the ENDS, so an interior CR/LF (or U+2028/U+2029/NEL) typed into a
// name or listing field would otherwise inject whole lines — e.g. a fake
// "verify your account at <link>" paragraph — into a genuine TireKind email that
// another user receives.
export function oneLine(v, max = 120) {
  return String(v ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim()
    .slice(0, max);
}

export function timeAgo(date) {
  const d = new Date(date);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["min", 60],
  ];
  for (const [name, s] of units) {
    const v = Math.floor(secs / s);
    if (v >= 1) return `${v} ${name}${v > 1 ? "s" : ""} ago`;
  }
  return "just now";
}
