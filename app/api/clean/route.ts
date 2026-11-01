import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
const adminDb = getAdminDb();

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));

  if (!process.env.CLEAN_PASSWORD || password !== process.env.CLEAN_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  try {
    await adminDb.recursiveDelete(adminDb.collection("gamedays"));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
