import { createStore } from 'zustand/vanilla'

// Interface-only state: never serialized, never undone
export type Selection = 'videoA' | 'videoB' | 'master'

export const uiStore = createStore(() => ({
  selected: 'videoA' as Selection,
  status: null as { text: string; at: number } | null,
}))

export const select = (selected: Selection) => uiStore.setState({ selected })

// Short-lived message in the top bar (and the screen-reader live region)
export const announce = (text: string) => uiStore.setState({ status: { text, at: Date.now() } })
