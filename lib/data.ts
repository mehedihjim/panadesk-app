"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Entry = {
  id: string;
  worker: string;
  pana: string;
  amount: number;
  type: "add" | "subtract";
  createdAt: number;
};
export type User = { name: string; lastActive: number; online: boolean };
export type Totals = Record<string, { total: number }>;

const ONLINE_MS = 90_000;
const HEARTBEAT_MS = 30_000;

const slotPath = (g: string, s: string) => `gamedays/${g}/slots/${s}`;

export function useSlotTotals(gamedayId: string, slotId: string) {
  const [totals, setTotals] = useState<Totals>({});
  useEffect(() => {
    setTotals({});
    return onSnapshot(
      collection(db, `${slotPath(gamedayId, slotId)}/totals`),
      (snap) => {
        const next: Totals = {};
        snap.forEach((d) => (next[d.id] = { total: d.data().total ?? 0 }));
        setTotals(next);
      },
    );
  }, [gamedayId, slotId]);
  return totals;
}

export function useRecentEntries(gamedayId: string, slotId: string) {
  const [entries, setEntries] = useState<Entry[]>([]);
  useEffect(() => {
    setEntries([]);
    const q = query(
      collection(db, `${slotPath(gamedayId, slotId)}/entries`),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    return onSnapshot(q, (snap) => {
      setEntries(
        snap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            worker: x.worker,
            pana: x.pana,
            amount: x.amount,
            type: x.type,
            createdAt:
              (x.createdAt as Timestamp | null)?.toMillis() ?? Date.now(),
          };
        }),
      );
    });
  }, [gamedayId, slotId]);
  return entries;
}

export function usePresence(worker: string) {
  useEffect(() => {
    const ref = doc(db, "presence", encodeURIComponent(worker));
    const beat = () =>
      setDoc(
        ref,
        {
          name: worker,
          lastActive: serverTimestamp(),
          expireAt: Timestamp.fromMillis(Date.now() + 24 * 3600_000),
        },
        { merge: true },
      ).catch(() => {});
    beat();
    const id = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [worker]);
}

export function useActiveUsers(gamedayId: string) {
  void gamedayId;
  const [raw, setRaw] = useState<{ name: string; lastActive: number }[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "presence"), (snap) => {
      setRaw(
        snap.docs.map((d) => ({
          name: d.data().name as string,
          lastActive:
            (d.data().lastActive as Timestamp | null)?.toMillis() ?? Date.now(),
        })),
      );
    });
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      unsub();
      clearInterval(tick);
    };
  }, []);

  return raw
    .map((u): User => ({ ...u, online: now - u.lastActive < ONLINE_MS }))
    .filter((u) => u.online);
}

export async function addEntry(input: {
  slotId: string;
  pana: string;
  amount: number;
  type: "add" | "subtract";
  worker: string;
}) {
  const res = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error ?? "Unable to save entry.");
  }
}