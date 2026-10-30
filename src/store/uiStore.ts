import { createStore } from 'zustand/vanilla'

// Interface-only state: never serialized, never undone
export type Selection = 'videoA' | 'videoB' | 'overlay' | 'master'

const params = new URLSearchParams(window.location.search)

export const uiStore = createStore(() => ({
  selected: 'videoA' as Selection,
  // Shared links (?view=1) open stage-first until the visitor chooses to remix
  viewer: params.has('view') && !params.has('output'),
  status: null as { text: string; at: number } | null,
}))

export function enterMixer() {
  uiStore.setState({ viewer: false })
  const url = new URL(window.location.href)
  url.searchParams.delete('view')
  window.history.replaceState(null, '', url.toString())
}

export const select = (selected: Selection) => uiStore.setState({ selected })

// Short-lived message in the top bar (and the screen-reader live region)
export const announce = (text: string) => uiStore.setState({ status: { text, at: Date.now() } })
