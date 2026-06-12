import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { generateQuestion } from "@/lib/question-generator";
import { upsertProblem } from "@/lib/store";
import type { Difficulty } from "@/lib/types";

const difficulties: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const topic = String(body.topic ?? "Algorithms").trim();
  const difficulty = difficulties.includes(body.difficulty) ? body.difficulty : "MEDIUM";
  const generated = await generateQuestion(topic, difficulty);
  const problem = await upsertProblem(user.id, { ...generated, status: "TODO" });

  return NextResponse.json({ problem });
}
