"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/track";
import { useTurnstile } from "@/components/useTurnstile";

// Founding-seller "talk first" form: name + one way to reach them. Posts to /api/founding-interest.
// Not the newsletter: nothing here touches MailerLite.
export default function FoundingInterestForm() {
  const nameId = useId();
  const contactId = useId();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [company, setCompany] = useState(""); // honeypot, hidden from people
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // The bot check loads only once someone starts typing.
  const { ref: botRef, getToken } = useTurnstile(name.length > 0 || contact.length > 0);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("Add your name or your shop's name.");
    if (!contact.trim()) return setErr("Add an email or a phone number we can reach you at.");
    setBusy(true);
    const turnstileToken = await getToken();
    const res = await fetch("/api/founding-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contact, company, turnstileToken }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res || !res.ok) {
      return setErr(res && res.status < 500 && data.error ? data.error : "That didn't go through. Try again, or tap Claim your spot to sign up directly.");
    }
    track("Founding seller interest", { source: "founding-seller" });
    setDone(true);
  }

  if (done) {
    return (
      <section id="interest" className="card scroll-mt-20 px-6 py-6" aria-live="polite">
        <p className="font-semibold text-emerald-300">
          Got it, thanks. We&apos;ll reach out soon to get your first tires listed. Listing is free during launch.
        </p>
      </section>
    );
  }

  return (
    <section id="interest" className="card scroll-mt-20 px-6 py-6">
      <h2 className="font-display text-xl font-extrabold text-white">Rather talk before you sign up?</h2>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Leave your name and the best way to reach you. We&apos;ll help you list your first tires, free.
      </p>
      <form onSubmit={submit} className="mt-4 max-w-xl space-y-3" noValidate>
        <div>
          <label htmlFor={nameId} className="label">Your name or shop name</label>
          <input id={nameId} type="text" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mike, or Mike's Tire Shop" autoComplete="name" className="input" />
        </div>
        <div>
          <label htmlFor={contactId} className="label">Email or phone</label>
          <input id={contactId} type="text" inputMode="email" required maxLength={160} value={contact} onChange={(e) => setContact(e.target.value)}
            placeholder="you@shop.com or (954) 555-0123" autoComplete="email" className="input" />
        </div>
        {/* Honeypot: real visitors never see or tab to this. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>Company<input type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} /></label>
        </div>
        <div ref={botRef} />
        {err && <p role="alert" className="text-sm text-amber-300">{err}</p>}
        <button disabled={busy} className="btn-primary w-full sm:w-auto">{busy ? "Sending…" : "Count me in"}</button>
        {/* Consent wording = Quinn 2026-10-11, verbatim; version stored as INTEREST_CONSENT_VERSION. Body size, not micro-text. */}
        <p className="text-sm text-slate-300">
          No account and no card needed. By sending this, you agree TireKind may contact you about selling on TireKind by email, or by call or text to the number you give, including texts sent with automated tools. Consent isn&apos;t required to sell on TireKind. Msg &amp; data rates may apply; reply STOP to opt out. See our{" "}
          <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
        </p>
      </form>
    </section>
  );
}
