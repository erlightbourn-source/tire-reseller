# TireTrader — Founding-Seller / Broward Launch: Creative Red-Line
**By:** Marcus (Creative Director) · **Date:** 2026-07-23 · **Branch reviewed:** `de/founding-seller-20260719`
**Scope (Miles' ask):** founding-seller landing page · Broward city pages · outreach visuals · founding badge.
**Verdict:** Strong foundation — honest schema, real differentiation intent, clean component system. Ship-ready after the **P0** fixes below. Nothing here blocks the deploy; these are content/creative, apply in parallel.

Priority key: **P0** = fix before it's public · **P1** = fix this weekend if time · **P2** = post-launch polish.

---

## 1. Founding-Seller Landing Page — `app/founding-seller/page.js`

**P0 — Pricing story is ambiguous (three numbers, no explainer).** The page shows $0 ("List free today"), $10/mo ("locked forever"), and $25/mo ("normally a Pro upgrade") with no line reconciling them. A seller can't tell what they'd actually pay or when. This is the single biggest conversion leak on the page. Add ONE plain-English line under the hero, e.g.:
> "Listing is free today and stays free. When we introduce paid Pro placement ($25/mo standard), founders keep it free — and if a base membership ever launches, yours is locked at $10/mo. No card required now."
Reconcile the exact model with Miles/Dev before wording it — and confirm it matches the no-Stripe-at-launch reality (nothing should imply a charge today).

**P0 — Show the actual Founding badge on the page.** `FoundingBadge` exists in `components/Badge.js` but never renders here. Sellers are being sold "a permanent badge" they can't see. Drop the real `<FoundingBadge/>` mark into the hero and the perk card so the reward is visual, not just described.

**P1 — Make scarcity real and honest.** Copy leans on "first 25" four times but there's no indicator of how many remain. If we can honestly source a claimed count from `lib/seller.js`, show "Founding spots claimed: X / 25". If we can't source it truthfully at launch, keep it static ("Limited to 25 Broward sellers") — do **not** fake a counter. Honest scarcity converts; invented scarcity is a trust risk (and violates the fleet honesty bar).

**P1 — De-hype the hero.** "Be First, Stay Ahead" is generic marketer-speak; Evan's bar is understated/commercial, no hype. Suggest something concrete and local:
> H1: "The first 25 tire sellers in Broward." · sub: "We're launching TireTrader with a small group of real South Florida sellers — not 2,500. Get in as a founder and the perks don't expire when we grow."

**P1 — Add a 3-line objection strip** (sellers' real questions): *What does it cost? → Free to list. What's the catch? → We want real inventory before we open to buyers. How do I get paid? → Direct from the buyer, in person.* Kills hesitation without a full FAQ page.

**P2 — Tailored OG image.** Page points at the generic `/opengraph-image`; a "Founding Seller — first 25 in Broward" OG lifts share/DM click-through when Miles sends the link. Low effort, real outreach payoff.

---

## 2. Broward City Pages — `app/used-tires/[city]/page.js` + `lib/cities.js` + `app/locations/page.js`

**Keep:** the honest `Service`/`areaServed` schema (no fabricated LocalBusiness address) is exactly right — don't let anyone "upgrade" it to a fake storefront for SEO. Breadcrumbs, canonical, generateStaticParams all clean.

**P1 — Thin-content / doorway risk at 10 near-identical pages.** Every city page is byte-identical except `{name}` and one `note` line. Google's doorway-page filter can suppress the whole set. Add a **second** unique, *verifiable* field per city in `cities.js` — e.g. a one-line local driving context (major corridors / common fitment mix) — and surface it in the intro. Must stay factual (no invented claims); the goal is genuine differentiation, not keyword filler. This is the difference between the SEO play working and getting filtered.

**P0 (launch-timing) — the primary CTA lands on an empty result.** "Browse {city} tires" → `/browse?q=city`, which at launch will be near-empty inventory. First impression = a dead page. Two options: (a) at launch, make **"Set a size alert"** the primary button and demote Browse to secondary; or (b) add a real empty-state on `/browse` ("No {city} tires listed yet — be the first, or set an alert"). Don't send cold traffic to a blank grid on day one.

**P2 — `/locations` "Coming next" is good;** consider showing a small "Broward · 10 cities live" count so the market reads as real, not aspirational.

---

## 3. Founding Badge — `components/Badge.js`

**Keep:** `founding` tone (amber→brand gradient on ink) reads distinct from `pro`, star glyph is clean. Good separation of the launch cohort.
**P2 — watch the synthetic-gradient tell.** Per the fleet HUMAN-NOT-AI standard, uniform gradients can read AI-generated at larger sizes. Badge-scale is fine; if this mark ever gets blown up for outreach graphics, render it flat/2-tone instead of gradient.

---

## 4. Outreach Visuals — **not in the repo; spec below**

There are no seller-outreach creatives on the branch yet (only `marketing-reports/` + the home mockup). For Broward DM/email recruitment, the creative direction:
- **One asset, three concrete perks.** Show the real Founding badge + "Free Pro placement · $10/mo locked for life · We shoot your first listings." No slogans.
- **Local + faceless.** "Broward's first 25 tire sellers" — real tire/shop b-roll or a clean product-on-neutral shot, not stocky AI gloss. Human, understated, proof-first (per fleet content standard).
- **Single CTA** → the founding-seller page (with the tailored OG from P2 so the link unfurls well in a DM).
- Hand me the shop-target list + channel (IG DM / email / in-person card) and I'll produce the actual asset set.

---

## Bottom line for the deploy
Deploy can proceed. Before the pages go *public*, land the three **P0**s: (1) one-line pricing explainer, (2) render the real badge on the landing page, (3) don't point launch CTAs at empty inventory. Everything else is same-weekend polish. I'll turn the outreach visuals the moment I have the target list + channel from Miles.
— Marcus
