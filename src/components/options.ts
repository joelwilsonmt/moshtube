import type { AppState } from '../store/schema'
import { BlendModeSchema, OSC_RATES, WaveShapeSchema } from '../store/schema'
import { EFFECT_GROUPS, EFFECTS } from '../fx/effects'
import type { SelectOption } from './ui/Select'

export const BLEND_LABELS: Record<AppState['blendMode'], string> = {
    normal: 'Normal',
    multiply: 'Multiply (darker)',
    screen: 'Screen (brighter)',
    overlay: 'Overlay (contrast)',
    difference: 'Difference (invert)',
    exclusion: 'Exclusion (soft invert)',
}

// One line on what each blend does to the picture, for the Master inspector
export const BLEND_HINTS: Record<AppState['blendMode'], string> = {
    normal: 'The top source covers the one below; the crossfade fades between them.',
    multiply: 'Darks from both sources stack up. Black wins, white disappears.',
    screen: 'Lights from both sources add up. White wins, black disappears.',
    overlay: 'Boosts contrast: brights get brighter and darks darker where they meet.',
    difference: 'Subtracts one source from the other, so matching areas go black and colors invert.',
    exclusion: 'Like Difference but softer and grayer.',
}

export const rateLabel = (beats: number) =>
    beats < 4 ? `${beats} beat${beats === 1 ? '' : 's'}` : `${beats / 4} bar${beats === 4 ? '' : 's'}`

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const rateOptions = (rates: readonly number[] = OSC_RATES): SelectOption<number>[] =>
    rates.map((r) => ({ value: r, label: rateLabel(r) }))

export const shapeOptions: SelectOption<AppState['mixOsc']['shape']>[] =
    WaveShapeSchema.options.map((s) => ({ value: s, label: cap(s) }))

export const blendOptions: SelectOption<AppState['blendMode']>[] =
    BlendModeSchema.options.map((m) => ({ value: m, label: BLEND_LABELS[m], short: BLEND_LABELS[m].split(' ')[0] }))

export const effectOptions = EFFECT_GROUPS.flatMap(({ group, types }) =>
    types.map((t) => ({ value: t, label: EFFECTS[t].label, group })))
