import { createStore } from 'zustand/vanilla'
import { appStore } from './appStore'
import type { AppState } from './schema'
import { announce } from './uiStore'

// Undo covers discrete actions (mosh, video change, effect add/remove, preset load) and
// each slider gesture as one step; never oscillation or auto-mosh.
const LIMIT = 50

// `label` names the change the snapshot precedes, for "Undid …" announcements
interface Snapshot {
  state: AppState
  label: string
}

export const historyStore = createStore(() => ({ past: [] as Snapshot[], future: [] as Snapshot[] }))

const capture = (): AppState => {
  const s = appStore.getState()
  return { ...s, videoA: { ...s.videoA, seek: undefined }, videoB: { ...s.videoB, seek: undefined } }
}

let last = { label: '', at: 0 }
let suspended = false

// Call before a discrete change so it can be undone. With `coalesce`, repeats of the same
// change within a moment (arrow-key nudges on one slider) collapse into one step.
export function checkpoint(label = 'change', coalesce = false) {
  if (suspended) return
  const now = Date.now()
  if (coalesce && label === last.label && now - last.at < 800) {
    last.at = now
    return
  }
  last = { label, at: now }
  historyStore.setState((h) => ({ past: [...h.past, { state: capture(), label }].slice(-LIMIT), future: [] }))
}

// Runs changes that shouldn't land in history (auto-mosh)
export function withoutHistory(fn: () => void) {
  suspended = true
  try {
    fn()
  } finally {
    suspended = false
  }
}

// Undo point for a slider about to move, named after its label
export function sliderCheckpoint(e: { currentTarget: HTMLInputElement }) {
  const el = e.currentTarget
  const name = el.labels?.[0]?.textContent?.trim() || el.getAttribute('aria-label') || 'slider'
  checkpoint(name.toLowerCase(), true)
}

// Restoring keeps playback state; undo is about the mix, not the transport
function restore(target: AppState) {
  const { outputPlaying } = appStore.getState()
  appStore.setState({ ...target, outputPlaying })
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function undo() {
  const { past, future } = historyStore.getState()
  const prev = past[past.length - 1]
  if (!prev) return announce('Nothing to undo')
  historyStore.setState({ past: past.slice(0, -1), future: [{ state: capture(), label: prev.label }, ...future] })
  restore(prev.state)
  last = { label: '', at: 0 }
  announce(`Undid ${cap(prev.label)}`)
}

export function redo() {
  const { past, future } = historyStore.getState()
  const next = future[0]
  if (!next) return announce('Nothing to redo')
  historyStore.setState({ past: [...past, { state: capture(), label: next.label }], future: future.slice(1) })
  restore(next.state)
  announce(`Redid ${cap(next.label)}`)
}
