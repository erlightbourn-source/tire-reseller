import "server-only";

// Minimal email sender. With no provider configured (the free default) it logs
// to the server console so flows work end-to-end in development. Set
// RESEND_API_KEY (Resend has a free tier) to actually deliver mail in prod.
export async function sendEmail({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "TireTrader <onboarding@resend.dev>",
          to,
          subject,
          text,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  // Dev fallback — no external service required.
  // eslint-disable-next-line no-console
  console.log(`\n[email:dev] → ${to}\nSubject: ${subject}\n${text}\n`);
  return false; // not actually delivered
}

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
}
