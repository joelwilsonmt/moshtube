import { useRef } from 'react'
import { useStore } from 'zustand'
import { Keyboard, Minus, Plus } from 'lucide-react'
import { appStore, setAutoMosh, setBpm } from '../store/appStore'
import { AUTO_MOSH_BARS, MoshScopeSchema, type MoshScope } from '../store/schema'
import { beatsNow } from '../engine/clock'
import { minBarsFor, MOSH_SCOPES, tap } from '../engine/tempo'
import { useFrame } from '../hooks/useLive'
import { SHORTCUTS } from '../hooks/useShortcuts'
import { Button, IconButton, Kbd, Select, Toggle } from './ui/core'

// Four steps of the bar; the current beat lights amber
function BeatLight() {
    const ref = useRef<HTMLDivElement>(null)
    useFrame(() => {
        const el = ref.current
        if (!el) return
        const beat = Math.floor(beatsNow()) % 4
        Array.from(el.children).forEach((dot, i) => {
            ;(dot as HTMLElement).dataset.on = String(i === beat)
        })
    })
    return (
        <div ref={ref} className="flex items-center gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-2 w-2 rounded-full bg-line data-[on=true]:bg-signal" />
            ))}
        </div>
    )
}

export function Tempo() {
    const bpm = useStore(appStore, (s) => s.bpm)
    const auto = useStore(appStore, (s) => s.autoMosh)

    return (
        <div className="flex shrink-0 items-center gap-2">
            <div role="group" aria-label="Tempo" className="flex items-center rounded-md border border-line bg-rack">
                <IconButton size="sm" icon={Minus} label="Slower (1 BPM)" onClick={() => setBpm(Math.round(bpm) - 1)} />
                <label className="flex items-baseline gap-1 px-0.5">
                    <span className="sr-only">Beats per minute</span>
                    <input
                        type="number"
                        min={40} max={240} step={1}
                        value={Math.round(bpm)}
                        onChange={(e) => {
                            const v = parseFloat(e.target.value)
                            if (Number.isFinite(v)) setBpm(v)
                        }}
                        className="w-9 appearance-none bg-transparent text-right text-[13px] font-semibold text-ink [-moz-appearance:textfield] focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[11px] text-dim">BPM</span>
                </label>
                <IconButton size="sm" icon={Plus} label="Faster (1 BPM)" onClick={() => setBpm(Math.round(bpm) + 1)} />
            </div>
            <Button onClick={tap} className="h-7 px-2.5 text-xs" title="Tap along to set the tempo (T)">
                Tap <Kbd>T</Kbd>
            </Button>
            <BeatLight />
            <span className="mx-1 h-5 w-px bg-line" />
            <Toggle pressed={auto.on} onChange={(on) => setAutoMosh({ on })} title="Run a randomizer on the beat (A)">
                Auto-mosh
            </Toggle>
            <Select
                aria-label="Auto-mosh interval"
                value={Math.max(auto.bars, minBarsFor(auto.scope))}
                onChange={(e) => setAutoMosh({ bars: Number(e.target.value), on: true })}
                className="h-7 w-auto pr-6 text-xs"
            >
                {AUTO_MOSH_BARS.map((b) => (
                    <option key={b} value={b} disabled={b < minBarsFor(auto.scope)}>
                        Every {b === 1 ? 'bar' : `${b} bars`}
                    </option>
                ))}
            </Select>
            <Select
                aria-label="Auto-mosh randomizer"
                value={auto.scope}
                onChange={(e) => setAutoMosh({ scope: e.target.value as MoshScope, on: true })}
                className="h-7 w-auto pr-6 text-xs"
            >
                {MoshScopeSchema.options.map((s) => <option key={s} value={s}>{MOSH_SCOPES[s].label}</option>)}
            </Select>
        </div>
    )
}

// Native popover: escapes overflow, closes on Escape and outside click
export function ShortcutsButton() {
    return (
        <>
            <IconButton icon={Keyboard} label="Keyboard shortcuts (?)" popoverTarget="shortcuts" />
            <div
                id="shortcuts"
                popover="auto"
                className="fixed inset-auto right-3 top-12 m-0 w-72 rounded-lg border border-line bg-panel p-4 text-ink shadow-[0_12px_32px_oklch(0_0_0/0.55)]"
            >
                <h2 className="label mb-3">Keyboard shortcuts</h2>
                <dl className="space-y-2 text-[13px]">
                    {SHORTCUTS.map((s) => (
                        <div key={s.keys} className="flex items-center justify-between gap-3">
                            <dt className="text-dim">{s.action}</dt>
                            <dd className="flex shrink-0 gap-1">{s.keys.split(' ').map((k) => <Kbd key={k}>{k}</Kbd>)}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </>
    )
}
