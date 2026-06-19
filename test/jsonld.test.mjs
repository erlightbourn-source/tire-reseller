import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonLdHtml } from "../lib/jsonld.js";

// Regression guard for the stored-XSS fix: JSON-LD injected via
// dangerouslySetInnerHTML must not let attacker text break out of <script>.
test("escapes <, >, & so a </script> breakout is inert", () => {
  const out = jsonLdHtml({ description: "</script><img src=x onerror=alert(1)>", amp: "a & b" });
  assert.ok(!out.includes("</script>"), "no literal </script>");
  assert.ok(!out.includes("<"), "no raw <");
  assert.ok(!out.includes(">"), "no raw >");
  assert.match(out, /\\u003c\/script\\u003e/);
});

test("escapes U+2028 / U+2029 line separators", () => {
  const out = jsonLdHtml({ s: "x" + String.fromCharCode(0x2028) + "y" + String.fromCharCode(0x2029) + "z" });
  assert.ok(!out.includes(String.fromCharCode(0x2028)));
  assert.ok(!out.includes(String.fromCharCode(0x2029)));
  assert.match(out, /\\u2028/);
  assert.match(out, /\\u2029/);
});

test("output still parses back to the original object", () => {
  const obj = { "@type": "Product", name: "Toyo 255/40R19", description: "</script> & <b>", n: 5 };
  assert.deepEqual(JSON.parse(jsonLdHtml(obj)), obj);
});
