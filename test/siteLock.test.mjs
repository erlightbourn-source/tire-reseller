import { test } from "node:test";
import assert from "node:assert/strict";
import { siteLock, safeEqual, isLockExempt, LOCK_USER } from "../lib/siteLock.js";

const PW = "correct-horse-battery";
const ON = { SITE_LOCK: "1", SITE_LOCK_PASSWORD: PW };
const basic = (u, p) => "Basic " + Buffer.from(`${u}:${p}`).toString("base64");
const req = (path, auth) => new Request("https://tirekind.com" + path, { headers: auth ? { authorization: auth } : {} });

test("lock on, no header -> 401 with Basic challenge, no-store, noindex", async () => {
  const r = siteLock(req("/"), ON);
  assert.equal(r.status, 401);
  assert.match(r.headers.get("www-authenticate"), /^Basic realm="TireKind \(pre-launch\)"/);
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.equal(r.headers.get("x-robots-tag"), "noindex");
});

test("wrong password, wrong user, empty password, malformed header -> 401", () => {
  assert.equal(siteLock(req("/browse", basic(LOCK_USER, "nope")), ON).status, 401);
  assert.equal(siteLock(req("/browse", basic("admin", PW)), ON).status, 401);
  assert.equal(siteLock(req("/browse", basic(LOCK_USER, "")), ON).status, 401);
  assert.equal(siteLock(req("/browse", "Basic !!!not-base64"), ON).status, 401);
  assert.equal(siteLock(req("/browse", "Bearer " + PW), ON).status, 401);
  assert.equal(siteLock(req("/browse", "Basic " + Buffer.from("nocolon").toString("base64")), ON).status, 401);
});

test("right credentials pass through (null); passwords containing ':' work", () => {
  assert.equal(siteLock(req("/", basic(LOCK_USER, PW)), ON), null);
  const env = { SITE_LOCK: "1", SITE_LOCK_PASSWORD: "a:b:c" };
  assert.equal(siteLock(req("/", basic(LOCK_USER, "a:b:c")), env), null);
});

test("exempt: webhook, cron, api, robots, favicon, next static/image pass with no auth", () => {
  for (const p of ["/api/stripe/webhook", "/api/webhooks/stripe", "/api/cron/alerts", "/api/health", "/robots.txt", "/favicon.ico", "/_next/static/chunks/a.js", "/_next/image?url=x"]) {
    assert.equal(siteLock(req(p), ON), null, p);
  }
});

test("not exempt: pages, sitemap, lookalike paths", () => {
  for (const p of ["/", "/browse", "/sitemap.xml", "/apiary", "/robots.txt.bak", "/favicon.ico/x", "/_nextish"]) {
    assert.equal(isLockExempt(p.split("?")[0]), false, p);
    assert.equal(siteLock(req(p), ON).status, 401, p);
  }
});

test("SITE_LOCK unset / not '1' -> everything passes", () => {
  assert.equal(siteLock(req("/"), {}), null);
  assert.equal(siteLock(req("/"), { SITE_LOCK: "0", SITE_LOCK_PASSWORD: PW }), null);
  assert.equal(siteLock(req("/"), { SITE_LOCK: "true", SITE_LOCK_PASSWORD: PW }), null);
});

test("SITE_LOCK=1 with no password fails closed, even for a guessed empty/any credential", () => {
  assert.equal(siteLock(req("/"), { SITE_LOCK: "1" }).status, 401);
  assert.equal(siteLock(req("/", basic(LOCK_USER, "")), { SITE_LOCK: "1" }).status, 401);
  assert.equal(siteLock(req("/", basic(LOCK_USER, "x")), { SITE_LOCK: "1", SITE_LOCK_PASSWORD: "" }).status, 401);
});

test("safeEqual: equal, differing length, differing byte, unicode", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abcd"), false);
  assert.equal(safeEqual("abcd", "abc"), false);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("pässword", "pässword"), true);
  assert.equal(safeEqual("", ""), true);
});
