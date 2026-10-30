import { useRef } from 'react'
import { useStore } from 'zustand'
import { ArrowLeftRight, Lock, LockOpen, Pause, Play, Zap } from 'lucide-react'
import { appStore, setBlendMode, setLock, setMix, setMixOsc, setOverlay, swapLayers, updateVideoState } from '../store/appStore'
import { PATTERN_LABELS } from '../fx/patterns'
import { select, uiStore } from '../store/uiStore'
import { checkpoint, sliderCheckpoint } from '../store/history'
import type { AppState, Effect, SourceId } from '../store/schema'
import { EFFECTS, liveAmount, normalizedAmount } from '../fx/effects'
import { beatsNow } from '../engine/clock'
import { useChangedFlash, useFrame, usePlayhead, useVideoTitle } from '../hooks/useLive'
import { thumbnailUrl, videoErrorStore } from '../utils/youtube'
import { moshVideo } from '../utils/mosh'
import { liveMix } from './Stage'
import { cn, IconButton, Select, Toggle } from './ui/core'
import { BLEND_LABELS, blendOptions, rateOptions, shapeOptions } from './options'
import { MoshCluster } from './MoshCluster'
import { LottieView, MediaView, PatternCanvas } from './OverlayLayer'
import { isBuiltInLottie, LOTTIE_LABELS } from '../fx/lotties'

export const LAYER = {
    videoA: { letter: 'A', name: 'Source A', bg: 'bg-layer-a', token: '--layer-a' },
    videoB: { letter: 'B', name: 'Source B', bg: 'bg-layer-b', token: '--layer-b' },
    overlay: { letter: 'C', name: 'Layer C', bg: 'bg-layer-c', token: '--layer-c' },
    master: { letter: 'M', name: 'Master', bg: 'bg-layer-m', token: '--layer-m' },
} as const




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

const RING = { videoA: 'ring-layer-a/60', videoB: 'ring-layer-b/60', overlay: 'ring-layer-c/60', master: 'ring-layer-m/50' } as const

