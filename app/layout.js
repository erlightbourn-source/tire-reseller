import "./globals.css";
import { Inter, Sora } from "next/font/google";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import NavUser from "@/components/NavUser";
import Logo from "@/components/Logo";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "TireTrader — Buy & Sell Tires",
  description:
    "The marketplace built for tire resellers. Browse deals for free; sell for $10/month.",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-9 w-9" />
              <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
                Tire<span className="text-brand-600">Trader</span>
              </span>
            </Link>
            <NavUser
              user={
                user
                  ? { id: user.id, name: user.name, subscriptionStatus: user.subscriptionStatus }
                  : null
              }
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>

        <footer className="mt-8 border-t border-slate-200/70 bg-white/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Logo className="h-7 w-7" />
              <span className="font-display font-bold text-slate-700">TireTrader</span>
            </div>
            <p className="text-sm text-slate-500">
              The marketplace for tire resellers · Buyers browse free · Sellers $10/mo
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
