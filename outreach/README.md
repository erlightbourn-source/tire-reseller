# TireTrader — Founding-Seller Outreach Assets
**By:** Marcus (Creative Director) · **Date:** 2026-07-23 · For Miles' Broward seller recruiting.

The "Why list on TireTrader" one-pager (from Miles' outreach script #5), designed to the live app's
brutalist brand (pure black `#000` + acid yellow `#e5ff00`, Courier mono headers, Georgia body,
square edges, hard offset shadows). Handed to a Type-A tire shop in person / left behind after a call.

## Files
| File | Use |
|------|-----|
| `TireTrader-FoundingSeller-OnePager-PRINT.pdf` | **Leave-behind.** Printer-friendly — mostly white paper, black ink, one acid-yellow spot, black QR. Letter portrait, 1 page. |
| `TireTrader-FoundingSeller-OnePager-DIGITAL.pdf` | **Email attachment.** Full dark brutalist (black bg, acid yellow). Letter portrait, 1 page. |
| `TireTrader-FoundingSeller-OnePager-DIGITAL.png` | **DM / inline / iMessage.** Same as digital PDF, 2× raster. |
| `onepager-print.html` / `onepager-digital.html` | Editable source. Re-render with the command below. |
| `assets/qr-print.svg` / `assets/qr-dark.svg` | Vector QR (→ `https://shoptiretrader.com`), black / acid-yellow. |

## Pricing shown (Miles' 2026-07-23 lock — supersedes the stale script-#5 draft)
- Free to list during launch, no card.
- First 25 Founding Sellers lock **$10/mo for life** once billing turns on.
- Everyone after: **$25/mo**.
> ⚠️ The old one-pager in `tiretrader-outreach-scripts.md` §5 still says "free for a year, then $10/mo" —
> that is now stale; this asset uses the locked model. Update the script to match.

## Two flags before printing / sending (verify by observation)
1. **URL / QR target.** QR resolves to `https://shoptiretrader.com` (live 200 today, safe front door).
   The deep link `/founding-seller` is **not yet deployed to that domain** (weekend Vercel cutover pending,
   per Dev 2026-07-23). Once the founding-seller page is confirmed live at its final URL, re-point the QR
   (`assets/qr-*.svg` via `segno`) and reprint. Don't print a QR to a page that 404s.
2. **"Ask for Evan" + `TireTrader1@outlook.com`** are placeholders — confirm the rep name / contact Miles
   wants on the leave-behind.

## Re-render
```bash
cd outreach
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --no-pdf-header-footer \
  --print-to-pdf=TireTrader-FoundingSeller-OnePager-PRINT.pdf "file://$PWD/onepager-print.html"
```

## Still open (from the creative redline)
Outreach was the last item; the 3 landing-page P0s are handled (Miles resolved pricing; badge + empty-state
CTA passed to Dev). Design intent unchanged: flat 2-tone founding badge (no AI gradient), footage/proof-first,
honest "you get paid directly, in person — not escrow" footer.