export const stripClass = (selected: boolean, layer: keyof typeof RING, width: string, flash = false) =>
    cn('flex shrink-0 flex-col gap-2 rounded-md p-2 transition-colors', width, selected ? `bg-raised ring-1 ring-inset ${RING[layer]}` : 'bg-rack/60', flash && 'strip-flash')

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
    const flash = useChangedFlash(id)
    const { name } = LAYER[id]

    return (
        <section aria-label={name} className={stripClass(selected, id, 'w-[176px] min-[1280px]:w-[196px] min-[1400px]:w-[216px]', flash)}>
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

// The fader always runs A (left) to B (right), matching the strips beside it.
// Underneath, the mix is the top layer's amount, so the position flips with layer order.
const faderPos = (mix: number, top: SourceId) => (top === 'videoB' ? mix : 1 - mix)

function Crossfader() {
    const mix = useStore(appStore, (s) => s.mix)
    const mixOsc = useStore(appStore, (s) => s.mixOsc)
    const top = useStore(appStore, (s) => s.activeOverlay)
    const blendMode = useStore(appStore, (s) => s.blendMode)
    const markerRef = useRef<HTMLDivElement>(null)
    const pos = faderPos(mix, top)
    const flash = useChangedFlash('crossfade')

    // Amber marker rides the live value while the mix oscillates
    useFrame(() => {
        const el = markerRef.current
        if (!el) return
        const state = appStore.getState()
        el.style.display = state.mixOsc.on ? 'block' : 'none'
        if (state.mixOsc.on) el.style.left = `calc(9px + (100% - 18px) * ${faderPos(liveMix(state, beatsNow()), state.activeOverlay)})`
    })

    const topL = LAYER[top].letter
    const blendName = BLEND_LABELS[blendMode].split(' ')[0]
    const description = blendMode === 'normal'
        ? 'Crossfade between Source A and Source B'
        : `Source ${topL} is on top in ${blendName} mode: toward ${topL} blends it in fully, the other end shows the other source alone`

    return (
        <section aria-label="Crossfader" className={cn('flex min-w-[232px] min-[1280px]:min-w-[272px] min-[1400px]:min-w-[300px] flex-1 flex-col justify-between gap-2 rounded-md bg-rack/60 px-3 py-2', flash && 'strip-flash')}>
            <div className="flex items-center justify-between gap-2">
                <label htmlFor="crossfader" className="label">Crossfade</label>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => { checkpoint('layer swap'); swapLayers() }}
                        title="Swap which source is on top"
                        aria-label={`Swap layers (${topL} is on top${blendMode !== 'normal' ? `, ${blendName}` : ''})`}
                        className="inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-medium text-dim transition-colors hover:bg-raised hover:text-ink"
                    >
                        <ArrowLeftRight size={13} aria-hidden="true" />
                        {topL} on top{blendMode !== 'normal' && ` · ${blendName}`}
                    </button>
                    <LockToggle lockKey="mix" what="Crossfade" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <LayerChip layer="videoA" />
                <div className="relative flex-1">
                    <input
                        id="crossfader"
                        type="range"
                        className="range range-fader"
                        min={0} max={1} step={0.01}
                        value={pos}
                        aria-valuetext={`${Math.round((1 - pos) * 100)}% A, ${Math.round(pos * 100)}% B`}
                        aria-describedby="crossfader-desc"
                        onPointerDown={sliderCheckpoint}
                        onKeyDown={(e) => e.key.startsWith('Arrow') && sliderCheckpoint(e)}
                        onChange={(e) => setMix(faderPos(parseFloat(e.target.value), top))}
                    />
                    <div ref={markerRef} className="pointer-events-none absolute top-1/2 hidden h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" aria-hidden="true" />
                </div>
                <LayerChip layer="videoB" />
            </div>
            <p id="crossfader-desc" className="sr-only">{description}</p>
            <div className="flex items-center gap-1.5">
                <Toggle pressed={mixOsc.on} onChange={(on) => setMixOsc({ on })}>Oscillate</Toggle>
                <Select
                    aria-label="Crossfade oscillation rate"
                    size="sm"
                    value={mixOsc.rate}
                    options={rateOptions()}
                    onChange={(rate) => setMixOsc({ rate })}
                    className="min-w-0 flex-1"
                />
                <Select
                    aria-label="Crossfade oscillation shape"
                    size="sm"
                    value={mixOsc.shape}
                    options={shapeOptions}
                    onChange={(shape) => setMixOsc({ shape })}
                    className="min-w-0 flex-1 max-[1279px]:hidden"
                />
            </div>
        </section>
    )
}

// Strip-scale preview of layer C's actual content
function OverlayPreview() {
    const overlay = useStore(appStore, (s) => s.overlay)
    if (overlay.kind === 'pattern') return <PatternCanvas pattern={overlay.pattern} reportErrors={false} />
    if (overlay.kind === 'lottie') return <LottieView source={overlay.lottie} reportErrors={false} />
    if (overlay.kind === 'media' && overlay.url) return <MediaView url={overlay.url} reportErrors={false} />
    return <span className="flex h-full items-center justify-center text-xs text-dim">Off</span>
}

