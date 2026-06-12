import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser } from "@/lib/store";
import { issueSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");

  if (!email.includes("@") || name.length < 2 || password.length < 8) {
    return NextResponse.json({ error: "Use a valid email, name, and 8+ character password." }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, name, passwordHash });
    issueSession({ id: user.id, email: user.email, name: user.name });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Signup failed" }, { status: 400 });
  }
}
