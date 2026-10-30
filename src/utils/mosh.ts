import { appStore, updateVideoState, setBlendMode, setMix, setMixOsc, setOverlay } from '../store/appStore'
import { checkpoint, historyStore, onRestore, withoutHistory } from '../store/history'
import { announce, flashChanged } from '../store/uiStore'
import { BlendModeSchema, OSC_RATES, PatternSchema, type EffectType, type SourceId } from '../store/schema'
import { BLEND_LABELS } from '../components/options'
import { EFFECTS, MAX_EFFECTS, randomEffect } from '../fx/effects'
import { PATTERN_LABELS } from '../fx/patterns'
import { BUILT_IN_LOTTIES, isBuiltInLottie, LOTTIE_LABELS } from '../fx/lotties'
import { loadRandomVideo, randomPoolId, videoErrorStore } from './youtube'
import { swapBusy, swapStore } from '../engine/swap'
import { isCompact } from './config'

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]
const SOURCES: SourceId[] = ['videoA', 'videoB']
const letter = (id: SourceId) => (id === 'videoA' ? 'A' : 'B')

// Returns a short description for the status line, or null if the layer is locked
function moshEffects(id: SourceId) {
    const { hold, effects: current } = appStore.getState()[id]
    if (hold) return null
    // Locked effects (anything added by hand) stay exactly as they are
    const kept = current.filter((e) => e.keep)
    const room = Math.max(0, MAX_EFFECTS - kept.length)
    const rolls = Math.min(room, Math.random() < 0.3 ? 2 : 1)
    const fresh: typeof current = []
    for (let i = 0; i < rolls; i++) fresh.push(randomEffect([...kept, ...fresh].map((e) => e.type)))
    const effects = [...kept, ...fresh]
    updateVideoState(id, { effects })
    return `${letter(id)}: ${effects.map((e) => EFFECTS[e.type].label + (e.keep ? ' (locked)' : '')).join(' + ')}`
}

type Change = { id: string; text: string } | null

// Line shows the headline; the full list goes to the tooltip, screen readers and strip flashes
function summarize(scope: string, changes: Change[]) {
    const done = changes.filter((c): c is NonNullable<Change> => !!c)
    if (!done.length) return announce(`${scope} · everything is locked`)
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
        const before = appStore.getState().blendMode
        const mode = pick(BlendModeSchema.options)
        setBlendMode(mode)
        if (mode !== before) parts.push({ id: 'master', text: `Blend: ${BLEND_LABELS[mode]}` })
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
    // With Layer C on, skip output effects that flatten everything, so the videos stay readable
    const heavy: EffectType[] = appStore.getState().overlay.kind !== 'off' ? ['threshold', 'xray', 'ink', 'posterize', 'duotone', 'solarize'] : []
    const effects = Math.random() < 0.35 ? [randomEffect(heavy)] : []
    appStore.setState({ masterEffects: effects })
    return effects.length ? { id: 'master', text: `Output: ${EFFECTS[effects[0].type].label}` } : null
}

const OVERLAY_BLENDS = ['screen', 'overlay', 'difference'] as const

// Mosh Everything reshapes layer C if it's on; Mosh Me Daddy may also switch it on or off
function moshOverlay(canToggle: boolean): Change {
    const overlay = appStore.getState().overlay
    if (overlay.hold) return null
    // Random rolls keep Layer C a garnish (25–45%); set by hand it can go anywhere
    const look = { blend: pick(OVERLAY_BLENDS), opacity: 0.25 + Math.random() * 0.2 }
    // Someone's own video or Lottie link is kept; only its look changes
    if (overlay.kind === 'media' || (overlay.kind === 'lottie' && !isBuiltInLottie(overlay.lottie))) {
        setOverlay(look)
        return { id: 'overlay', text: 'C: remixed' }
    }
    const on = canToggle ? Math.random() < 0.5 : overlay.kind !== 'off'
    if (!on) {
        if (overlay.kind === 'off') return null
        setOverlay({ kind: 'off' })
        return { id: 'overlay', text: 'C: off' }
    }
    const hue = Math.round(Math.random() * 360)
    if (Math.random() < 0.35) {
        const lottie = pick(BUILT_IN_LOTTIES)
        setOverlay({ ...look, kind: 'lottie', lottie, hue, loopBeats: pick([2, 4, 8]) })
        return { id: 'overlay', text: `C: ${LOTTIE_LABELS[lottie]}` }
    }
    const pattern = pick(PatternSchema.options)
    setOverlay({ ...look, kind: 'pattern', pattern, hue })
    return { id: 'overlay', text: `C: ${PATTERN_LABELS[pattern]}` }
}

export const moshEverything = () => {
    checkpoint('Mosh Everything')
    summarize('Mosh Everything', [...SOURCES.map(sourceChange), ...moshMix(), moshOverlay(false), moshOutput()])
}

// Mosh Me Daddy lands as one drop: the new look waits until the new videos start fading
// in, so effects never play over the outgoing clips first
const DROP_MAX_MS = 15_000
let drop: { ids: SourceId[]; look: () => Change[]; stop: () => void } | null = null

function cancelDrop() {
    drop?.stop()
    drop = null
}
// Undo, or any hand edit, during the wait means the user has taken over
historyStore.subscribe(cancelDrop)
onRestore(cancelDrop)

const arrived = (id: SourceId) => {
    const swap = swapStore.getState()
    return !!videoErrorStore.getState()[id] || (!swap.picking[id] && swap.showing[id] === appStore.getState()[id].id)
}

function landDrop() {
    if (!drop) return
    const { ids, look } = drop
    cancelDrop()
    summarize('Mosh Me Daddy', [...ids.map((id) => ({ id, text: `New video ${letter(id)}` })), ...look()])
}

export const moshMeDaddy = () => {
    checkpoint('Mosh Me Daddy')
    cancelDrop()
    const look = () => [...SOURCES.map(sourceChange), ...moshMix(), moshOverlay(true), moshOutput()]
    const unlocked = SOURCES.filter((id) => !appStore.getState()[id].hold)
    // A source still loading keeps its incoming video (no queued loads); the drop waits for it
    const busy = unlocked.filter((id) => swapBusy(id, !!videoErrorStore.getState()[id]))
    const loop = { start: 15, end: -5, loop: true } // end -5 signals "Duration - 5s"
    unlocked.filter((id) => !busy.includes(id)).forEach((id) => void loadRandomVideo(id, loop))
    if (!unlocked.length) return summarize('Mosh Me Daddy', look())

    announce(`Mosh Me Daddy · loading new video${unlocked.length > 1 ? 's' : ''}…`)
    const check = () => drop?.ids.every(arrived) && landDrop()
    const timer = setTimeout(landDrop, DROP_MAX_MS)
    const unsubSwap = swapStore.subscribe(check)
    const unsubError = videoErrorStore.subscribe(check)
    drop = { ids: unlocked, look, stop: () => { clearTimeout(timer); unsubSwap(); unsubError() } }
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
    announce(isCompact() ? 'Fresh random mix. Tap the video for another.' : 'Fresh random mix. Press 3 or Mosh Me Daddy for another.', undefined, true)
}
