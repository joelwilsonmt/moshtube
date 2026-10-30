import { useRef } from 'react'
import { useStore } from 'zustand'
import { ArrowDown, ArrowUp, TriangleAlert, X } from 'lucide-react'
import { appStore, getEffects, setEffects, updateEffect, type FxTarget } from '../store/appStore'
import { checkpoint } from '../store/history'
import { OSC_RATES, WaveShapeSchema, type Effect, type EffectType } from '../store/schema'
import { createEffect, EFFECT_GROUPS, EFFECTS, liveAmount, normalizedAmount } from '../fx/effects'
import { beatsNow } from '../engine/clock'
import { useFrame } from '../hooks/useLive'
import { rateLabel } from './Mixer'
import { Field, IconButton, Range, Select, Toggle } from './ui/core'

// SVG filters on full-frame video get expensive fast
export const MAX_EFFECTS = 4

function EffectTypeOptions() {
    return (
        <>
            {EFFECT_GROUPS.map(({ group, types }) => (
                <optgroup key={group} label={group}>
                    {types.map((t) => <option key={t} value={t}>{EFFECTS[t].label}</option>)}
                </optgroup>
            ))}
        </>
    )
}

const formatValue = (effect: Effect) => {
    const param = EFFECTS[effect.type].param!
    const digits = param.step < 1 ? (param.step < 0.1 ? 2 : 1) : 0
    return `${effect.amount.toFixed(digits)}${param.unit ?? ''}`
}

// Amber tick riding the live value while an effect oscillates (same move as the crossfader)
function LiveMarker({ target, effectId }: { target: FxTarget; effectId: string }) {
    const ref = useRef<HTMLDivElement>(null)
    useFrame(() => {
        const el = ref.current
        const effect = getEffects(appStore.getState(), target).find((e) => e.id === effectId)
        if (!el || !effect) return
        el.style.display = effect.osc.on ? 'block' : 'none'
        if (effect.osc.on) el.style.left = `calc(7px + (100% - 14px) * ${normalizedAmount(effect, liveAmount(effect, beatsNow()))})`
    })
    return <div ref={ref} className="pointer-events-none absolute top-1/2 hidden h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" aria-hidden="true" />
}

function EffectRow({ target, effect, index, count }: { target: FxTarget; effect: Effect; index: number; count: number }) {
    const def = EFFECTS[effect.type]
    const effects = () => getEffects(appStore.getState(), target)

    const move = (dir: -1 | 1) => {
        checkpoint('effect reorder')
        const list = [...effects()]
        ;[list[index], list[index + dir]] = [list[index + dir], list[index]]
        setEffects(target, list)
    }

    const changeType = (type: EffectType) => {
        checkpoint('effect change')
        // Keep the slot and its oscillation; reset the amount to the new effect's default
        updateEffect(target, effect.id, { type, amount: EFFECTS[type].param?.default ?? 1 })
    }

    return (
        <li className="space-y-3 border-t border-line/70 py-3 first:border-t-0 first:pt-0">
            <div className="flex items-center gap-1">
                <span className="w-4 shrink-0 text-xs text-dim" aria-hidden="true">{index + 1}</span>
                <Select aria-label={`Effect ${index + 1}`} value={effect.type} onChange={(e) => changeType(e.target.value as EffectType)} className="flex-1">
                    <EffectTypeOptions />
                </Select>
                <IconButton size="sm" icon={ArrowUp} label={`Move ${def.label} up`} disabled={index === 0} onClick={() => move(-1)} />
                <IconButton size="sm" icon={ArrowDown} label={`Move ${def.label} down`} disabled={index === count - 1} onClick={() => move(1)} />
                <IconButton
                    size="sm"
                    icon={X}
                    label={`Remove ${def.label}`}
                    onClick={() => { checkpoint(`remove ${def.label}`); setEffects(target, effects().filter((e) => e.id !== effect.id)) }}
                />
            </div>

            {def.param && (
                <Field label={effect.osc.on ? `${def.param.label} peak` : def.param.label} value={formatValue(effect)} className="pl-5">
                    {(id) => (
                        <div className="relative">
                            <Range
                                id={id}
                                min={def.param!.min} max={def.param!.max} step={def.param!.step}
                                value={effect.amount}
                                onChange={(e) => updateEffect(target, effect.id, { amount: parseFloat(e.target.value) })}
                            />
                            <LiveMarker target={target} effectId={effect.id} />
                        </div>
                    )}
                </Field>
            )}

            {def.param && (
                <div className="flex items-center gap-1.5 pl-5">
                    <Toggle pressed={effect.osc.on} onChange={(on) => updateEffect(target, effect.id, { osc: { ...effect.osc, on } })}>
                        Oscillate
                    </Toggle>
                    <Select
                        aria-label={`${def.label} oscillation rate`}
                        value={effect.osc.rate}
                        onChange={(e) => updateEffect(target, effect.id, { osc: { ...effect.osc, rate: Number(e.target.value) } })}
                        className="h-7 flex-1 text-xs"
                    >
                        {OSC_RATES.map((r) => <option key={r} value={r}>{rateLabel(r)}</option>)}
                    </Select>
                    <Select
                        aria-label={`${def.label} oscillation shape`}
                        value={effect.osc.shape}
                        onChange={(e) => updateEffect(target, effect.id, { osc: { ...effect.osc, shape: e.target.value as Effect['osc']['shape'] } })}
                        className="h-7 flex-1 text-xs capitalize"
                    >
                        {WaveShapeSchema.options.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </div>
            )}

            {def.flashing && (
                <p className="flex items-start gap-1.5 pl-5 text-xs text-dim">
                    <TriangleAlert size={13} aria-hidden="true" className="mt-px shrink-0 text-signal" />
                    Flashing effect. Capped at 3 flashes per second and never picked by the randomizers.
                </p>
            )}
        </li>
    )
}

export function EffectStack({ target }: { target: FxTarget }) {
    const effects = useStore(appStore, (s) => getEffects(s, target))
    const full = effects.length >= MAX_EFFECTS

    return (
        <div className="space-y-3">
            {effects.length > 0 ? (
                <ol>
                    {effects.map((e, i) => <EffectRow key={e.id} target={target} effect={e} index={i} count={effects.length} />)}
                </ol>
            ) : (
                <p className="text-[13px] text-dim">
                    {target === 'master'
                        ? 'Output effects apply on top of both sources after they are blended.'
                        : 'No effects yet. Add one below, or press Mosh to roll random ones.'}
                </p>
            )}
            <Select
                aria-label="Add effect"
                value=""
                disabled={full}
                onChange={(e) => {
                    if (!e.target.value) return
                    checkpoint('add effect')
                    setEffects(target, [...effects, createEffect(e.target.value as EffectType)])
                }}
            >
                <option value="">{full ? `Up to ${MAX_EFFECTS} effects` : '+ Add effect'}</option>
                <EffectTypeOptions />
            </Select>
        </div>
    )
}
