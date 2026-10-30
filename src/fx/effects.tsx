import type { ReactNode } from 'react'
import type { Effect, EffectType, WaveShape } from '../store/schema'
import { EffectTypeSchema, OSC_RATES, WaveShapeSchema } from '../store/schema'

// Effects are CSS filter functions, SVG filters, or transforms applied to a layer wrapper.
// Values change every frame (oscillation), so SVG attributes are written imperatively.

// SVG filters on full-frame video get expensive fast
export const MAX_EFFECTS = 4

export interface EffectParam {
    label: string
    min: number
    max: number
    step: number
    default: number
    unit?: string
}

interface SvgFx {
    markup: () => ReactNode
    update: (filter: Element, v: number) => void
}

export interface EffectDef {
    label: string
    group: 'Color' | 'Distort' | 'Texture' | 'Motion'
    param?: EffectParam
    css?: (v: number, ctx: FxContext) => string
    svg?: SvgFx
    transform?: (v: number) => string
    scanlines?: boolean
    flashing?: boolean // excluded from randomizers; flash rate capped
}

export interface FxContext {
    beats: number
    bpm: number
}

const set = (filter: Element, key: string, attr: string, value: string | number) =>
    filter.querySelector(`[data-k="${key}"]`)?.setAttribute(attr, String(value))

const steps = (n: number) => Array.from({ length: n + 1 }, (_, i) => (i / n).toFixed(3)).join(' ')

const hsl = (h: number, s: number, l: number) => {
    // returns [r, g, b] in 0..1
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
        const k = (n + h / 30) % 12
        return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    }
    return [f(0), f(8), f(4)]
}

const displacement = (frequency: string, octaves: number): SvgFx => ({
    markup: () => (
        <>
            <feTurbulence type="turbulence" baseFrequency={frequency} numOctaves={octaves} result="noise" />
            <feDisplacementMap data-k="disp" in="SourceGraphic" in2="noise" scale={0} />
        </>
    ),
    update: (f, v) => set(f, 'disp', 'scale', v),
})

