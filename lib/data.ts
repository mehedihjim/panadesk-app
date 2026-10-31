'use client'

import { useEffect, useSyncExternalStore } from 'react'

export type Entry = { id: string; worker: string; pana: string; amount: number; type: 'add' | 'subtract'; createdAt: number }
export type User = { name: string; lastActive: number; online: boolean }
export type Totals = Record<string, { total: number; count: number }>

type State = { totals: Record<string, Totals>; entries: Record<string, Entry[]>; users: User[] }
const seedEntries: Entry[] = [
  { id: '1', worker: 'Ravi', pana: '123', amount: 500, type: 'add', createdAt: Date.now() - 2 * 60_000 },
  { id: '2', worker: 'Maya', pana: '256', amount: 250, type: 'add', createdAt: Date.now() - 6 * 60_000 },
  { id: '3', worker: 'Ravi', pana: '790', amount: 100, type: 'subtract', createdAt: Date.now() - 11 * 60_000 },
]
const key = (g: string, s: string) => `${g}:${s}`
const state: State = { totals: {}, entries: { [key('today','milan-1')]: seedEntries }, users: [{ name: 'Ravi', lastActive: Date.now(), online: true }, { name: 'Maya', lastActive: Date.now() - 90_000, online: true }, { name: 'Noah', lastActive: Date.now() - 4 * 60_000, online: true }, { name: 'Isha', lastActive: Date.now() - 10 * 60_000, online: false }, { name: 'Dev', lastActive: Date.now() - 20_000, online: true }] }
const listeners = new Set<() => void>()
let version = 0
const emit = () => { version += 1; listeners.forEach((listener) => listener()) }
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }
const snapshot = () => version
const ensureTotals = (k: string) => { if (!state.totals[k]) state.totals[k] = {} ; return state.totals[k] }
for (const entry of seedEntries) { const t = ensureTotals(key('today','milan-1')); t[entry.pana] = { total: (t[entry.pana]?.total ?? 0) + (entry.type === 'add' ? entry.amount : -entry.amount), count: (t[entry.pana]?.count ?? 0) + 1 } }

export function useSlotTotals(gamedayId: string, slotId: string) { useSyncExternalStore(subscribe, snapshot, () => 0); return ensureTotals(key(gamedayId, slotId)) }
export function useRecentEntries(gamedayId: string, slotId: string) { useSyncExternalStore(subscribe, snapshot, () => 0); return (state.entries[key(gamedayId, slotId)] ?? []).slice().sort((a,b) => b.createdAt-a.createdAt).slice(0,20) }
export function useActiveUsers(gamedayId: string) { void gamedayId; useSyncExternalStore(subscribe, snapshot, () => 0); return state.users.filter(u => u.online) }
export function addEntry({ gamedayId, slotId, pana, amount, type, worker }: { gamedayId: string; slotId: string; pana: string; amount: number; type: 'add'|'subtract'; worker: string }) {
  const k = key(gamedayId, slotId); const totals = ensureTotals(k); const current = totals[pana]?.total ?? 0
  if (type === 'subtract' && amount > current) throw new Error('Cannot subtract more than the current total.')
  totals[pana] = { total: current + (type === 'add' ? amount : -amount), count: (totals[pana]?.count ?? 0) + 1 }
  state.entries[k] = [{ id: crypto.randomUUID(), worker, pana, amount, type, createdAt: Date.now() }, ...(state.entries[k] ?? [])].slice(0, 20)
  emit()
}

export function useMockPresence() { useEffect(() => { const id = setInterval(() => { const user = state.users[Math.floor(Math.random() * state.users.length)]; user.online = Math.random() > .25; user.lastActive = Date.now(); emit() }, 9000); return () => clearInterval(id) }, []) }
