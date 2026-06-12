import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { findUserById } from "./store";

const cookieName = "prep_session";
const secret = process.env.JWT_SECRET || "local-development-secret-change-me";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export function issueSession(user: SessionUser) {
  const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, secret, { expiresIn: "7d" });
  cookies().set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSession() {
  cookies().delete(cookieName);
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, secret) as { sub: string; email: string; name: string };
    const user = await findUserById(payload.sub);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }
  return { user, response: null };
}
