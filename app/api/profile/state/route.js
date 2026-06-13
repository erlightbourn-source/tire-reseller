import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isStateAbbr } from "@/lib/states";

// Save the logged-in member's home state to their profile.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { state } = await req.json();
  if (!isStateAbbr(state)) return NextResponse.json({ error: "Invalid state." }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { state: state.toUpperCase() },
  });
  return NextResponse.json({ ok: true });
}
