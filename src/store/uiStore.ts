import { createStore } from 'zustand/vanilla'

// Interface-only state: never serialized, never undone
export type Selection = 'videoA' | 'videoB' | 'overlay' | 'master'

const params = new URLSearchParams(window.location.search)

export const uiStore = createStore(() => ({
  selected: 'videoA' as Selection,
  // Shared links (?view=1) open stage-first until the visitor chooses to remix
  viewer: params.has('view') && !params.has('output'),
  status: null as { text: string; detail?: string; at: number } | null,
  // Strips the last randomizer touched, so they can flash
  changed: { ids: [] as string[], at: 0 },
}))

export function enterMixer() {
  uiStore.setState({ viewer: false })
  const url = new URL(window.location.href)
  url.searchParams.delete('view')
  window.history.replaceState(null, '', url.toString())
}

export const select = (selected: Selection) => uiStore.setState({ selected })

// Short-lived message in the top bar (and the screen-reader live region).
// `detail` is the full version: tooltip and screen readers get it, the line shows `text`.
export const announce = (text: string, detail?: string) => uiStore.setState({ status: { text, detail, at: Date.now() } })

export const flashChanged = (ids: string[]) => uiStore.setState({ changed: { ids, at: Date.now() } })
