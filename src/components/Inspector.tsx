import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { appStore, setBlendMode, setMixOsc, setOverlay, swapLayers, updateVideoState } from '../store/appStore'
import { PATTERN_LABELS } from '../fx/patterns'
import { LottieThumb, overlayErrorStore } from './OverlayLayer'
import { checkpoint } from '../store/history'
import { uiStore } from '../store/uiStore'
import { PatternSchema, type Pattern, type SourceId } from '../store/schema'
import { usePlayhead, useVideoTitle } from '../hooks/useLive'
import { formatTime, parseTime } from '../utils/time'
import { parseYouTubeId, videoErrorStore } from '../utils/youtube'
import { RandomVideoButton } from './RandomVideoButton'
import { DualRangeSlider } from './ui/DualRangeSlider'
import { Button, Field, Input, Range, Section, Segmented, Select, Toggle } from './ui/core'
import { EffectStack } from './EffectStack'
import { LAYER, LayerChip } from './Mixer'
import { BLEND_HINTS, blendOptions, rateOptions, shapeOptions } from './options'
import { BUILT_IN_LOTTIES, isBuiltInLottie, LOTTIE_LABELS } from '../fx/lotties'

// Commits on blur or Enter; shows the formatted value otherwise
function TimeInput({ id, value, onCommit }: { id: string; value: number; onCommit: (v: number) => void }) {
    const [draft, setDraft] = useState<string | null>(null)
    const commit = () => {
        if (draft === null) return
        // Out-of-range or unparseable input reverts to the current value
        const parsed = parseTime(draft)
        if (parsed !== null) onCommit(parsed)
        setDraft(null)
    }
    return (
        <Input
            id={id}
            inputMode="decimal"
            value={draft ?? formatTime(value, true)}
            aria-invalid={draft !== null && parseTime(draft) === null}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') setDraft(null)
            }}
        />
    )
}

// A new video loops in full until the user sets a region (onReady fills in the duration)
const FULL_LOOP = { start: 0, end: 0, lastInteraction: 0 }

function SourceInspector({ id }: { id: SourceId }) {
    const state = useStore(appStore, (s) => s[id])
    const playerError = useStore(videoErrorStore, (s) => s[id])
    const title = useVideoTitle(state.id)
    const time = usePlayhead(id)
    const update = (updates: Partial<typeof state>) => updateVideoState(id, { ...updates, lastInteraction: Date.now() })

    // Local draft so partial input doesn't remount the players with half-typed IDs
    const [draft, setDraft] = useState(state.id || '')
    useEffect(() => setDraft(state.id || ''), [state.id])
    const draftInvalid = draft.trim() !== '' && !parseYouTubeId(draft)

    const handleIdChange = (val: string) => {
        setDraft(val)
        const nextId = parseYouTubeId(val)
        if (nextId && nextId !== state.id) {
            checkpoint('video change')
            updateVideoState(id, { id: nextId, playing: true, ...FULL_LOOP })
        }
    }

    const max = state.duration || 100
    const seek = (t: number) => updateVideoState(id, { seek: { time: t, trigger: Date.now() } })

    return (
        <>
            <Section title="Video">
                <Field label="YouTube link or ID">
                    {(fieldId) => (
                        <div className="flex gap-1.5">
                            <Input
                                id={fieldId}
                                value={draft}
                                onChange={(e) => handleIdChange(e.target.value)}
                                placeholder="Paste a YouTube link"
                                aria-invalid={draftInvalid || !!playerError}
                                aria-describedby={`${id}-msg`}
                                className="flex-1"
                                spellCheck={false}
                            />
                            <RandomVideoButton id={id} className="border border-edge" />
                        </div>
                    )}
                </Field>
                <div id={`${id}-msg`} aria-live="polite" className="-mt-1 space-y-1 text-xs">
                    {draftInvalid && <p className="text-dim">Paste a YouTube link or an 11-character video ID.</p>}
                    {playerError && <p className="text-danger">{playerError} Try another link or press Random video.</p>}
                    {!draftInvalid && !playerError && title && <p className="truncate text-dim" title={title}>{title}</p>}
                </div>
                <Field label="Position" value={`${formatTime(time)} / ${formatTime(state.duration)}`}>
                    {(fieldId) => (
                        <Range
                            id={fieldId}
                            min={0} max={max} step={0.1}
                            value={Math.min(time, max)}
                            aria-valuetext={formatTime(time)}
                            onChange={(e) => seek(parseFloat(e.target.value))}
                        />
                    )}
                </Field>
            </Section>

            <Section title="Effects">
                <EffectStack target={id} />
            </Section>
            <Section
                title="Loop"
                actions={
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-dim hover:text-ink">
                        <input
                            type="checkbox"
                            checked={state.loop}
                            onChange={(e) => update({ loop: e.target.checked })}
                            className="h-4 w-4 accent-[oklch(var(--signal))]"
                        />
                        Loop section
                    </label>
                }
            >
                <DualRangeSlider
                    min={0}
                    max={max}
                    step={0.1}
                    value={[state.start, Math.max(state.end, state.start + 0.1)]}
                    labels={['Loop start', 'Loop end']}
                    format={(v) => formatTime(v, true)}
                    onChange={([start, end]) => {
                        const updates: Partial<typeof state> = { start, end }
                        if (start !== state.start) updates.seek = { time: start, trigger: Date.now() }
                        update(updates)
                    }}
                />
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Start">
                        {(fieldId) => (
                            <TimeInput id={fieldId} value={state.start} onCommit={(v) => {
                                if (v >= 0 && v < state.end) update({ start: v, seek: { time: v, trigger: Date.now() } })
                            }} />
                        )}
                    </Field>
                    <Field label="End">
                        {(fieldId) => (
                            <TimeInput id={fieldId} value={state.end} onCommit={(v) => {
                                if (v > state.start && v <= max) update({ end: v })
                            }} />
                        )}
                    </Field>
                </div>
            </Section>

        </>
    )
}

