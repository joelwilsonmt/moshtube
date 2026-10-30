import { createStore } from 'zustand/vanilla'
import { appStore } from './appStore'
import type { AppState } from './schema'

// Undo covers discrete actions (mosh, video change, effect add/remove, preset load),
// never continuous slider drags or oscillation.
const LIMIT = 50

type Snapshot = AppState

export const historyStore = createStore(() => ({ past: [] as Snapshot[], future: [] as Snapshot[] }))

const snapshot = (): Snapshot => {
  const s = appStore.getState()
  return { ...s, videoA: { ...s.videoA, seek: undefined }, videoB: { ...s.videoB, seek: undefined } }
}

// Call before a discrete change so it can be undone
export function checkpoint() {
  historyStore.setState((h) => ({ past: [...h.past, snapshot()].slice(-LIMIT), future: [] }))
}

// Restoring keeps playback state; undo is about the mix, not the transport
function restore(target: Snapshot) {
  const { outputPlaying } = appStore.getState()
  appStore.setState({ ...target, outputPlaying })
}

export function undo() {
  const { past, future } = historyStore.getState()
  const prev = past[past.length - 1]
  if (!prev) return false
  historyStore.setState({ past: past.slice(0, -1), future: [snapshot(), ...future] })
  restore(prev)
  return true
}

export function redo() {
  const { past, future } = historyStore.getState()
  const next = future[0]
  if (!next) return false
  historyStore.setState({ past: [...past, snapshot()], future: future.slice(1) })
  restore(next)
  return true
}
