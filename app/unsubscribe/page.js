import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata = { title: "Unsubscribe — TireTrader", robots: { index: false } };
export const dynamic = "force-dynamic";

// GET landing page from the email link — NO mutation here (so a mail scanner or
// link-prefetcher can't unsubscribe anyone). The actual delete happens only when
// the user submits this form (POST → /api/email-alerts/unsubscribe).
export default async function UnsubscribePage({ searchParams }) {
  const { token } = await searchParams;
  const alert = token
    ? await prisma.emailAlert.findFirst({ where: { token: String(token) }, select: { label: true } })
    : null;

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="text-4xl">🛞</span>
      <h1 className="mt-3 font-display text-2xl font-bold text-white">Unsubscribe from alerts?</h1>
      {alert ? (
        <>
          <p className="mt-1 text-sm text-slate-400">
            Stop emails for <span className="font-semibold text-slate-200">{alert.label}</span>.
          </p>
          <form method="POST" action="/api/email-alerts/unsubscribe" className="mt-5">
            <input type="hidden" name="token" value={String(token)} />
            <button type="submit" className="btn-primary">Unsubscribe</button>
          </form>
          <Link href="/browse" className="mt-3 inline-block text-sm text-slate-400 hover:text-slate-200">
            Keep my alerts
          </Link>
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-400">This unsubscribe link is invalid or has already been used.</p>
      )}
    </div>
  );
}
