import { appStore, updateVideoState, setBlendMode, setMix, setMixOsc } from '../store/appStore'
import { checkpoint } from '../store/history'
import { announce } from '../store/uiStore'
import { BlendModeSchema, OSC_RATES, type SourceId } from '../store/schema'
import { EFFECTS, randomEffect } from '../fx/effects'
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
    checkpoint()
    const part = moshEffects(id)
    announce(part ? `Mosh · ${part}` : `Mosh · ${letter(id)} is held`)
}

export const moshGlobal = () => {
    checkpoint()
    summarize('Mosh', SOURCES.map(moshEffects))
}

function moshMix() {
    const { locks } = appStore.getState()
    const parts: string[] = []
    if (!locks.blend) {
        const mode = pick(BlendModeSchema.options)
        setBlendMode(mode)
        parts.push(`Blend: ${mode}`)
    }
    if (!locks.mix) {
        setMix(0.35 + Math.random() * 0.65)
        const osc = Math.random() > 0.5
        setMixOsc({ on: osc, rate: pick(OSC_RATES.filter((r) => r >= 4)) })
        parts.push(osc ? 'Mix: oscillating' : 'Mix: set')
    }
    return parts
}

export const moshEverything = () => {
    checkpoint()
    summarize('Mosh Everything', [...SOURCES.map(moshEffects), ...moshMix()])
}

export const moshMeDaddy = () => {
    checkpoint()
    // Effects apply now; videos swap in once a playable pick is confirmed
    const parts = [...SOURCES.map(moshEffects), ...moshMix()]
    const loop = { start: 15, end: -5, loop: true } // end -5 signals "Duration - 5s"
    const swapped = SOURCES.filter((id) => !appStore.getState()[id].hold)
    swapped.forEach((id) => void loadRandomVideo(id, loop))
    summarize('Mosh Me Daddy', [swapped.length ? `New video: ${swapped.map(letter).join(' + ')}` : null, ...parts])
}
