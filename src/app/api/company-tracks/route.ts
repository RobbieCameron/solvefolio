import { NextResponse } from "next/server";
import { buildCompanyTrack } from "@/lib/coach";
import { requireUser } from "@/lib/auth";
import { createDrillSet } from "@/lib/store";
import type { CompanyTrack } from "@/lib/types";

const companies: CompanyTrack[] = ["Google", "Meta", "Amazon", "Palantir"];

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  if (!companies.includes(body.company)) {
    return NextResponse.json({ error: "Choose a supported company track." }, { status: 400 });
  }

  const requested = buildCompanyTrack(body.company);
  const drills = await createDrillSet(user.id, requested);
  return NextResponse.json({ drills, skipped: requested.length - drills.length });
}
