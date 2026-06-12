import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { gradeInterviewAnswer } from "@/lib/coach";
import { createFeedback, getWorkspace } from "@/lib/store";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const workspace = await getWorkspace(user.id);
  const problem = workspace.problems.find((item) => item.id === String(body.problemId));
  if (!problem) return NextResponse.json({ error: "Problem not found." }, { status: 404 });

  const solution = String(body.solution ?? "").trim();
  const complexity = String(body.complexity ?? "").trim();
  const explanation = String(body.explanation ?? "").trim();
  if (!solution || !complexity || !explanation) {
    return NextResponse.json({ error: "Solution, complexity, and explanation are required." }, { status: 400 });
  }

  const grade = gradeInterviewAnswer({ problem, solution, complexity, explanation });
  const feedback = await createFeedback(user.id, {
    problemId: problem.id,
    solution,
    complexity,
    explanation,
    ...grade
  });
  return NextResponse.json({ feedback });
}
