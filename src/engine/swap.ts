import { createStore } from 'zustand/vanilla'
import type { SourceId } from '../store/schema'

// Per source: whether its newest video is still loading/fading in, and which video the
// stage is actually showing meanwhile (so the mixer can match the output, not run ahead)
export const swapStore = createStore(() => ({
    loading: { videoA: false, videoB: false } as Record<SourceId, boolean>,
    shown: {} as Partial<Record<SourceId, string>>,
}))

export const setSwap = (id: SourceId, loading: boolean, shown: string | undefined) =>
    swapStore.setState((s) => ({ loading: { ...s.loading, [id]: loading }, shown: { ...s.shown, [id]: shown } }))
