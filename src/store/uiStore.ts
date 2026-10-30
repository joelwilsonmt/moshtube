import { createStore } from 'zustand/vanilla'
import { isCompact } from '../utils/config'

// Interface-only state: never serialized, never undone
export type Selection = 'videoA' | 'videoB' | 'overlay' | 'master'

const params = new URLSearchParams(window.location.search)

export const uiStore = createStore(() => ({
  selected: 'videoA' as Selection,
  // Shared links (?view=1) open stage-first until the visitor chooses to remix
  viewer: params.has('view') && !params.has('output'),
  status: null as { text: string; detail?: string; at: number; sticky?: boolean } | null,
  // Strips the last randomizer touched, so they can flash
  changed: { ids: [] as string[], at: 0 },
}))

export function enterMixer() {
  uiStore.setState({ viewer: false })
  const url = new URL(window.location.href)
  url.searchParams.delete('view')
  window.history.replaceState(null, '', url.toString())
  announce(isCompact() ? 'Tap the video for a new mix.' : 'You are in the mixer. Press 3 for a new mix, or pick a strip to change it.', undefined, true)
  // Land keyboard focus on the randomizers once the mixer has rendered
  requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById('mosh')?.focus()))
}

export const select = (selected: Selection) => uiStore.setState({ selected })

// Short-lived message in the top bar (and the screen-reader live region).
// `detail` is the full version: tooltip and screen readers get it, the line shows `text`.
// `sticky` keeps it up until the next message (first-visit and Remix guidance)
export const announce = (text: string, detail?: string, sticky = false) => uiStore.setState({ status: { text, detail, sticky, at: Date.now() } })

export const flashChanged = (ids: string[]) => uiStore.setState({ changed: { ids, at: Date.now() } })
