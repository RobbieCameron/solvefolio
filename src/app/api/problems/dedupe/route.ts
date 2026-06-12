import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { dedupeProblems } from "@/lib/store";

export async function POST() {
  const { user, response } = await requireUser();
  if (response) return response;

  const removed = await dedupeProblems(user.id);
  return NextResponse.json({ removed });
}
