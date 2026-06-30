import "./globals.css";
import { Courier_Prime } from "next/font/google";
import Link from "next/link";
import { getCurrentUser, canSell, isAdmin } from "@/lib/auth";
import NavUser from "@/components/NavUser";
import Logo from "@/components/Logo";
import Analytics from "@/components/Analytics";
import { SITE_URL } from "@/lib/site";

// Brutalist headers/monospace; body uses Georgia (system serif) via globals.
const courier = Courier_Prime({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata = {
  // Resolves relative canonical/OG/Twitter image URLs against the real host
  // instead of localhost (set NEXT_PUBLIC_SITE_URL in production).
  metadataBase: new URL(SITE_URL),
  title: "TireTrader — Buy & Sell Tires",
  description:
    "The marketplace built for tire resellers. Browse deals for free; sell for $10/month.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "TireTrader", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport = {
  themeColor: "#070809",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={courier.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <Analytics />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-brand-500 focus:px-3 focus:py-2 focus:text-sm focus:font-bold focus:text-black">
          Skip to content
        </a>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-9 w-9" />
              <span className="font-display text-xl font-extrabold tracking-tight text-white">
                Tire<span className="text-brand-400">Trader</span>
              </span>
            </Link>
            <NavUser
              user={
                user
                  ? { id: user.id, name: user.name, role: user.role, canSell: canSell(user), admin: isAdmin(user) }
                  : null
              }
            />
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>

        <footer className="mt-8 border-t border-white/10 bg-ink-950/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <Logo className="h-7 w-7" />
                <span className="font-display font-bold text-slate-200">TireTrader</span>
              </div>
              <p className="mt-2 max-w-xs text-sm text-slate-400">
                Buy &amp; sell new and used tires with trusted local resellers. Browsing is free.
              </p>
            </div>
            <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3" aria-label="Footer">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Buy</span>
                <Link href="/browse" className="text-slate-300 hover:text-white">Browse tires</Link>
                <Link href="/states" className="text-slate-300 hover:text-white">Browse by state</Link>
                <Link href="/guide" className="text-slate-300 hover:text-white">Buying guide</Link>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Sell</span>
                <Link href="/sell-tires" className="text-slate-300 hover:text-white">Sell tires</Link>
                <Link href="/pro" className="text-slate-300 hover:text-white">Go Pro</Link>
                <Link href="/dashboard" className="text-slate-300 hover:text-white">Seller dashboard</Link>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">More</span>
                <Link href="/app" className="text-slate-300 hover:text-white">📱 Get the app</Link>
                <Link href="/terms" className="text-slate-300 hover:text-white">Terms</Link>
                <Link href="/privacy" className="text-slate-300 hover:text-white">Privacy</Link>
              </div>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
