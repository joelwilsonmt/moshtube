import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { SourceId } from '../store/schema'

// Per source: whether its newest video is still loading/fading in, and which video the
// stage is actually showing meanwhile (so the mixer can match the output, not run ahead).
// `picking` covers the embeddability check before a random video reaches the stage;
// `since` is when the source last went busy.
export const swapStore = createStore(() => ({
    loading: { videoA: false, videoB: false } as Record<SourceId, boolean>,
    picking: { videoA: false, videoB: false } as Record<SourceId, boolean>,
    since: { videoA: 0, videoB: 0 } as Record<SourceId, number>,
    shown: {} as Partial<Record<SourceId, string>>,
}))

type SwapState = ReturnType<typeof swapStore.getState>
const busyIn = (s: Pick<SwapState, 'loading' | 'picking'>, id: SourceId) => s.picking[id] || s.loading[id]

// Applies a change and stamps `since` when a source goes from idle to busy
function update(id: SourceId, change: (s: SwapState) => Partial<SwapState>) {
    swapStore.setState((s) => {
        const next = { ...s, ...change(s) }
        return busyIn(next, id) && !busyIn(s, id) ? { ...next, since: { ...s.since, [id]: Date.now() } } : next
    })
}

export const setSwap = (id: SourceId, loading: boolean, shown: string | undefined) =>
    update(id, (s) => ({
        loading: { ...s.loading, [id]: loading },
        // The stage has taken over the wait, so the pick is done
        picking: loading ? { ...s.picking, [id]: false } : s.picking,
        shown: { ...s.shown, [id]: shown },
    }))

export const setPicking = (id: SourceId, picking: boolean) =>
    update(id, (s) => ({ picking: { ...s.picking, [id]: picking } }))

// A video that never starts (stalled network, pasted dead link) must not block swaps for good
const BUSY_MAX_MS = 15_000

// True while a source's next video is being picked or loaded: new random picks wait for it
export function swapBusy(id: SourceId, error: boolean) {
    const s = swapStore.getState()
    return busyIn(s, id) && !error && Date.now() - s.since[id] < BUSY_MAX_MS
}

export function useSwapBusy(id: SourceId, error: boolean) {
    const busy = useStore(swapStore, (s) => busyIn(s, id)) && !error
    const since = useStore(swapStore, (s) => s.since[id])
    const [, expire] = useState(0)
    useEffect(() => {
        if (!busy) return
        const t = setTimeout(() => expire((n) => n + 1), Math.max(0, since + BUSY_MAX_MS - Date.now()))
        return () => clearTimeout(t)
    }, [busy, since])
    return busy && Date.now() - since < BUSY_MAX_MS
}
