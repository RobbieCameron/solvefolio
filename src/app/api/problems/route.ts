import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { updateProblemStatus, upsertProblem } from "@/lib/store";
import type { Difficulty, ProblemStatus } from "@/lib/types";

const statuses: ProblemStatus[] = ["TODO", "SOLVING", "SOLVED"];
const difficulties: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const topic = String(body.topic ?? "").trim();
  const prompt = String(body.prompt ?? "").trim();
  const difficulty = difficulties.includes(body.difficulty) ? body.difficulty : "MEDIUM";

  if (!title || !topic || !prompt) {
    return NextResponse.json({ error: "Title, topic, and prompt are required." }, { status: 400 });
  }

  const problem = await upsertProblem(user.id, {
    title,
    topic,
    prompt,
    difficulty,
    status: statuses.includes(body.status) ? body.status : "TODO",
    solution: String(body.solution ?? "")
  });

  return NextResponse.json({ problem }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  if (!body.id || !statuses.includes(body.status)) {
    return NextResponse.json({ error: "Problem id and valid status are required." }, { status: 400 });
  }

  const problem = await updateProblemStatus(user.id, String(body.id), body.status);
  return NextResponse.json({ problem });
}
