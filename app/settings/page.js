import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AccountSettings from "@/components/AccountSettings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Account settings — TireTrader" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="font-display text-2xl font-extrabold text-white">Settings</h1>
      </div>

      <div className="card p-5">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div><dt className="text-xs text-slate-400">Name</dt><dd className="font-semibold text-slate-100">{user.name}</dd></div>
          <div><dt className="text-xs text-slate-400">Email</dt><dd className="font-semibold text-slate-100">{user.email}</dd></div>
          <div><dt className="text-xs text-slate-400">Account type</dt><dd className="font-semibold text-slate-100">{user.role === "seller" ? "Seller" : "Buyer"}</dd></div>
          <div><dt className="text-xs text-slate-400">Member since</dt><dd className="font-semibold text-slate-100">{new Date(user.createdAt).toLocaleDateString()}</dd></div>
        </dl>
      </div>

      <AccountSettings />
    </div>
  );
}
