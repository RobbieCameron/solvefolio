import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createFlashcard } from "@/lib/store";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const front = String(body.front ?? "").trim();
  const back = String(body.back ?? "").trim();
  const topic = String(body.topic ?? "").trim();
  const confidence = Number(body.confidence ?? 2);

  if (!front || !back || !topic) {
    return NextResponse.json({ error: "Front, back, and topic are required." }, { status: 400 });
  }

  const flashcard = await createFlashcard(user.id, { front, back, topic, confidence });
  return NextResponse.json({ flashcard }, { status: 201 });
}