const LOOP_BEATS = [1, 2, 4, 8, 16] as const
const CUSTOM = 'custom'

function LottieControls() {
    const overlay = useStore(appStore, (s) => s.overlay)
    const error = useStore(overlayErrorStore, (s) => s.error)
    const builtIn = isBuiltInLottie(overlay.lottie)
    const [custom, setCustom] = useState(!builtIn)
    const [url, setUrl] = useState(builtIn ? '' : overlay.lottie)
    const urlValid = /^https?:\/\/\S+$/.test(url.trim())

    return (
        <>
            <Field label="Animation">
                {(fieldId) => (
                    <Select
                        id={fieldId}
                        value={custom ? CUSTOM : overlay.lottie}
                        options={[...BUILT_IN_LOTTIES.map((name) => ({ value: name as string, label: LOTTIE_LABELS[name] })), { value: CUSTOM, label: 'Your own (link)…' }]}
                        renderLeading={(o) => <LottieThumb name={o.value} hue={overlay.hue} />}
                        onChange={(value) => {
                            if (value === CUSTOM) return setCustom(true)
                            setCustom(false)
                            checkpoint('Lottie change')
                            setOverlay({ lottie: value })
                        }}
                    />
                )}
            </Field>
            {custom && (
                <form
                    className="space-y-1.5"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (!urlValid) return
                        checkpoint('Lottie link')
                        setOverlay({ lottie: url.trim() })
                    }}
                >
                    <label htmlFor="lottie-url" className="text-xs font-medium text-dim">Direct link to a Lottie .json file</label>
                    <div className="flex gap-1.5">
                        <Input
                            id="lottie-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://…/animation.json"
                            aria-invalid={!!error}
                            aria-describedby="lottie-url-msg"
                            spellCheck={false}
                        />
                        <Button type="submit" disabled={!urlValid} className="shrink-0">Load</Button>
                    </div>
                    <p id="lottie-url-msg" className={error ? 'text-xs text-danger' : 'text-xs text-dim'}>
                        {error ?? 'From LottieFiles, use the Lottie JSON link (not the .lottie file). The host has to allow loading from other sites.'}
                    </p>
                </form>
            )}
            <Field label="One loop lasts">
                {(fieldId) => (
                    <Select id={fieldId} value={overlay.loopBeats} options={rateOptions(LOOP_BEATS)} onChange={(loopBeats) => setOverlay({ loopBeats })} />
                )}
            </Field>
            {builtIn && !custom && (
                <Field label="Hue" value={`${Math.round(overlay.hue)}°`}>
                    {(fieldId) => (
                        <Range id={fieldId} min={0} max={360} step={1} value={overlay.hue} onChange={(e) => setOverlay({ hue: parseFloat(e.target.value) })} />
                    )}
                </Field>
            )}
        </>
    )
}

