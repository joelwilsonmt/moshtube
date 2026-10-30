import { useRef } from 'react'
import { useStore } from 'zustand'
import { ArrowLeftRight, Lock, LockOpen, Pause, Play, Zap } from 'lucide-react'
import { appStore, setBlendMode, setLock, setMix, setMixOsc, setOverlay, swapLayers, updateVideoState } from '../store/appStore'
import { PATTERN_LABELS } from '../fx/patterns'
import { select, uiStore } from '../store/uiStore'
import { checkpoint } from '../store/history'
import { BlendModeSchema, OSC_RATES, WaveShapeSchema, type AppState, type Effect, type SourceId } from '../store/schema'
import { EFFECTS, liveAmount, normalizedAmount } from '../fx/effects'
import { beatsNow } from '../engine/clock'
import { useFrame, usePlayhead, useVideoTitle } from '../hooks/useLive'
import { thumbnailUrl, videoErrorStore } from '../utils/youtube'
import { moshVideo } from '../utils/mosh'
import { liveMix } from './Stage'
import { cn, IconButton, Select, Toggle } from './ui/core'
import { MoshCluster } from './MoshCluster'

export const LAYER = {
    videoA: { letter: 'A', name: 'Source A', bg: 'bg-layer-a', text: 'text-layer-a', token: '--layer-a' },
    videoB: { letter: 'B', name: 'Source B', bg: 'bg-layer-b', text: 'text-layer-b', token: '--layer-b' },
    overlay: { letter: 'C', name: 'Layer C', bg: 'bg-layer-c', text: 'text-layer-c', token: '--layer-c' },
    master: { letter: 'M', name: 'Master', bg: 'bg-layer-m', text: 'text-layer-m', token: '--layer-m' },
} as const

export const BLEND_LABELS: Record<AppState['blendMode'], string> = {
    normal: 'Normal',
    multiply: 'Multiply (darker)',
    screen: 'Screen (brighter)',
    overlay: 'Overlay (contrast)',
    difference: 'Difference (invert)',
    exclusion: 'Exclusion (soft invert)',
}

export const rateLabel = (beats: number) =>
    beats < 4 ? `${beats} beat${beats === 1 ? '' : 's'}` : `${beats / 4} bar${beats === 4 ? '' : 's'}`

// Highest live intensity across a stack, 0..1
export function stackLevel(effects: Effect[], beats: number) {
    return effects.reduce((max, e) => (EFFECTS[e.type].param ? Math.max(max, normalizedAmount(e, liveAmount(e, beats))) : max), 0)
}

export function LayerChip({ layer, className }: { layer: keyof typeof LAYER; className?: string }) {
    return (
        <span className={cn('inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm font-label text-[12px] font-bold text-rack', LAYER[layer].bg, className)} aria-hidden="true">
            {LAYER[layer].letter}
        </span>
    )
}

const SEGMENTS = 8

// LED-style meter of live modulation; updated per frame without re-rendering
function Meter({ level, layer }: { level: (beats: number, state: AppState) => number; layer: keyof typeof LAYER }) {
    const ref = useRef<HTMLDivElement>(null)
    useFrame(() => {
        const el = ref.current
        if (!el) return
        const lit = Math.round(level(beatsNow(), appStore.getState()) * SEGMENTS)
        Array.from(el.children).forEach((seg, i) => {
            ;(seg as HTMLElement).style.opacity = SEGMENTS - 1 - i < lit ? '1' : '0.14'
        })
    })
    return (
        <div ref={ref} className="flex h-full w-1.5 shrink-0 flex-col gap-[3px]" aria-hidden="true">
            {Array.from({ length: SEGMENTS }, (_, i) => (
                <span key={i} className={cn('flex-1 rounded-[1px]', i === 0 ? 'bg-signal' : LAYER[layer].bg)} style={{ opacity: 0.14 }} />
            ))}
        </div>
    )
}

function Thumbnail({ id }: { id: SourceId }) {
    const videoId = useStore(appStore, (s) => s[id].id)
    const duration = useStore(appStore, (s) => s[id].duration)
    const playing = useStore(appStore, (s) => s[id].playing && s.outputPlaying)
    const error = useStore(videoErrorStore, (s) => s[id])
    const time = usePlayhead(id, 500)
    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-rack">
            {videoId && <img src={thumbnailUrl(videoId)} alt="" className={cn('h-full w-full object-cover transition-opacity', !playing && 'opacity-50')} />}
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-black/50">
                <div className="h-full bg-ink/80" style={{ width: `${duration ? Math.min(100, (time / duration) * 100) : 0}%` }} />
            </div>
            {error && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-rack" title={error} />}
            {!playing && !error && <Pause size={18} aria-hidden="true" className="absolute inset-0 m-auto text-ink drop-shadow" />}
        </div>
    )
}