function OverlayStrip() {
    const overlay = useStore(appStore, (s) => s.overlay)
    const selected = useStore(uiStore, (s) => s.selected === 'overlay')
    const on = overlay.kind !== 'off'
    const content = overlay.kind === 'pattern' ? PATTERN_LABELS[overlay.pattern]
        : overlay.kind === 'lottie' ? (isBuiltInLottie(overlay.lottie) ? LOTTIE_LABELS[overlay.lottie] : 'Lottie')
        : overlay.kind === 'media' ? 'Video overlay' : 'Off'
    const flash = useChangedFlash('overlay')

    return (
        <section aria-label="Layer C" className={stripClass(selected, 'overlay', 'w-[124px] min-[1280px]:w-[132px]', flash)}>
            <button type="button" onClick={() => select('overlay')} aria-pressed={selected} aria-label={`Edit Layer C (${content})`} className="flex flex-1 flex-col gap-2 text-left">
                <span className="flex w-full items-center gap-2">
                    <LayerChip layer="overlay" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{on ? content : 'Layer C'}</span>
                </span>
                <span className="flex w-full flex-1 gap-2">
                    <span className="relative flex-1 overflow-hidden rounded-sm bg-rack">
                        <span className="absolute inset-0"><OverlayPreview /></span>
                    </span>
                    <Meter layer="overlay" level={(_, state) => (state.overlay.kind === 'off' ? 0 : state.overlay.opacity)} />
                </span>
            </button>
            <div className="flex items-center gap-1">
                <Toggle
                    pressed={on}
                    aria-label="Layer C"
                    onChange={(next) => {
                        checkpoint('Layer C on/off')
                        setOverlay({ kind: next ? (overlay.url ? 'media' : 'pattern') : 'off' })
                        if (next) select('overlay')
                    }}
                    className="flex-1"
                >
                    {on ? 'On' : 'Off'}
                </Toggle>
                <IconButton
                    size="sm"
                    icon={overlay.hold ? Lock : LockOpen}
                    label={overlay.hold ? 'Layer C is held: randomizers skip it' : 'Hold Layer C so randomizers skip it'}
                    active={overlay.hold}
                    onClick={() => setOverlay({ hold: !overlay.hold })}
                />
            </div>
        </section>
    )
}

function MasterStrip() {
    const blendMode = useStore(appStore, (s) => s.blendMode)
    const effects = useStore(appStore, (s) => s.masterEffects)
    const selected = useStore(uiStore, (s) => s.selected === 'master')
    const flash = useChangedFlash('master')

    return (
        <section aria-label="Master" className={stripClass(selected, 'master', 'w-[168px] min-[1280px]:w-[184px] min-[1400px]:w-[200px]', flash)}>
            <div className="flex items-center gap-2">
                <button type="button" onClick={() => select('master')} aria-pressed={selected} aria-label="Edit Master" className="flex flex-1 items-center gap-2 rounded-sm text-left">
                    <LayerChip layer="master" />
                    <span className="flex-1 text-[13px] font-medium">Master</span>
                </button>
                <LockToggle lockKey="blend" what="Master (blend and output effects)" />
            </div>
            <div className="flex flex-1 gap-2">
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                    <div className="space-y-1">
                        <label id="blend-mode-label" htmlFor="blend-mode" className="label">Blend</label>
                        <Select id="blend-mode" value={blendMode} options={blendOptions} onChange={(mode) => { checkpoint('blend change'); setBlendMode(mode) }} />
                    </div>
                    <button
                        type="button"
                        onClick={() => select('master')}
                        aria-pressed={selected}
                        className="flex h-8 min-w-0 items-center rounded-md border border-edge bg-raised px-2.5 text-left text-xs font-medium text-ink transition-colors hover:bg-line/70"
                    >
                        <span className="truncate">{effects.length ? `Output: ${effects.map((e) => EFFECTS[e.type].label).join(' + ')}` : 'Output effects'}</span>
                    </button>
                </div>
                <Meter layer="master" level={(beats, state) => stackLevel(state.masterEffects, beats)} />
            </div>
        </section>
    )
}

export function Mixer() {
    return (
        <footer className="flex shrink-0 items-stretch gap-2 overflow-x-auto border-t border-line bg-panel p-2 max-[1279px]:flex-wrap">
            <SourceStrip id="videoA" />
            <Crossfader />
            <SourceStrip id="videoB" />
            <OverlayStrip />
            <MasterStrip />
            <MoshCluster id="mosh" className="w-[212px] min-[1400px]:w-[300px] shrink-0 max-[1279px]:order-first max-[1279px]:w-full max-[1279px]:flex-row" />
        </footer>
    )
}
