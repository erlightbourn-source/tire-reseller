import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { userStateOf } from "@/lib/states";

export const dynamic = "force-dynamic";

// Smart entry point:
//  - logged-in users with a home state skip straight to their local listings
//  - everyone else picks a state on the map first
export default async function Home() {
  const user = await getCurrentUser();
  const st = userStateOf(user);
  if (user && st) redirect(`/browse?state=${st}`);
  redirect("/states");
}
