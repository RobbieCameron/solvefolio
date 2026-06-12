import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/store";

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const workspace = await getWorkspace(user.id);
  return NextResponse.json(workspace);
}
