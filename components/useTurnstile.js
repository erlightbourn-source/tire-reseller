"use client";
import { useCallback, useEffect, useRef } from "react";

// Browser half of the Turnstile bot check (server half: lib/turnstile.js).
// The site key is public by design (it ships in page HTML). The widget uses
// appearance "interaction-only", so most visitors never see it.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAFSKPV33-cK2Q_i5";
const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const ON = process.env.NODE_ENV === "production" && Boolean(SITE_KEY);

let loader = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.onload = () => resolve(window.turnstile);
      s.onerror = () => { loader = null; reject(new Error("turnstile failed to load")); };
      document.head.appendChild(s);
    });
  }
  return loader;
}

/**
 * useTurnstile(active) → { ref, getToken }
 *  - put <div ref={ref} /> inside the form; the widget renders there once `active`
 *    is true (pass a condition like "the user started typing" for forms that sit on
 *    every page, so the script only loads when someone actually uses the form).
 *  - `await getToken()` before each submit. Tokens are single-use: each call hands
 *    out the current token and resets the widget so the next call gets a fresh one.
 *    Resolves "" in dev or if no token arrives in time (the server then answers 400).
 */
export function useTurnstile(active = true) {
  const ref = useRef(null);
  const widgetId = useRef(null);
  const token = useRef("");
  const waiters = useRef([]);

  useEffect(() => {
    if (!ON || !active) return undefined;
    let cancelled = false;
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !ref.current || widgetId.current != null) return;
        widgetId.current = ts.render(ref.current, {
          sitekey: SITE_KEY,
          theme: "dark",
          size: "flexible",
          appearance: "interaction-only",
          "response-field": false,
          callback: (t) => {
            token.current = t;
            const ws = waiters.current;
            waiters.current = [];
            ws.forEach((w) => w(t));
          },
          "expired-callback": () => { token.current = ""; },
          "error-callback": () => { token.current = ""; },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widgetId.current != null && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch {}
      }
      widgetId.current = null;
      token.current = "";
    };
  }, [active]);

  const getToken = useCallback((timeoutMs = 15_000) => {
    if (!ON) return Promise.resolve("");
    const consume = (t) => {
      token.current = "";
      setTimeout(() => {
        if (widgetId.current != null && window.turnstile) {
          try { window.turnstile.reset(widgetId.current); } catch {}
        }
      }, 0);
      return t;
    };
    if (token.current) return Promise.resolve(consume(token.current));
    return new Promise((resolve) => {
      const done = (t) => { clearTimeout(timer); resolve(consume(t)); };
      const timer = setTimeout(() => {
        waiters.current = waiters.current.filter((w) => w !== done);
        resolve("");
      }, timeoutMs);
      waiters.current.push(done);
    });
  }, []);

  return { ref, getToken };
}
