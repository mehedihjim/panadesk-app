"use client";

import { useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Circle,
  Plus,
  Users,
  X,
} from "lucide-react";
import {
  addEntry,
  useActiveUsers,
  usePresence,
  useRecentEntries,
  useSlotTotals,
} from "@/lib/data";
import { todayIST } from "@/lib/pana-date";

import type { Entry } from "@/lib/data";
import { getAllPanas, getPanaType, isValidPana } from "@/lib/pana";

const slots = {
  day: [
    ["milan-1", "Milan 1"],
    ["milan-2", "Milan 2"],
    ["rajdhani-1", "Rajdhani 1"],
    ["rajdhani-2", "Rajdhani 2"],
    ["kalyan-1", "Kalyan 1"],
    ["kalyan-2", "Kalyan 2"],
  ],
  night: [
    ["milan-3", "Milan 3"],
    ["milan-4", "Milan 4"],
    ["rajdhani-3", "Rajdhani 3"],
    ["rajdhani-4", "Rajdhani 4"],
    ["kalyan-3", "Kalyan 3"],
    ["kalyan-4", "Kalyan 4"],
  ],
} as const;
const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const ago = (time: number) => {
  const m = Math.max(0, Math.floor((Date.now() - time) / 60000));
  return m < 1 ? "just now" : `${m}m ago`;
};

function NameEntry({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary font-black text-primary-foreground">
            P
          </div>
          <span className="text-xl font-bold tracking-tight">PanaDesk</span>
        </div>
        <p className="mb-2 text-sm font-semibold text-primary">GOOD EVENING</p>
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Who&apos;s collecting?
        </h1>
        <p className="mb-8 text-muted-foreground">
          Enter your name to join today&apos;s live board.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onSave(name.trim());
          }}
          placeholder="Your name"
          className="mb-3 h-14 w-full rounded-xl border border-border bg-card px-4 outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          disabled={!name.trim()}
          onClick={() => onSave(name.trim())}
          className="h-14 w-full rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-40"
        >
          Join the board <ArrowUp className="ml-2 inline size-4 rotate-45" />
        </button>
      </div>
    </main>
  );
}

export default function Page() {
  const [worker, setWorker] = useState("");
  return worker ? (
    <Dashboard worker={worker} />
  ) : (
    <NameEntry onSave={setWorker} />
  );
}

