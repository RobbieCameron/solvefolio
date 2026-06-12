import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createNote } from "@/lib/store";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const bodyText = String(body.body ?? "").trim();
  const topic = String(body.topic ?? "").trim();

  if (!title || !bodyText || !topic) {
    return NextResponse.json({ error: "Title, topic, and note body are required." }, { status: 400 });
  }

  const note = await createNote(user.id, { title, body: bodyText, topic });
  return NextResponse.json({ note }, { status: 201 });
}