function SourceStrip({ id }: { id: SourceId }) {
    const videoId = useStore(appStore, (s) => s[id].id)
    const playing = useStore(appStore, (s) => s[id].playing)
    const hold = useStore(appStore, (s) => s[id].hold)
    const effects = useStore(appStore, (s) => s[id].effects)
    const selected = useStore(uiStore, (s) => s.selected === id)
    const error = useStore(videoErrorStore, (s) => s[id])
    const title = useVideoTitle(videoId)
    const { name } = LAYER[id]

    return (
        <section aria-label={name} className={cn('flex w-[196px] min-[1400px]:w-[216px] shrink-0 flex-col gap-2 rounded-md p-2 transition-colors', selected ? 'bg-raised' : 'bg-rack/60')}>
            <button
                type="button"
                onClick={() => select(id)}
                aria-pressed={selected}
                aria-label={`Edit ${name}`}
                className="group flex flex-col gap-2 rounded-sm text-left"
            >
                <span className="flex w-full items-center gap-2">
                    <LayerChip layer={id} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                        {error ? <span className="text-danger">Video unavailable</span> : title ?? videoId ?? 'No video'}
                    </span>
                </span>
                <span className="flex w-full gap-2">
                    <Thumbnail id={id} />
                    <Meter layer={id} level={(beats, state) => stackLevel(state[id].effects, beats)} />
                </span>
            </button>
            <div className="flex items-center gap-1">
                <IconButton
                    size="sm"
                    icon={playing ? Pause : Play}
                    label={playing ? `Pause ${name}` : `Play ${name}`}
                    onClick={() => updateVideoState(id, { playing: !playing })}
                />
                <IconButton size="sm" icon={Zap} label={`Mosh ${name} only`} onClick={() => moshVideo(id)} disabled={hold} />
                <IconButton
                    size="sm"
                    icon={hold ? Lock : LockOpen}
                    label={hold ? `${name} is held: randomizers skip it` : `Hold ${name} so randomizers skip it`}
                    active={hold}
                    onClick={() => updateVideoState(id, { hold: !hold })}
                />
                <span className="ml-auto truncate text-xs text-dim">
                    {effects.length ? effects.map((e) => EFFECTS[e.type].label).join(' + ') : 'No effects'}
                </span>
            </div>
        </section>
    )
}

function LockToggle({ lockKey, what }: { lockKey: keyof AppState['locks']; what: string }) {
    const locked = useStore(appStore, (s) => s.locks[lockKey])
    return (
        <IconButton
            size="sm"
            icon={locked ? Lock : LockOpen}
            label={locked ? `${what} locked: randomizers skip it` : `Lock ${what} so randomizers skip it`}
            active={locked}
            onClick={() => setLock(lockKey, !locked)}
        />
    )
}

function Crossfader() {
    const mix = useStore(appStore, (s) => s.mix)
    const mixOsc = useStore(appStore, (s) => s.mixOsc)
    const top = useStore(appStore, (s) => s.activeOverlay)
    const blendMode = useStore(appStore, (s) => s.blendMode)
    const markerRef = useRef<HTMLDivElement>(null)
    const bottom: SourceId = top === 'videoA' ? 'videoB' : 'videoA'

    // Amber marker rides the live value while the mix oscillates
    useFrame(() => {
        const el = markerRef.current
        if (!el) return
        const state = appStore.getState()
        el.style.display = state.mixOsc.on ? 'block' : 'none'
        if (state.mixOsc.on) el.style.left = `calc(9px + (100% - 18px) * ${liveMix(state, beatsNow())})`
    })

    const topL = LAYER[top].letter
    const bottomL = LAYER[bottom].letter
    const rightLabel = blendMode === 'normal' ? topL : `${bottomL}+${topL}`
    const description = blendMode === 'normal'
        ? `Crossfade from ${bottomL} to ${topL}`
        : `How much ${topL} blends over ${bottomL} (${BLEND_LABELS[blendMode].split(' ')[0]})`

    return (
        <section aria-label="Crossfader" className="flex min-w-[272px] min-[1400px]:min-w-[300px] flex-1 flex-col justify-between gap-2 rounded-md bg-rack/60 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
                <label htmlFor="crossfader" className="label">Crossfade</label>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => { checkpoint(); swapLayers() }}
                        title="Swap which source is on top"
                        className="inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-medium text-dim transition-colors hover:bg-raised hover:text-ink"
                    >
                        <ArrowLeftRight size={13} aria-hidden="true" />
                        {topL} on top
                    </button>
                    <span className="w-9 text-right text-xs text-dim">{Math.round(mix * 100)}%</span>
                    <LockToggle lockKey="mix" what="Crossfade" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <LayerChip layer={bottom} />
                <div className="relative flex-1">
                    <input
                        id="crossfader"
                        type="range"
                        className="range range-fader"
                        min={0} max={1} step={0.01}
                        value={mix}
                        aria-valuetext={`${Math.round(mix * 100)}% ${topL}`}
                        aria-describedby="crossfader-desc"
                        onChange={(e) => setMix(parseFloat(e.target.value))}
                        style={{ '--fader-l': `var(${LAYER[bottom].token})`, '--fader-r': `var(${LAYER[top].token})` } as React.CSSProperties}
                    />
                    <div ref={markerRef} className="pointer-events-none absolute top-1/2 hidden h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" aria-hidden="true" />
                </div>
                <span className={cn('inline-flex h-5 shrink-0 items-center justify-center rounded-sm px-1 font-label text-[12px] font-bold text-rack', LAYER[top].bg)} aria-hidden="true">
                    {rightLabel}
                </span>
            </div>
            <p id="crossfader-desc" className="sr-only">{description}</p>
            <div className="flex items-center gap-1.5">
                <Toggle pressed={mixOsc.on} onChange={(on) => setMixOsc({ on })}>Oscillate</Toggle>
                <Select
                    aria-label="Crossfade oscillation rate"
                    value={mixOsc.rate}
                    onChange={(e) => setMixOsc({ rate: Number(e.target.value), on: true })}
                    className="h-7 w-auto min-w-0 flex-1 pr-6 text-xs"
                >
                    {OSC_RATES.map((r) => <option key={r} value={r}>{rateLabel(r)}</option>)}
                </Select>
                <Select
                    aria-label="Crossfade oscillation shape"
                    value={mixOsc.shape}
                    onChange={(e) => setMixOsc({ shape: e.target.value as AppState['mixOsc']['shape'], on: true })}
                    className="h-7 w-auto min-w-0 flex-1 pr-6 text-xs capitalize"
                >
                    {WaveShapeSchema.options.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
            </div>
        </section>
    )
}