function Dashboard({ worker }: { worker: string }) {
  const [session, setSession] = useState<"day" | "night">("day");
  const [slot, setSlot] = useState("milan-1");
  const [entryOpen, setEntryOpen] = useState(false);
  const [activeOpen, setActiveOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [prefill, setPrefill] = useState("");
  const [toast, setToast] = useState("");
  const gameday = todayIST();
  usePresence(worker);
  const totals = useSlotTotals(gameday, slot);
  const entries = useRecentEntries(gameday, slot);
  const users = useActiveUsers(gameday);
  const selected =
    slots[session].find((s) => s[0] === slot)?.[1] ?? slots[session][0][1];
  const panas = getAllPanas();
  const total = Object.values(totals).reduce((a, v) => a + v.total, 0);
  const max = Math.max(1, ...Object.values(totals).map((v) => v.total));
  const top = useMemo(
    () =>
      panas
        .map((p) => ({ p, total: totals[p]?.total ?? 0 }))
        .filter((x) => x.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
    [panas, totals],
  );

  // Only panas with a bid amount
  const activePanas = useMemo(
    () => panas.filter((p) => (totals[p]?.total ?? 0) > 0),
    [panas, totals],
  );
  const openEntry = (p = "") => {
    setPrefill(p);
    setEntryOpen(true);
  };
  return (
    <main className="min-h-screen pb-24">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-primary font-black text-primary-foreground">
              P
            </div>
            <div>
              <div className="font-bold">PanaDesk</div>
              <div className="text-xs text-muted-foreground">
                Friday, 31 October 2026 · {worker}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <Circle className="size-2.5 fill-primary text-primary" /> Live
            </span>
            <button
              onClick={() => setActivityOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold"
            >
              <Activity className="size-4 text-primary" />
              {entries.length}
            </button>
            <button
              onClick={() => setActiveOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold"
            >
              <Users className="size-4 text-primary" />
              {users.length}
            </button>
            <button
              onClick={() => openEntry()}
              className="hidden items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground md:flex"
            >
              <Plus className="size-4" /> Insert
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">
              Gameday board
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Collection overview
            </h1>
          </div>
          <div className="flex gap-2 rounded-xl bg-card p-1">
            <button
              onClick={() => setSession("day")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${session === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Day
            </button>
            <button
              onClick={() => setSession("night")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${session === "night" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Night
            </button>
          </div>
        </div>
        <div className="mb-5 grid grid-cols-3 gap-2 md:grid-cols-6">
          {slots[session].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSlot(id)}
              className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${slot === id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
            >
              {label}
              <span className="mt-1 block text-xs font-normal opacity-70">
                {slot === id ? "Active" : "Open"}
              </span>
            </button>
          ))}
        </div>
        <div className="mb-6 flex items-end justify-between border-b border-border pb-5">
          <div>
            <p className="text-sm text-muted-foreground">Total in {selected}</p>
            <p className="mt-1 text-3xl font-bold">{money(total)}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <span className="text-primary">●</span> Updates in real time
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold">Pana heatmap</h2>
                  <p className="text-xs text-muted-foreground">
                    {activePanas.length > 0
                      ? "Tap any number to add a collection"
                      : "No bids placed yet — tap Insert to add one"}
                  </p>
                </div>
              </div>
              {activePanas.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Numbers with bids will appear here.
                </p>
              ) : (
                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 2xl:grid-cols-14">
                  {activePanas.map((p) => {
                    const value = totals[p]?.total ?? 0;
                    return (
                      <button
                        aria-label={`Add entry for ${p}`}
                        onClick={() => openEntry(p)}
                        key={p}
                        className="aspect-square rounded-md border border-border/70 p-1 text-center transition hover:border-primary hover:scale-105"
                        style={{
                          backgroundColor: `color-mix(in srgb, var(--primary) ${Math.max(10, Math.round((value / max) * 72))}%, var(--card))`,
                        }}
                      >
                        <span className="block text-[11px] font-bold sm:text-xs">
                          {p}
                        </span>
                        <span className="block truncate text-[9px] text-muted-foreground">
                          {money(value)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
          <aside className="flex flex-col gap-6">
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold">Top numbers</h2>
                  <p className="text-xs text-muted-foreground">
                    Highest collection totals
                  </p>
                </div>
                <Activity className="size-4 text-primary" />
              </div>
              {top.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No collections yet
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {top.map((item, i) => (
                    <div key={item.p}>
                      <div className="mb-1 flex items-center gap-2 text-sm">
                        <span className="w-5 text-xs text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <b>{item.p}</b>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold text-primary">
                          {getPanaType(item.p)}
                        </span>
                        <span className="ml-auto font-semibold">
                          {money(item.total)}
                        </span>
                      </div>
                      <div className="ml-7 h-1 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(item.total / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
      <button
        onClick={() => openEntry()}
        className="fixed bottom-5 right-5 flex size-14 items-center justify-center rounded-full bg-primary text-2xl font-light text-primary-foreground shadow-xl md:hidden"
      >
        <Plus />
      </button>
      {entryOpen && (
        <EntryModal
          worker={worker}
          gameday={gameday}
          slotId={slot}
          slotName={selected}
          prefill={prefill}
          onClose={() => setEntryOpen(false)}
        />
      )}{" "}
      {activeOpen && (
        <ActiveModal
          users={users}
          current={worker}
          onClose={() => setActiveOpen(false)}
        />
      )}
      {activityOpen && (
        <ActivityModal
          entries={entries}
          onClose={() => setActivityOpen(false)}
        />
      )}
    </main>
  );
}

function EntryModal({
  worker,
  gameday,
  slotId,
  slotName,
  prefill,
  onClose,
}: {
  worker: string;
  gameday: string;
  slotId: string;
  slotName: string;
  prefill: string;
  onClose: () => void;
}) {
  const [pana, setPana] = useState(prefill);
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"add" | "subtract">("add");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const totals = useSlotTotals(gameday, slotId);
  const valid = isValidPana(pana);
  const current = totals[pana]?.total ?? 0;
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError("");
    const n = Number(amount);
    if (!valid) return setError("Enter a valid 3-digit pana.");
    if (!Number.isInteger(n) || n <= 0)
      return setError("Amount must be a positive whole number.");
    setSaving(true);
    try {
      await addEntry({ slotId, pana, amount: n, type: kind, worker });
      setAmount("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save entry.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
        <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 sm:rounded-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Insert entry
              </p>
              <h2 className="mt-1 text-xl font-bold">{slotName}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            >
              <X />
            </button>
          </div>
          <label
            className="mb-2 block text-xs font-semibold text-muted-foreground"
            htmlFor="pana"
          >
            Pana number
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              id="pana"
              inputMode="numeric"
              maxLength={3}
              autoFocus
              value={pana}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                setPana(val);
                setError("");
                if (val.length === 3) {
                  // small delay so the badge renders before focus shifts
                  window.setTimeout(() => amountRef.current?.focus(), 50);
                }
              }}
              placeholder="000"
              className="h-16 w-full rounded-xl border border-border bg-background px-4 text-3xl font-bold tracking-[.35em] outline-none focus:ring-2 focus:ring-primary"
            />
            <span
              className={`absolute right-4 top-5 rounded px-2 py-1 text-xs font-bold ${valid ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
            >
              {pana.length === 3
                ? valid
                  ? getPanaType(pana)
                  : "INVALID"
                : "—"}
            </span>
          </div>
          {valid && (
            <p className="mt-2 text-xs text-muted-foreground">
              Current total: <b className="text-foreground">{money(current)}</b>
            </p>
          )}
          <label
            className="mb-2 mt-5 block text-xs font-semibold text-muted-foreground"
            htmlFor="amount"
          >
            Amount
          </label>
          <input
            ref={amountRef}
            id="amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="0"
            className="h-14 w-full rounded-xl border border-border bg-background px-4 text-xl font-semibold outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            <button
              onClick={() => setKind("add")}
              className={`rounded-lg py-3 text-sm font-bold ${kind === "add" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <ArrowUp className="mr-1 inline size-4" /> Add (+)
            </button>
            <button
              onClick={() => setKind("subtract")}
              className={`rounded-lg py-3 text-sm font-bold ${kind === "subtract" ? "bg-destructive/15 text-destructive" : ""}`}
            >
              <ArrowDown className="mr-1 inline size-4" /> Subtract (−)
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm font-medium text-destructive">{error}</p>
          )}
          <div className="mt-5 flex gap-2">
            <button
              onClick={onClose}
              className="h-12 flex-1 rounded-xl border border-border font-semibold"
            >
              Done
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="h-12 flex-[1.5] rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-50"
            >
              Save entry <Check className="ml-1 inline size-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
function ActiveModal({
  users,
  current,
  onClose,
}: {
  users: { name: string; lastActive: number; online: boolean }[];
  current: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Team presence
            </p>
            <h2 className="mt-1 text-xl font-bold">Active users</h2>
          </div>
          <button onClick={onClose}>
            <X className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <div
              key={u.name}
              className="flex items-center gap-3 rounded-xl bg-muted/50 p-3"
            >
              <span
                className={`size-2.5 rounded-full ${u.online ? "bg-primary" : "bg-muted-foreground"}`}
              />
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {u.name}{" "}
                  {u.name === current && (
                    <span className="ml-1 text-xs font-normal text-primary">
                      You
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {u.online ? "Active now" : `Last active ${ago(u.lastActive)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-5 h-11 w-full rounded-xl border border-border font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function ActivityModal({
  entries,
  onClose,
}: {
  entries: Entry[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Live feed
            </p>
            <h2 className="mt-1 text-xl font-bold">Live activity</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity yet.
            </p>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <div
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${e.type === "subtract" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}
                >
                  {e.worker[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    <b>{e.worker}</b>{" "}
                    {e.type === "subtract" ? "subtracted" : "added"}{" "}
                    <b>{e.pana}</b>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ago(e.createdAt)}
                  </p>
                </div>
                <span
                  className={`font-bold ${e.type === "subtract" ? "text-destructive" : "text-foreground"}`}
                >
                  {e.type === "subtract" ? "−" : "+"}
                  {money(e.amount)}
                </span>
              </div>
            ))
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-5 h-11 w-full rounded-xl border border-border font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
}
