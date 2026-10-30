import { createStore } from 'zustand/vanilla'
import { appStore, setAutoMosh, setMix, setOutputPlaying, setOverlay } from '../store/appStore'
import { announce } from '../store/uiStore'
import { moshEverything, moshGlobal, moshMeDaddy } from '../utils/mosh'
import { tap } from './tempo'

// Web MIDI "learn" mapping: pick a target, move a control, done.
// Continuous targets take a CC (0-127); triggers fire on note-on or a CC crossing 64.

interface TargetDef {
    label: string
    continuous: boolean
    apply: (value: number) => void // 0..1 for continuous targets
}

export const MIDI_TARGETS = {
    crossfade: { label: 'Crossfade', continuous: true, apply: (v: number) => setMix(v) },
    overlayOpacity: { label: 'Layer C opacity', continuous: true, apply: (v: number) => setOverlay({ opacity: v }) },
    mosh: { label: 'Mosh', continuous: false, apply: () => moshGlobal() },
    everything: { label: 'Mosh Everything', continuous: false, apply: () => moshEverything() },
    daddy: { label: 'Mosh Me Daddy', continuous: false, apply: () => moshMeDaddy() },
    tap: { label: 'Tap tempo', continuous: false, apply: () => tap() },
    play: { label: 'Play / pause', continuous: false, apply: () => setOutputPlaying(!appStore.getState().outputPlaying) },
    auto: { label: 'Auto-mosh on/off', continuous: false, apply: () => setAutoMosh({ on: !appStore.getState().autoMosh.on }) },
} satisfies Record<string, TargetDef>

export type MidiTarget = keyof typeof MIDI_TARGETS

interface Binding {
    kind: 'cc' | 'note'
    channel: number
    number: number
}

interface MidiState {
    status: 'idle' | 'connecting' | 'ready' | 'denied'
    inputs: string[]
    learning: MidiTarget | null
    bindings: Partial<Record<MidiTarget, Binding>>
}

const KEY = 'moshtube:midi'

function loadBindings(): MidiState['bindings'] {
    try {
        return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}
    } catch {
        return {}
    }
}

export const midiStore = createStore<MidiState>(() => ({ status: 'idle', inputs: [], learning: null, bindings: loadBindings() }))

midiStore.subscribe((s, prev) => {
    if (s.bindings === prev.bindings) return
    try {
        localStorage.setItem(KEY, JSON.stringify(s.bindings))
    } catch { /* mappings last for this session only */ }
})

export const midiSupported = () => typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator

const lastCc = new Map<string, number>()

export function handleMidiMessage(e: Pick<MIDIMessageEvent, 'data'>) {
    const data = e.data
    if (!data || data.length < 3) return
    const [statusByte, number, value] = data
    const type = statusByte & 0xf0
    const channel = statusByte & 0x0f
    const kind = type === 0xb0 ? 'cc' : type === 0x90 && value > 0 ? 'note' : null
    if (!kind) return

    const { learning, bindings } = midiStore.getState()
    if (learning) {
        midiStore.setState({ learning: null, bindings: { ...bindings, [learning]: { kind, channel, number } } })
        announce(`${MIDI_TARGETS[learning].label} mapped to ${kind === 'cc' ? 'CC' : 'note'} ${number} (channel ${channel + 1})`)
        return
    }

    for (const [target, b] of Object.entries(bindings) as [MidiTarget, Binding][]) {
        if (b.kind !== kind || b.channel !== channel || b.number !== number) continue
        const def: TargetDef = MIDI_TARGETS[target]
        if (def.continuous) {
            def.apply(value / 127)
        } else if (kind === 'note') {
            def.apply(1)
        } else {
            // A button sending CC: fire once when it crosses into the upper half
            const key = `${channel}:${number}`
            const before = lastCc.get(key) ?? 0
            lastCc.set(key, value)
            if (before < 64 && value >= 64) def.apply(1)
        }
    }
}

export async function connectMidi() {
    if (!midiSupported()) return
    midiStore.setState({ status: 'connecting' })
    try {
        const access = await navigator.requestMIDIAccess()
        const attach = () => {
            const names: string[] = []
            access.inputs.forEach((input) => {
                input.onmidimessage = handleMidiMessage
                names.push(input.name ?? 'MIDI device')
            })
            midiStore.setState({ status: 'ready', inputs: names })
        }
        access.onstatechange = attach
        attach()
    } catch {
        midiStore.setState({ status: 'denied' })
    }
}

// Lets the mapping logic be exercised without hardware during development
if (import.meta.env.DEV) Object.assign(window, { __moshMidi: handleMidiMessage, __moshMidiStore: midiStore })

export const learn = (target: MidiTarget | null) => midiStore.setState({ learning: target })

export const clearBinding = (target: MidiTarget) =>
    midiStore.setState((s) => {
        const bindings = { ...s.bindings }
        delete bindings[target]
        return { bindings }
    })