function OverlayInspector() {
    const overlay = useStore(appStore, (s) => s.overlay)
    const error = useStore(overlayErrorStore, (s) => s.error)
    const [url, setUrl] = useState(overlay.url)
    const urlValid = /^https?:\/\/\S+$/.test(url.trim())

    return (
        <>
            <Section title="Content">
                <Segmented
                    label="Layer C content"
                    value={overlay.kind}
                    options={[
                        { value: 'off', label: 'Off' },
                        { value: 'pattern', label: 'Pattern' },
                        { value: 'lottie', label: 'Lottie' },
                        { value: 'media', label: 'Video' },
                    ]}
                    onChange={(kind) => { checkpoint('Layer C content'); setOverlay({ kind }) }}
                />
                {overlay.kind === 'pattern' && (
                    <>
                        <Field label="Pattern">
                            {(fieldId) => (
                                <Select
                                    id={fieldId}
                                    value={overlay.pattern}
                                    options={PatternSchema.options.map((p) => ({ value: p, label: PATTERN_LABELS[p] }))}
                                    onChange={(pattern: Pattern) => { checkpoint('pattern change'); setOverlay({ pattern }) }}
                                />
                            )}
                        </Field>
                        <Field label="Hue" value={`${Math.round(overlay.hue)}°`}>
                            {(fieldId) => (
                                <Range id={fieldId} min={0} max={360} step={1} value={overlay.hue} onChange={(e) => setOverlay({ hue: parseFloat(e.target.value) })} />
                            )}
                        </Field>
                        <p className="text-xs text-dim">Patterns move with the tempo and pulse on every beat.</p>
                    </>
                )}
                {overlay.kind === 'lottie' && <LottieControls />}
                {overlay.kind === 'media' && (
                    <form
                        className="space-y-1.5"
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (!urlValid) return
                            checkpoint('Layer C link')
                            setOverlay({ url: url.trim() })
                        }}
                    >
                        <label htmlFor="overlay-url" className="text-xs font-medium text-dim">Direct link to a video or GIF file</label>
                        <div className="flex gap-1.5">
                            <Input
                                id="overlay-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://…/loop.webm"
                                aria-invalid={!!error}
                                aria-describedby="overlay-url-msg"
                                spellCheck={false}
                            />
                            <Button type="submit" disabled={!urlValid} className="shrink-0">Load</Button>
                        </div>
                        <p id="overlay-url-msg" className={error ? 'text-xs text-danger' : 'text-xs text-dim'}>
                            {error ?? 'WebM with transparency works best. YouTube links go in Source A or B.'}
                        </p>
                    </form>
                )}
                {overlay.kind === 'off' && (
                    <p className="text-[13px] text-dim">Layer C sits over both sources: a tempo-synced pattern or Lottie animation, or a transparent video or GIF from a link.</p>
                )}
            </Section>
            {overlay.kind !== 'off' && (
                <Section title="Mix">
                    <Field label="Opacity" value={`${Math.round(overlay.opacity * 100)}%`}>
                        {(fieldId) => (
                            <Range id={fieldId} min={0} max={1} step={0.01} value={overlay.opacity} onChange={(e) => setOverlay({ opacity: parseFloat(e.target.value) })} />
                        )}
                    </Field>
                    <Field label="Layer C blend">
                        {(fieldId) => (
                            <Select id={fieldId} value={overlay.blend} options={blendOptions.map(({ short, ...o }) => o)} onChange={(blend) => { checkpoint('Layer C blend'); setOverlay({ blend }) }} />
                        )}
                    </Field>
                </Section>
            )}
        </>
    )
}

function MasterBlend() {
    const blendMode = useStore(appStore, (s) => s.blendMode)
    return (
        <Section title="Blend">
            <Field label="How the top source mixes with the one below">
                {(fieldId) => (
                    <Select id={fieldId} value={blendMode} aria-describedby="blend-hint" options={blendOptions.map(({ short, ...o }) => o)} onChange={(mode) => { checkpoint('blend change'); setBlendMode(mode) }} />
                )}
            </Field>
            <p id="blend-hint" className="text-xs text-dim">{BLEND_HINTS[blendMode]}</p>
        </Section>
    )
}

// The crossfader's settings beyond the fader itself; the strip keeps only the live controls
function CrossfadeSettings() {
    const mixOsc = useStore(appStore, (s) => s.mixOsc)
    const top = useStore(appStore, (s) => s.activeOverlay)
    const topL = LAYER[top].letter
    return (
        <Section title="Crossfade" id="crossfade-settings">
            <Segmented
                label="Source on top"
                value={top}
                options={[{ value: 'videoA', label: 'A on top' }, { value: 'videoB', label: 'B on top' }]}
                onChange={(next) => { if (next !== top) { checkpoint('layer swap'); swapLayers() } }}
            />
            <p className="-mt-1 text-xs text-dim">The blend lays {topL} over the other source; the fader sets how much of {topL} comes through.</p>
            <Toggle pressed={mixOsc.on} onChange={(on) => setMixOsc({ on })}>Oscillate the crossfade</Toggle>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Rate">
                    {(fieldId) => <Select id={fieldId} value={mixOsc.rate} options={rateOptions()} onChange={(rate) => setMixOsc({ rate })} />}
                </Field>
                <Field label="Shape">
                    {(fieldId) => <Select id={fieldId} value={mixOsc.shape} options={shapeOptions} onChange={(shape) => setMixOsc({ shape })} />}
                </Field>
            </div>
        </Section>
    )
}

export function Inspector() {
    const selected = useStore(uiStore, (s) => s.selected)
    return (
        <aside aria-label={`${LAYER[selected].name} settings`} className="flex min-h-0 flex-col border-l border-line bg-panel">
            <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-4">
                <LayerChip layer={selected} />
                <h2 className="text-[14px] font-semibold">{LAYER[selected].name}</h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
                {selected === 'overlay' ? (
                    <OverlayInspector />
                ) : selected === 'master' ? (
                    <>
                        <MasterBlend />
                        <CrossfadeSettings />
                        <Section title="Output effects">
                            <EffectStack target="master" />
                        </Section>
                    </>
                ) : (
                    <SourceInspector key={selected} id={selected} />
                )}
            </div>
        </aside>
    )
}
