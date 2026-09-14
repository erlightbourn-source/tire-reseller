import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

// How many founding seats are taken. Cached 60s like the homepage data; a
// failed query resolves to null so the counter simply disappears — it never
// takes a page down.
const countFounding = unstable_cache(
  async () => prisma.user.count({ where: { foundingSeller: true, deletedAt: null } }),
  ["founding-claimed"],
  { revalidate: 60 }
);

/** @returns {Promise<number|null>} */
export async function getFoundingClaimed() {
  try {
    return await countFounding();
  } catch (err) {
    console.error("[founding] seat count failed:", err?.message || err);
    return null;
  }
}
