import { test } from "node:test";
import assert from "node:assert/strict";
import { firstTouch, encodeSource, decodeSource } from "../lib/attribution.js";

const u = (s) => new URL(s);

test("firstTouch records utm tags and landing path", () => {
  const t = firstTouch(u("https://shoptiretrader.com/sell-tires?utm_source=facebook&utm_medium=paid&utm_campaign=sellers_q4"), null, Date.UTC(2026, 8, 24));
  assert.deepEqual(t, { source: "facebook", medium: "paid", campaign: "sellers_q4", land: "/sell-tires", at: "2026-09-24" });
});

test("firstTouch records an outside referrer host, not our own sites", () => {
  assert.equal(firstTouch(u("https://shoptiretrader.com/"), "https://www.instagram.com/tire_trader/").ref, "www.instagram.com");
  assert.equal(firstTouch(u("https://shoptiretrader.com/browse"), "https://shoptiretrader.com/"), null);
  assert.equal(firstTouch(u("https://tirekind.com/browse"), "https://www.tirekind.com/x"), null);
});

test("direct visit records nothing (so a later tagged visit still counts)", () => {
  assert.equal(firstTouch(u("https://shoptiretrader.com/"), null), null);
  assert.equal(firstTouch(u("https://shoptiretrader.com/"), "not a url"), null);
});

test("values are sanitized and length-capped", () => {
  const t = firstTouch(u("https://shoptiretrader.com/?utm_source=" + encodeURIComponent('<script>"x"</script>' + "a".repeat(200))), null);
  assert.ok(!/[<>"]/.test(t.source));
  assert.ok(t.source.length <= 80);
});

test("encode/decode round-trips; junk decodes to null", () => {
  const t = { source: "tiktok", land: "/", at: "2026-09-24" };
  assert.deepEqual(decodeSource(encodeSource(t)), t);
  assert.equal(decodeSource(undefined), null);
  assert.equal(decodeSource("%7Bnot-json"), null);
  assert.equal(decodeSource(encodeURIComponent("[1,2]")), null);
  assert.deepEqual(decodeSource(encodeURIComponent(JSON.stringify({ source: "x", evil: "y" }))), { source: "x" });
});
