"use client";
import { useEffect, useState } from "react";

// Registers the service worker and shows an "Install app" button when the
// browser offers the install prompt (Chrome/Edge/Android). On iOS Safari there's
// no prompt API, so we show Add-to-Home-Screen guidance instead.
export default function InstallApp() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia?.("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else {
      setIosHint(true);
    }
  }

  if (installed) {
    return <p className="text-sm font-semibold text-emerald-300">✓ Installed — open it from your home screen!</p>;
  }

  return (
    <div>
      <button onClick={install} className="btn-accent">
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current"><path d="M10 2a1 1 0 0 1 1 1v8.6l2.3-2.3 1.4 1.4L10 15.4 5.3 10.7l1.4-1.4L9 11.6V3a1 1 0 0 1 1-1Zm-6 14h12v2H4v-2Z" /></svg>
        Install web app
      </button>
      {iosHint && (
        <p className="mt-2 text-xs text-slate-400">
          On iPhone: tap the <strong>Share</strong> button, then <strong>“Add to Home Screen”</strong>.
        </p>
      )}
    </div>
  );
}
