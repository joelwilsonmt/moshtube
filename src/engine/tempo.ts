import { useEffect } from 'react'
import { appStore, setBpm } from '../store/appStore'
import { announce } from '../store/uiStore'
import type { MoshScope } from '../store/schema'
import { moshEverything, moshGlobal, moshMeDaddy } from '../utils/mosh'
import { beatsNow, resetPhase } from './clock'

const taps: number[] = []
const TAP_RESET_MS = 2000

// Averages the intervals of recent taps; the downbeat lands on the latest tap
export function tap() {
    const now = performance.now()
    if (taps.length && now - taps[taps.length - 1] > TAP_RESET_MS) taps.length = 0
    taps.push(now)
    if (taps.length > 5) taps.shift()
    if (taps.length >= 2) {
        const avg = (taps[taps.length - 1] - taps[0]) / (taps.length - 1)
        setBpm(60000 / avg)
        announce(`Tempo ${appStore.getState().bpm} BPM`)
    }
    resetPhase()
}

export const MOSH_SCOPES: Record<MoshScope, { label: string; run: () => void }> = {
    mosh: { label: 'Mosh', run: moshGlobal },
    everything: { label: 'Mosh Everything', run: moshEverything },
    daddy: { label: 'Mosh Me Daddy', run: moshMeDaddy },
}

// New videos need time to buffer, so Mosh Me Daddy never fires faster than every 4 bars
export const minBarsFor = (scope: MoshScope) => (scope === 'daddy' ? 4 : 1)

// Fires the chosen randomizer on every Nth bar of the beat clock
export function useAutoMosh() {
    useEffect(() => {
        let lastBar: number | null = null
        const timer = setInterval(() => {
            const { autoMosh, outputPlaying } = appStore.getState()
            if (!autoMosh.on || !outputPlaying) {
                lastBar = null
                return
            }
            const every = Math.max(autoMosh.bars, minBarsFor(autoMosh.scope)) * 4
            const bar = Math.floor(beatsNow() / every)
            if (lastBar !== null && bar !== lastBar) MOSH_SCOPES[autoMosh.scope].run()
            lastBar = bar
        }, 50)
        return () => clearInterval(timer)
    }, [])
}
