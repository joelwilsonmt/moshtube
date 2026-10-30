import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { Shuffle } from 'lucide-react'
import { appStore, setOverlay, updateVideoState } from '../store/appStore'
import { PATTERN_LABELS } from '../fx/patterns'
import { overlayErrorStore } from './OverlayLayer'
import { checkpoint } from '../store/history'
import { uiStore } from '../store/uiStore'
import { BlendModeSchema, PatternSchema, type Overlay, type Pattern, type SourceId } from '../store/schema'
import { usePlayhead, useVideoTitle } from '../hooks/useLive'
import { formatTime, parseTime } from '../utils/time'
import { loadRandomVideo, parseYouTubeId, videoErrorStore } from '../utils/youtube'
import { DualRangeSlider } from './ui/DualRangeSlider'
import { Button, Field, IconButton, Input, Range, Section, Segmented, Select } from './ui/core'
import { EffectStack } from './EffectStack'
import { MyVideos } from './Library'
import { BLEND_LABELS, LAYER, LayerChip } from './Mixer'

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
            checkpoint()
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
                            <IconButton icon={Shuffle} label="Random video" onClick={() => { checkpoint(); void loadRandomVideo(id, FULL_LOOP) }} className="border border-edge" />
                        </div>
                    )}
                </Field>
                <div id={`${id}-msg`} aria-live="polite" className="-mt-1 space-y-1 text-xs">
                    {draftInvalid && <p className="text-dim">Paste a YouTube link or an 11-character video ID.</p>}
                    {playerError && <p className="text-danger">{playerError} Try another link or press Random video.</p>}
                    {!draftInvalid && !playerError && title && <p className="truncate text-dim" title={title}>{title}</p>}
                </div>
                <MyVideos />
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
                        { value: 'media', label: 'Video or GIF' },
                    ]}
                    onChange={(kind) => { checkpoint(); setOverlay({ kind }) }}
                />
                {overlay.kind === 'pattern' && (
                    <>
                        <Field label="Pattern">
                            {(fieldId) => (
                                <Select id={fieldId} value={overlay.pattern} onChange={(e) => { checkpoint(); setOverlay({ pattern: e.target.value as Pattern }) }}>
                                    {PatternSchema.options.map((p) => <option key={p} value={p}>{PATTERN_LABELS[p]}</option>)}
                                </Select>
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
                {overlay.kind === 'media' && (
                    <form
                        className="space-y-1.5"
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (!urlValid) return
                            checkpoint()
                            setOverlay({ url: url.trim() })
                        }}
                    >
                        <label htmlFor="overlay-url" className="text-xs font-medium text-dim">Direct link to a video or GIF</label>
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
                    <p className="text-[13px] text-dim">Layer C sits over both sources: a tempo-synced pattern, or a transparent video or GIF from a link.</p>
                )}
            </Section>
            {overlay.kind !== 'off' && (
                <Section title="Mix">
                    <Field label="Opacity" value={`${Math.round(overlay.opacity * 100)}%`}>
                        {(fieldId) => (
                            <Range id={fieldId} min={0} max={1} step={0.01} value={overlay.opacity} onChange={(e) => setOverlay({ opacity: parseFloat(e.target.value) })} />
                        )}
                    </Field>
                    <Field label="Blend">
                        {(fieldId) => (
                            <Select id={fieldId} value={overlay.blend} onChange={(e) => { checkpoint(); setOverlay({ blend: e.target.value as Overlay['blend'] }) }}>
                                {BlendModeSchema.options.map((m) => <option key={m} value={m}>{BLEND_LABELS[m]}</option>)}
                            </Select>
                        )}
                    </Field>
                </Section>
            )}
        </>
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
                    <Section title="Output effects">
                        <EffectStack target="master" />
                    </Section>
                ) : (
                    <SourceInspector key={selected} id={selected} />
                )}
            </div>
        </aside>
    )
}
