<p align="center">
  <img src="docs/banner.svg" alt="TireTrader — the marketplace built for tire resellers" width="100%" />
</p>

<h1 align="center">🛞 TireTrader</h1>

<p align="center">
  A marketplace web app for <b>tire resellers</b> — a focused, purpose-built
  alternative to selling tires on Facebook Marketplace.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss&logoColor=white">
  <img alt="Stripe" src="https://img.shields.io/badge/Stripe-test%20mode-635BFF?logo=stripe&logoColor=white">
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-22c55e">
</p>

- **Buyers** browse & search listings and message sellers — **free**.
- **Sellers** pay **$10/month** to list tires, with built-in messaging and an
  activity dashboard.

This is a runnable MVP foundation (web first; mobile app and production deploy
come later).

---

## 🚀 Try it in 3 commands

```bash
git clone https://github.com/erlightbourn-source/tire-reseller.git
cd tire-reseller
npm install && npm run setup && npm run dev
```

Then open **http://localhost:3000** and log in with the demo seller
**`demo@tiretrader.test` / `demo1234`** (or just browse — that's free).

> Requires **Node.js 18+**. Stripe is optional — the app runs a simulated
> checkout until you add your own test keys (see [below](#where-to-add-your-stripe-keys)).

---

## Stack

| Layer       | Choice                                              |
|-------------|-----------------------------------------------------|
| Framework   | **Next.js 14** (App Router) + **React 18**          |
| Styling     | **Tailwind CSS**                                     |
| Database    | **SQLite** via **Prisma ORM** (zero external setup) |
| Auth        | Email/password, **bcrypt** + signed **JWT** cookie  |
| Payments    | **Stripe** Checkout + webhooks (test mode)          |
| Uploads     | Local disk (`/public/uploads`) for the MVP          |

---

## Run it locally (one command)

> Requires **Node.js 18+** and npm.

```bash
npm run setup     # installs nothing — pushes the DB schema + seeds demo data
npm run dev       # start the dev server
```

If this is a fresh clone, run `npm install` first. The full sequence:

```bash
npm install                 # install dependencies
cp .env.example .env        # create your env file (sensible dev defaults included)
npm run setup               # create SQLite DB + seed realistic sample data
npm run dev                 # → http://localhost:3000
```

Then open **http://localhost:3000**.

### Demo accounts (created by the seed)

| Role               | Email                   | Password   |
|--------------------|-------------------------|------------|
| Seller (subscribed)| `demo@tiretrader.test`  | `demo1234` |
| Buyer              | `buyer@tiretrader.test` | `buyer1234`|

The marketplace comes pre-loaded with **14 realistic listings** across multiple
sellers and a **sample buyer↔seller conversation**, so it's explorable instantly.

---

## Where to add your Stripe keys

Stripe is **optional for local dev**. Out of the box the app runs in a simulated
**"dev mode"** — clicking *Subscribe* instantly activates the seller subscription
so you can test the whole gated flow without a Stripe account.

To use **real Stripe (test mode)**, paste your own keys into **`.env`**
(see `.env.example` for step-by-step instructions):

```env
STRIPE_SECRET_KEY="sk_test_..."      # Stripe Dashboard ▸ Developers ▸ API keys
STRIPE_PUBLISHABLE_KEY="pk_test_..." # Stripe Dashboard ▸ Developers ▸ API keys
STRIPE_PRICE_ID="price_..."          # Create a $10/month recurring price, copy its ID
STRIPE_WEBHOOK_SECRET="whsec_..."    # From `stripe listen` (see below)
```

As soon as `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` hold real `sk_test_…` /
`price_…` values, the app automatically switches from dev mode to real Stripe
Checkout. **No real keys are ever hardcoded** — they only live in `.env`
(git-ignored).

### Local webhook testing (real Stripe)

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET in .env, then restart
```

The success page also verifies the Checkout session server-side, so the
subscription activates even if the webhook listener isn't running.

---

## What works end-to-end

- ✅ **Auth** — signup / login / logout (hashed passwords, JWT session cookie).
- ✅ **Subscription gate** — creating listings requires an active seller sub
  (returns HTTP 402 otherwise). Dev-mode + real Stripe both supported.
- ✅ **Listings** — create / edit / delete with brand, size, quantity,
  condition, tread depth, price, location, description, and photo uploads.
- ✅ **Browse & search** — public marketplace with full-text search and filters
  (brand, condition, size, max price, sort).
- ✅ **Messaging** — buyer↔seller threads tied to a listing, with 3s polling and
  unread counts. Access-controlled (only the two participants can read a thread).
- ✅ **Seller dashboard** — listing views, conversation counts, active/sold
  counts, subscription status, and per-listing stats.

### Stubbed / simplified for the MVP

- **Photos** are stored on local disk. Swap for S3/Cloudinary in production.
  (Seed listings use generated SVG placeholder images so it works offline.)
- **Stripe Customer Portal** (self-serve cancel/update card) is not wired up yet;
  subscription status is driven by Checkout + webhooks.
- **Real-time messaging** uses polling, not WebSockets.
- **Email notifications** are not implemented.
- SQLite is great for local/MVP; switch the Prisma datasource to Postgres for
  production scale.

---

## Project layout

```
app/
  page.js                 Marketplace (search + filters)
  listings/[id]/          Listing detail (+ view tracking, message seller)
  sell/                   Create listing (subscription-gated) + /[id]/edit
  subscribe/              $10/mo plan → Stripe Checkout (+ /success)
  dashboard/              Seller activity tracker
  messages/               Inbox + /[threadId] chat (polling)
  login/  signup/         Auth pages
  api/
    auth/                 signup · login · logout
    listings/             create · edit · delete
    threads/              start a buyer↔seller thread
    messages/[threadId]/  poll + send messages
    stripe/               checkout · webhook
    upload/               local photo upload
lib/
  auth.js                 session cookie + password hashing
  db.js                   Prisma client singleton
  stripe.js               Stripe client + "configured?" detection
prisma/
  schema.prisma           User · Listing · Photo · Thread · Message
  seed.js                 demo accounts + 14 listings + sample chat
```

---

## Useful commands

```bash
npm run dev        # dev server (http://localhost:3000)
npm run setup      # prisma db push + seed
npm run db:push    # apply schema to SQLite
npm run db:seed    # (re)seed demo data
npm run build      # production build
npm start          # run the production build
```
