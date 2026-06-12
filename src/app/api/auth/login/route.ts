import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { issueSession } from "@/lib/auth";
import { findUserByEmail } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const user = await findUserByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  issueSession({ id: user.id, email: user.email, name: user.name });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
