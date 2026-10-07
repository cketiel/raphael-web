import { NextResponse } from "next/server";
import { getSession } from "@/server/session";

/** Who is signed in. Never returns tokens. */
export async function GET() {
  const session = await getSession();
  if (!session.user || !session.refreshToken) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: session.user });
}
