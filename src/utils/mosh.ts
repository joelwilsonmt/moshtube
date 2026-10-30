import { appStore, updateVideoState, setBlendMode, setMix, setMixOsc, setOverlay } from '../store/appStore'
import { checkpoint } from '../store/history'
import { announce } from '../store/uiStore'
import { BlendModeSchema, OSC_RATES, PatternSchema, type SourceId } from '../store/schema'
import { EFFECTS, randomEffect } from '../fx/effects'
import { PATTERN_LABELS } from '../fx/patterns'
import { loadRandomVideo } from './youtube'

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]
const SOURCES: SourceId[] = ['videoA', 'videoB']
const letter = (id: SourceId) => (id === 'videoA' ? 'A' : 'B')

// Returns a short description for the status line, or null if the layer is held
function moshEffects(id: SourceId) {
    if (appStore.getState()[id].hold) return null
    const effects = Math.random() < 0.3 ? [randomEffect(), randomEffect()] : [randomEffect()]
    updateVideoState(id, { effects })
    return `${letter(id)}: ${effects.map((e) => EFFECTS[e.type].label).join(' + ')}`
}

function summarize(scope: string, parts: (string | null)[]) {
    const changed = parts.filter(Boolean)
    announce(changed.length ? `${scope} · ${changed.join(' · ')}` : `${scope} · everything is held`)
}

export const moshVideo = (id: SourceId) => {
    checkpoint(`Mosh ${letter(id)}`)
    const part = moshEffects(id)
    announce(part ? `Mosh · ${part}` : `Mosh · ${letter(id)} is held`)
}

export const moshGlobal = () => {
    checkpoint('Mosh')
    summarize('Mosh', SOURCES.map(moshEffects))
}

function moshMix() {
    const { locks } = appStore.getState()
    const parts: string[] = []
    if (!locks.blend) {
        const mode = pick(BlendModeSchema.options)
        setBlendMode(mode)
        parts.push(`Blend: ${mode[0].toUpperCase()}${mode.slice(1)}`)
    }
    if (!locks.mix) {
        setMix(0.35 + Math.random() * 0.65)
        const osc = Math.random() > 0.5
        setMixOsc({ on: osc, rate: pick(OSC_RATES.filter((r) => r >= 4)) })
        parts.push(osc ? 'Crossfade: oscillating' : 'Crossfade: moved')
    }
    return parts
}

// Output effects ride with the blend under the Master lock
function moshOutput() {
    if (appStore.getState().locks.blend) return null
    const effects = Math.random() < 0.35 ? [randomEffect()] : []
    appStore.setState({ masterEffects: effects })
    return effects.length ? `Output: ${EFFECTS[effects[0].type].label}` : null
}

const OVERLAY_BLENDS = ['screen', 'overlay', 'difference'] as const

// Mosh Everything reshapes layer C if it's on; Mosh Me Daddy may also switch it on or off
function moshOverlay(canToggle: boolean) {
    const overlay = appStore.getState().overlay
    if (overlay.hold) return null
    const look = { blend: pick(OVERLAY_BLENDS), opacity: 0.3 + Math.random() * 0.4 }
    if (overlay.kind === 'media') {
        setOverlay(look)
        return 'C: remixed'
    }
    const on = canToggle ? Math.random() < 0.5 : overlay.kind === 'pattern'
    if (!on) {
        if (overlay.kind === 'off') return null
        setOverlay({ kind: 'off' })
        return 'C: off'
    }
    const pattern = pick(PatternSchema.options)
    setOverlay({ ...look, kind: 'pattern', pattern, hue: Math.round(Math.random() * 360) })
    return `C: ${PATTERN_LABELS[pattern]}`
}

export const moshEverything = () => {
    checkpoint('Mosh Everything')
    summarize('Mosh Everything', [...SOURCES.map(moshEffects), ...moshMix(), moshOverlay(false), moshOutput()])
}

export const moshMeDaddy = () => {
    checkpoint('Mosh Me Daddy')
    // Effects apply now; videos swap in once a playable pick is confirmed
    const parts = [...SOURCES.map(moshEffects), ...moshMix(), moshOverlay(true), moshOutput()]
    const loop = { start: 15, end: -5, loop: true } // end -5 signals "Duration - 5s"
    const swapped = SOURCES.filter((id) => !appStore.getState()[id].hold)
    swapped.forEach((id) => void loadRandomVideo(id, loop))
    summarize('Mosh Me Daddy', [swapped.length ? `New video: ${swapped.map(letter).join(' + ')}` : null, ...parts])
}