export const EFFECTS: Record<EffectType, EffectDef> = {
    trippy: {
        label: 'Trippy', group: 'Color',
        param: { label: 'Color shift', min: 0, max: 360, step: 10, default: 180, unit: '°' },
        css: (v) => `invert(100%) hue-rotate(${v}deg) contrast(150%)`,
    },
    predator: {
        label: 'Predator', group: 'Color',
        param: { label: 'Heat shift', min: 0, max: 360, step: 10, default: 180, unit: '°' },
        css: (v) => `invert(1) hue-rotate(${v}deg) saturate(200%)`,
    },
    solarize: {
        label: 'Solarize', group: 'Color',
        param: { label: 'Contrast', min: 100, max: 300, step: 5, default: 150, unit: '%' },
        css: (v) => `invert(100%) contrast(${v}%)`,
    },
    xray: {
        label: 'X-ray', group: 'Color',
        param: { label: 'Density', min: 0, max: 1, step: 0.05, default: 1 },
        css: (v) => `grayscale(1) invert(${v}) contrast(1.2)`,
    },
    ink: {
        label: 'Ink', group: 'Color',
        param: { label: 'Contrast', min: 1, max: 5, step: 0.1, default: 3 },
        css: (v) => `grayscale(1) contrast(${v}) brightness(1.2)`,
    },
    duotone: {
        label: 'Duotone', group: 'Color',
        param: { label: 'Hue', min: 0, max: 360, step: 5, default: 200, unit: '°' },
        svg: {
            markup: () => (
                <>
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                        <feFuncR data-k="r" type="table" tableValues="0 1" />
                        <feFuncG data-k="g" type="table" tableValues="0 1" />
                        <feFuncB data-k="b" type="table" tableValues="0 1" />
                    </feComponentTransfer>
                </>
            ),
            update: (f, v) => {
                const dark = hsl((v + 180) % 360, 0.7, 0.12)
                const light = hsl(v, 0.9, 0.72)
                ;(['r', 'g', 'b'] as const).forEach((k, i) => set(f, k, 'tableValues', `${dark[i].toFixed(3)} ${light[i].toFixed(3)}`))
            },
        },
    },
    threshold: {
        label: '1-bit', group: 'Color',
        param: { label: 'Threshold', min: 5, max: 95, step: 5, default: 50, unit: '%' },
        svg: {
            markup: () => (
                <>
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                        <feFuncR data-k="r" type="discrete" tableValues="0 1" />
                        <feFuncG data-k="g" type="discrete" tableValues="0 1" />
                        <feFuncB data-k="b" type="discrete" tableValues="0 1" />
                    </feComponentTransfer>
                </>
            ),
            update: (f, v) => {
                const cut = Math.round(v / 5)
                const table = Array.from({ length: 20 }, (_, i) => (i < cut ? 0 : 1)).join(' ')
                ;['r', 'g', 'b'].forEach((k) => set(f, k, 'tableValues', table))
            },
        },
    },
    posterize: {
        label: 'Posterize', group: 'Color',
        param: { label: 'Levels', min: 2, max: 16, step: 1, default: 4 },
        svg: {
            markup: () => (
                <feComponentTransfer>
                    <feFuncR data-k="r" type="discrete" tableValues="0 1" />
                    <feFuncG data-k="g" type="discrete" tableValues="0 1" />
                    <feFuncB data-k="b" type="discrete" tableValues="0 1" />
                </feComponentTransfer>
            ),
            update: (f, v) => {
                const table = steps(Math.max(1, Math.round(v)))
                ;['r', 'g', 'b'].forEach((k) => set(f, k, 'tableValues', table))
            },
        },
    },
    wavy: {
        label: 'Wavy', group: 'Distort',
        param: { label: 'Distortion', min: 0, max: 100, step: 1, default: 40 },
        svg: displacement('0.01', 5),
    },
    glitch: {
        label: 'Glitch', group: 'Distort',
        param: { label: 'Tear', min: 0, max: 100, step: 1, default: 30 },
        svg: displacement('0.5 0.05', 2),
    },
    pixelate: {
        label: 'Smear', group: 'Distort',
        param: { label: 'Size', min: 0, max: 32, step: 1, default: 8, unit: 'px' },
        svg: {
            markup: () => <feMorphology data-k="m" operator="dilate" radius={0} in="SourceGraphic" />,
            update: (f, v) => set(f, 'm', 'radius', v),
        },
    },
    rgbsplit: {
        label: 'RGB split', group: 'Distort',
        param: { label: 'Offset', min: 0, max: 30, step: 1, default: 8, unit: 'px' },
        svg: {
            markup: () => (
                <>
                    <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
                    <feOffset data-k="r" in="r" dx={0} dy={0} result="ro" />
                    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
                    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
                    <feOffset data-k="b" in="b" dx={0} dy={0} result="bo" />
                    <feBlend in="ro" in2="g" mode="screen" result="rg" />
                    <feBlend in="rg" in2="bo" mode="screen" />
                </>
            ),
            update: (f, v) => {
                set(f, 'r', 'dx', v)
                set(f, 'b', 'dx', -v)
            },
        },
    },
    scanlines: {
        label: 'Scanlines', group: 'Texture',
        param: { label: 'Line height', min: 2, max: 10, step: 1, default: 3, unit: 'px' },
        css: () => 'contrast(120%) brightness(110%)',
        scanlines: true,
    },
    vcr: {
        label: 'VCR', group: 'Texture',
        param: { label: 'Degradation', min: 0, max: 2, step: 0.1, default: 1 },
        css: (v) => `blur(${v * 0.5}px) sepia(${50 * v}%) contrast(${100 + 50 * v}%) saturate(${100 + 50 * v}%)`,
    },
    grain: {
        label: 'Grain', group: 'Texture',
        param: { label: 'Amount', min: 0, max: 1, step: 0.05, default: 0.5 },
        svg: {
            markup: () => (
                <>
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" result="noise" />
                    <feColorMatrix data-k="a" in="noise" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0" result="grain" />
                    <feBlend in="SourceGraphic" in2="grain" mode="overlay" />
                </>
            ),
            update: (f, v) => set(f, 'a', 'values', `0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 ${v.toFixed(2)}`),
        },
    },
    glow: {
        label: 'Glow', group: 'Texture',
        param: { label: 'Radius', min: 0, max: 20, step: 1, default: 10, unit: 'px' },
        css: (v) => `drop-shadow(0 0 ${v}px rgba(255,255,255,0.8)) brightness(1.2)`,
    },
    dream: {
        label: 'Dream', group: 'Texture',
        param: { label: 'Softness', min: 0, max: 20, step: 1, default: 5, unit: 'px' },
        css: (v) => `blur(${v}px) brightness(1.2) saturate(150%)`,
    },
    mirror: {
        label: 'Mirror', group: 'Motion',
        transform: () => 'scaleX(-1)',
    },
    zoom: {
        label: 'Zoom', group: 'Motion',
        param: { label: 'Scale', min: 1, max: 3, step: 0.05, default: 1.4, unit: '×' },
        transform: (v) => `scale(${v})`,
    },
    rotate: {
        label: 'Rotate', group: 'Motion',
        param: { label: 'Angle', min: 0, max: 360, step: 5, default: 20, unit: '°' },
        transform: (v) => `rotate(${v}deg) scale(${1 + Math.abs(Math.sin((v * Math.PI) / 180)) * 0.45})`,
    },
    strobe: {
        label: 'Strobe', group: 'Motion',
        param: { label: 'Depth', min: 0, max: 0.8, step: 0.05, default: 0.6 },
        flashing: true,
        // Dims on the beat; never more than 3 flashes per second (WCAG 2.3.1)
        css: (v, { beats, bpm }) => {
            const every = Math.max(1, Math.ceil(bpm / 180))
            const on = (beats % every) / every < 0.12
            return on ? `brightness(${(1 - v).toFixed(2)})` : ''
        },
    },
}

