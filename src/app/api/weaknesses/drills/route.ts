import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildWeaknessDrills, detectWeaknesses } from "@/lib/coach";
import { createDrillSet, getWorkspace } from "@/lib/store";

export async function POST() {
  const { user, response } = await requireUser();
  if (response) return response;

  const workspace = await getWorkspace(user.id);
  const weakness = detectWeaknesses(workspace.problems)[0];
  if (!weakness) {
    return NextResponse.json({ error: "No clear weakness found yet. Solve or attempt more drills first." }, { status: 400 });
  }

  const requested = buildWeaknessDrills(weakness.topic);
  const drills = await createDrillSet(user.id, requested);
  return NextResponse.json({ weakness, drills, skipped: requested.length - drills.length });
}
