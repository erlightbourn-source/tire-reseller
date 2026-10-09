// Dependency security floor (L1577). `npm audit --omit=dev` flagged sharp
// (<0.35.5, librsvg CVE GHSA-wq5f-xc86-pv6w) plus miniflare and wrangler,
// which depend on it. This pins the resolved lockfile versions so a stray
// lockfile regeneration cannot quietly reintroduce the vulnerable range.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);

const semverGte = (a, b) => {
  const pa = a.split(/[.-]/).map((x) => parseInt(x, 10));
  const pb = b.split(/[.-]/).map((x) => parseInt(x, 10));
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i];
  }
  return true;
};

test("every resolved sharp is >= 0.35.5 (librsvg CVE fix)", () => {
  const sharps = Object.entries(lock.packages).filter(
    ([path]) => path === "node_modules/sharp" || path.endsWith("/node_modules/sharp"),
  );
  assert.ok(sharps.length > 0, "sharp should be in the lockfile");
  for (const [path, pkg] of sharps) {
    assert.ok(semverGte(pkg.version, "0.35.5"), `${path} is ${pkg.version}`);
  }
});
