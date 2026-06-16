// Safely serialize a JSON-LD object for injection into a <script> tag via
// dangerouslySetInnerHTML. JSON.stringify escapes quotes and backslashes but
// NOT `<`, `>`, `&`, or the U+2028/U+2029 line/paragraph separators -- so
// attacker-controlled strings (listing description/brand/location, photo URLs)
// could otherwise break out of the <script> block, e.g.
// `</script><img onerror=...>`. Escaping those bytes to their \uXXXX forms
// keeps the payload inert while remaining valid JSON.
const LS = String.fromCharCode(0x2028); // U+2028 line separator
const PS = String.fromCharCode(0x2029); // U+2029 paragraph separator
const JSONLD_ESCAPE = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [LS]: "\\u2028",
  [PS]: "\\u2029",
};
const JSONLD_RE = new RegExp("[<>&" + LS + PS + "]", "g");

export function jsonLdHtml(obj) {
  return JSON.stringify(obj).replace(JSONLD_RE, (ch) => JSONLD_ESCAPE[ch]);
}