export const EFFECT_GROUPS = (['Color', 'Distort', 'Texture', 'Motion'] as const).map((group) => ({
    group,
    types: EffectTypeSchema.options.filter((t) => EFFECTS[t].group === group),
}))

// phase in [0, 1) -> [0, 1]; every shape starts at 0
export function wave(shape: WaveShape, phase: number) {
    switch (shape) {
        case 'sine': return (1 - Math.cos(phase * Math.PI * 2)) / 2
        case 'triangle': return phase < 0.5 ? phase * 2 : 2 - phase * 2
        case 'square': return phase < 0.5 ? 1 : 0
        case 'saw': return phase
    }
}

export function liveAmount(effect: Effect, beats: number) {
    const param = EFFECTS[effect.type].param
    if (!param) return 0
    if (!effect.osc.on) return effect.amount
    return param.min + (effect.amount - param.min) * wave(effect.osc.shape, (beats / effect.osc.rate) % 1)
}

// 0..1 position of a value within its parameter range (for meters)
export function normalizedAmount(effect: Effect, value: number) {
    const param = EFFECTS[effect.type].param
    if (!param) return 1
    return (value - param.min) / (param.max - param.min)
}

export interface AppliedFx {
    filter: string
    transform: string
    scanlineHeight: number | null
}

const lastWritten = new WeakMap<Element, number>()

// Builds the CSS for one layer's stack and pushes live values into its SVG filters
export function applyFx(effects: Effect[], scope: string, ctx: FxContext): AppliedFx {
    const filters: string[] = []
    const transforms: string[] = []
    let scanlineHeight: number | null = null

    for (const effect of effects) {
        const def = EFFECTS[effect.type]
        const v = liveAmount(effect, ctx.beats)
        if (def.css) {
            const css = def.css(v, ctx)
            if (css) filters.push(css)
        }
        if (def.svg) {
            const el = document.getElementById(fxFilterId(scope, effect.id))
            if (el) {
                if (lastWritten.get(el) !== v) {
                    def.svg.update(el, v)
                    lastWritten.set(el, v)
                }
                filters.push(`url(#${fxFilterId(scope, effect.id)})`)
            }
        }
        if (def.transform) transforms.push(def.transform(v))
        if (def.scanlines) scanlineHeight = Math.max(2, Math.round(v))
    }

    return { filter: filters.join(' ') || 'none', transform: transforms.join(' ') || 'none', scanlineHeight }
}

export const fxFilterId = (scope: string, effectId: string) => `fx-${scope}-${effectId}`

export function FxDefs({ effects, scope }: { effects: Effect[]; scope: string }) {
    const svgEffects = effects.filter((e) => EFFECTS[e.type].svg)
    if (!svgEffects.length) return null
    return (
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
            <defs>
                {svgEffects.map((e) => (
                    <filter key={e.id} id={fxFilterId(scope, e.id)} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
                        {EFFECTS[e.type].svg!.markup()}
                    </filter>
                ))}
            </defs>
        </svg>
    )
}

const newId = () => Math.random().toString(36).slice(2, 8)

export function createEffect(type: EffectType, overrides: Partial<Effect> = {}): Effect {
    const param = EFFECTS[type].param
    return {
        id: newId(),
        type,
        amount: param?.default ?? 1,
        osc: { on: false, rate: 16, shape: 'sine' },
        keep: false,
        ...overrides,
    }
}

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]

// A random amount in the useful part of an effect's range (not the very bottom)
export function randomAmount(type: EffectType) {
    const param = EFFECTS[type].param
    if (!param) return 1
    const amount = param.min + (0.35 + Math.random() * 0.65) * (param.max - param.min)
    return Math.round(amount / param.step) * param.step
}

// `exclude` keeps one roll from stacking the same effect twice
export function randomEffect(exclude: EffectType[] = []): Effect {
    const type = pick(EffectTypeSchema.options.filter((t) => !EFFECTS[t].flashing && !exclude.includes(t)))
    const param = EFFECTS[type].param
    const osc = param && Math.random() > 0.5
        ? { on: true, rate: pick(OSC_RATES.filter((r) => r >= 4)), shape: pick(WaveShapeSchema.options) }
        : { on: false, rate: 16, shape: 'sine' as const }
    return createEffect(type, { amount: randomAmount(type), osc })
}
