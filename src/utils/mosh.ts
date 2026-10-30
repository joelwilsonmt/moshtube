import { appStore, updateVideoState, setBlendMode, setMix, setMixOsc, setOverlay } from '../store/appStore'
import { checkpoint, withoutHistory } from '../store/history'
import { announce, flashChanged } from '../store/uiStore'
import { BlendModeSchema, OSC_RATES, PatternSchema, type SourceId } from '../store/schema'
import { EFFECTS, randomEffect } from '../fx/effects'
import { PATTERN_LABELS } from '../fx/patterns'
import { loadRandomVideo, randomPoolId } from './youtube'

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

type Change = { id: string; text: string } | null

// Line shows the headline; the full list goes to the tooltip, screen readers and strip flashes
function summarize(scope: string, changes: Change[]) {
    const done = changes.filter((c): c is NonNullable<Change> => !!c)
    if (!done.length) return announce(`${scope} · everything is held`)
    const texts = done.map((c) => c.text)
    const headline = texts.length > 2 ? `${scope} · ${texts.slice(0, 2).join(' · ')} +${texts.length - 2} more` : `${scope} · ${texts.join(' · ')}`
    announce(headline, `${scope} · ${texts.join(' · ')}`)
    flashChanged([...new Set(done.map((c) => c.id))])
}

export const moshVideo = (id: SourceId) => {
    checkpoint(`Mosh ${letter(id)}`)
    const part = moshEffects(id)
    summarize('Mosh', [part ? { id, text: part } : null])
}

export const moshGlobal = () => {
    checkpoint('Mosh')
    summarize('Mosh', SOURCES.map(sourceChange))
}

const sourceChange = (id: SourceId): Change => {
    const text = moshEffects(id)
    return text ? { id, text } : null
}

function moshMix(): Change[] {
    const { locks } = appStore.getState()
    const parts: Change[] = []
    if (!locks.blend) {
        const mode = pick(BlendModeSchema.options)
        setBlendMode(mode)
        parts.push({ id: 'master', text: `Blend: ${mode[0].toUpperCase()}${mode.slice(1)}` })
    }
    if (!locks.mix) {
        setMix(0.35 + Math.random() * 0.65)
        const osc = Math.random() > 0.5
        setMixOsc({ on: osc, rate: pick(OSC_RATES.filter((r) => r >= 4)) })
        parts.push({ id: 'crossfade', text: osc ? 'Crossfade: oscillating' : 'Crossfade: moved' })
    }
    return parts
}

// Output effects ride with the blend under the Master lock
function moshOutput(): Change {
    if (appStore.getState().locks.blend) return null
    const effects = Math.random() < 0.35 ? [randomEffect()] : []
    appStore.setState({ masterEffects: effects })
    return effects.length ? { id: 'master', text: `Output: ${EFFECTS[effects[0].type].label}` } : null
}

const OVERLAY_BLENDS = ['screen', 'overlay', 'difference'] as const

// Mosh Everything reshapes layer C if it's on; Mosh Me Daddy may also switch it on or off
function moshOverlay(canToggle: boolean): Change {
    const overlay = appStore.getState().overlay
    if (overlay.hold) return null
    const look = { blend: pick(OVERLAY_BLENDS), opacity: 0.3 + Math.random() * 0.4 }
    if (overlay.kind === 'media') {
        setOverlay(look)
        return { id: 'overlay', text: 'C: remixed' }
    }
    const on = canToggle ? Math.random() < 0.5 : overlay.kind === 'pattern'
    if (!on) {
        if (overlay.kind === 'off') return null
        setOverlay({ kind: 'off' })
        return { id: 'overlay', text: 'C: off' }
    }
    const pattern = pick(PatternSchema.options)
    setOverlay({ ...look, kind: 'pattern', pattern, hue: Math.round(Math.random() * 360) })
    return { id: 'overlay', text: `C: ${PATTERN_LABELS[pattern]}` }
}

export const moshEverything = () => {
    checkpoint('Mosh Everything')
    summarize('Mosh Everything', [...SOURCES.map(sourceChange), ...moshMix(), moshOverlay(false), moshOutput()])
}

export const moshMeDaddy = () => {
    checkpoint('Mosh Me Daddy')
    // Effects apply now; videos swap in once a playable pick is confirmed
    const parts = [...SOURCES.map(sourceChange), ...moshMix(), moshOverlay(true), moshOutput()]
    const loop = { start: 15, end: -5, loop: true } // end -5 signals "Duration - 5s"
    const swapped = SOURCES.filter((id) => !appStore.getState()[id].hold)
    swapped.forEach((id) => void loadRandomVideo(id, loop))
    const videos: Change[] = swapped.map((id) => ({ id, text: `New video ${letter(id)}` }))
    summarize('Mosh Me Daddy', [...videos, ...parts])
}

// A first visit opens on a happy accident instead of a fixed default pair
export function rollFreshMix() {
    withoutHistory(() => {
        for (const id of SOURCES) {
            updateVideoState(id, { id: randomPoolId(id), start: 15, end: -5, loop: true, lastInteraction: Date.now() })
            moshEffects(id)
        }
        moshMix()
        moshOverlay(true)
        moshOutput()
    })
    announce('Fresh random mix. Hit Mosh Me Daddy for another.')
}