function OverlayStrip() {
    const overlay = useStore(appStore, (s) => s.overlay)
    const selected = useStore(uiStore, (s) => s.selected === 'overlay')
    const on = overlay.kind !== 'off'
    const content = overlay.kind === 'pattern' ? PATTERN_LABELS[overlay.pattern] : overlay.kind === 'media' ? 'Video overlay' : 'Off'

    return (
        <section aria-label="Layer C" className={cn('flex w-[132px] shrink-0 flex-col gap-2 rounded-md p-2 transition-colors', selected ? 'bg-raised' : 'bg-rack/60')}>
            <button type="button" onClick={() => select('overlay')} aria-pressed={selected} aria-label="Edit Layer C" className="flex flex-1 flex-col gap-2 text-left">
                <span className="flex w-full items-center gap-2">
                    <LayerChip layer="overlay" />
                    <span className="text-[13px] font-medium">Layer C</span>
                </span>
                <span className="flex w-full flex-1 gap-2">
                    <span className={cn('flex flex-1 items-center justify-center rounded-sm bg-rack px-1 text-center text-xs', on ? 'text-ink' : 'text-dim')}>
                        {content}
                    </span>
                    <Meter layer="overlay" level={(_, state) => (state.overlay.kind === 'off' ? 0 : state.overlay.opacity)} />
                </span>
            </button>
            <Toggle
                pressed={on}
                onChange={(next) => {
                    checkpoint()
                    setOverlay({ kind: next ? (overlay.url ? 'media' : 'pattern') : 'off' })
                    if (next) select('overlay')
                }}
                className="w-full"
            >
                {on ? 'On' : 'Off'}
            </Toggle>
        </section>
    )
}

function MasterStrip() {
    const blendMode = useStore(appStore, (s) => s.blendMode)
    const effects = useStore(appStore, (s) => s.masterEffects)
    const selected = useStore(uiStore, (s) => s.selected === 'master')

    return (
        <section aria-label="Master" className={cn('flex w-[184px] min-[1400px]:w-[200px] shrink-0 flex-col gap-2 rounded-md p-2 transition-colors', selected ? 'bg-raised' : 'bg-rack/60')}>
            <div className="flex items-center gap-2">
                <LayerChip layer="master" />
                <span className="flex-1 text-[13px] font-medium">Master</span>
                <LockToggle lockKey="blend" what="Blend mode" />
            </div>
            <div className="space-y-1">
                <label htmlFor="blend-mode" className="label">Blend</label>
                <Select id="blend-mode" value={blendMode} onChange={(e) => { checkpoint(); setBlendMode(e.target.value as AppState['blendMode']) }}>
                    {BlendModeSchema.options.map((m) => <option key={m} value={m}>{BLEND_LABELS[m]}</option>)}
                </Select>
            </div>
            <div className="flex flex-1 items-end gap-2">
                <button
                    type="button"
                    onClick={() => select('master')}
                    aria-pressed={selected}
                    className="flex h-8 min-w-0 flex-1 items-center rounded-md border border-line bg-raised px-2.5 text-left text-xs font-medium text-ink transition-colors hover:bg-line/70"
                >
                    <span className="truncate">{effects.length ? `Output: ${effects.map((e) => EFFECTS[e.type].label).join(' + ')}` : 'Output effects'}</span>
                </button>
                <div className="h-7"><Meter layer="master" level={(beats, state) => stackLevel(state.masterEffects, beats)} /></div>
            </div>
        </section>
    )
}

export function Mixer() {
    return (
        <footer className="flex shrink-0 items-stretch gap-2 overflow-x-auto border-t border-line bg-panel p-2">
            <SourceStrip id="videoA" />
            <Crossfader />
            <SourceStrip id="videoB" />
            <OverlayStrip />
            <MasterStrip />
            <MoshCluster className="w-[212px] min-[1400px]:w-[300px] shrink-0 justify-center" />
        </footer>
    )
}
