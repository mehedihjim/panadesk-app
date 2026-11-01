import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { isValidPana } from "@/lib/pana";
import { todayIST } from "@/lib/pana-date";

export const runtime = "nodejs";
const adminDb = getAdminDb();

export async function POST(req: Request) {
  const { slotId, pana, amount, type, worker } = await req.json();

  if (
    typeof slotId !== "string" ||
    typeof pana !== "string" ||
    !isValidPana(pana) ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    !["add", "subtract"].includes(type) ||
    typeof worker !== "string" ||
    !worker.trim()
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const slot = adminDb.doc(`gamedays/${todayIST()}/slots/${slotId}`);
  const totalRef = slot.collection("totals").doc(pana);
  const entryRef = slot.collection("entries").doc();
  const expireAt = Timestamp.fromMillis(Date.now() + 48 * 3600 * 1000);

  try {
    await adminDb.runTransaction(async (tx) => {
      const cur = (await tx.get(totalRef)).data()?.total ?? 0;
      const next = type === "add" ? cur + amount : cur - amount;
      if (next < 0)
        throw new Error("Cannot subtract more than the current total.");

      tx.set(totalRef, { total: next, expireAt }, { merge: true });
      tx.set(entryRef, {
        worker: worker.trim(),
        pana,
        amount,
        type,
        createdAt: FieldValue.serverTimestamp(),
        expireAt,
      });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
