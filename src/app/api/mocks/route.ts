import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { finishMockInterview, startMockInterview } from "@/lib/coach";
import { completeMockInterview, createMockInterview } from "@/lib/store";
import type { CompanyTrack } from "@/lib/types";

const companies: CompanyTrack[] = ["Google", "Meta", "Amazon", "Palantir"];

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const topic = String(body.topic ?? "Graphs").trim();
  const company = companies.includes(body.company) ? body.company : undefined;
  const mock = await createMockInterview(user.id, startMockInterview(topic, company));
  return NextResponse.json({ mock });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const answers = Array.isArray(body.answers) ? body.answers.map(String) : [];
  if (!body.id || answers.length === 0) {
    return NextResponse.json({ error: "Mock id and answers are required." }, { status: 400 });
  }

  const result = finishMockInterview(answers);
  const mock = await completeMockInterview(user.id, String(body.id), answers, result.feedback, result.score);
  return NextResponse.json({ mock });
}
