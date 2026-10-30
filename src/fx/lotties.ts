// Original Lottie animations for Layer C, authored in code (no third-party files or licenses).
// Each is one seamless loop drawn in white on a 1920x1080 frame; the overlay tints it with
// the Layer C hue and drives the frame from the beat clock, so a loop always lasts N beats.

const W = 1920
const H = 1080
const FRAMES = 120
const WHITE = [1, 1, 1, 1]

type Value = number[]
type Keyframe = { t: number; s: Value; h?: 1; o?: { x: number[]; y: number[] }; i?: { x: number[]; y: number[] } }

const still = (k: number | number[]) => ({ a: 0, k })
const moving = (k: Keyframe[]) => ({ a: 1, k })
const LINEAR = { o: { x: [0], y: [0] }, i: { x: [1], y: [1] } }
const EASE_OUT = { o: { x: [0.16], y: [1] }, i: { x: [0.3], y: [1] } }

// `from` → `to` once per loop, starting `phase` (0..1) of the way through, so staggered
// copies stay seamless
function loopRamp(from: Value, to: Value, phase = 0): Keyframe[] {
    if (phase === 0) return [{ t: 0, s: from, ...LINEAR }, { t: FRAMES, s: to }]
    const at = (p: number) => from.map((f, i) => f + (to[i] - f) * p)
    const wrap = Math.round(FRAMES * (1 - phase))
    return [
        { t: 0, s: at(phase), ...LINEAR },
        { t: wrap, s: to, h: 1 },
        { t: wrap + 1, s: from, ...LINEAR },
        { t: FRAMES, s: at(phase) },
    ]
}

// A value that kicks to `peak` on each of the loop's four beats and settles to `rest`
function onBeats(peak: Value, rest: Value, beats = 4): Keyframe[] {
    const step = FRAMES / beats
    const keys: Keyframe[] = []
    for (let b = 0; b < beats; b++) {
        keys.push({ t: b * step, s: peak, ...EASE_OUT }, { t: b * step + step * 0.7, s: rest, h: 1 })
    }
    keys.push({ t: FRAMES, s: peak })
    return keys
}

const transform = (over: Partial<Record<'p' | 'a' | 's' | 'r' | 'o', unknown>> = {}) => ({
    ty: 'tr',
    p: still([0, 0]),
    a: still([0, 0]),
    s: still([100, 100]),
    r: still(0),
    o: still(100),
    sk: still(0),
    sa: still(0),
    ...over,
})

const stroke = (width: number) => ({ ty: 'st', c: still(WHITE), o: still(100), w: still(width), lc: 2, lj: 2 })
const fill = () => ({ ty: 'fl', c: still(WHITE), o: still(100), r: 1 })
const group = (items: unknown[], tr = transform()) => ({ ty: 'gr', it: [...items, tr] })
const ellipse = (size: number, at: Value = [0, 0]) => ({ ty: 'el', p: still(at), s: still([size, size]), d: 1 })
const rect = (w: number, h: number, at: Value = [0, 0]) => ({ ty: 'rc', p: still(at), s: still([w, h]), r: still(0), d: 1 })
const polygon = (points: number, radius: number) => ({ ty: 'sr', sy: 2, d: 1, pt: still(points), p: still([0, 0]), r: still(0), or: still(radius), os: still(0) })
const star = (points: number, inner: number, outer: number) => ({
    ty: 'sr', sy: 1, d: 1, pt: still(points), p: still([0, 0]), r: still(0), ir: still(inner), is: still(0), or: still(outer), os: still(0),
})

let layerIndex = 0
function layer(shapes: unknown[], ks: Partial<Record<'o' | 'r' | 'p' | 's', unknown>> = {}) {
    return {
        ddd: 0, ind: ++layerIndex, ty: 4, nm: `layer ${layerIndex}`, sr: 1, ao: 0, bm: 0,
        ip: 0, op: FRAMES, st: 0,
        ks: { o: still(100), r: still(0), p: still([W / 2, H / 2, 0]), a: still([0, 0, 0]), s: still([100, 100, 100]), ...ks },
        shapes,
    }
}

const animation = (name: string, layers: unknown[]) => ({ v: '5.7.4', nm: name, fr: 60, ip: 0, op: FRAMES, w: W, h: H, ddd: 0, assets: [], layers })

// Deterministic "random" bar heights so the loop is the same every time
const seeded = (n: number) => {
    const x = Math.sin(n * 12.9898) * 43758.5453
    return x - Math.floor(x)
}

const BUILDERS = {
    rings: () => animation('Rings', [0, 1, 2].map((i) =>
        layer([group([ellipse(160), stroke(10)])], {
            s: moving(loopRamp([20, 20, 100], [1400, 1400, 100], i / 3)),
            o: moving(loopRamp([100], [0], i / 3)),
        })
    )),
    bars: () => animation('Bars', [layer(Array.from({ length: 12 }, (_, i) => {
        const heights = [0, 1, 2, 3].map((b) => [100, 15 + seeded(i * 7 + b) * 85])
        const keys: Keyframe[] = heights.flatMap(([, h], b) => [
            { t: b * 30, s: [100, 100], ...EASE_OUT },
            { t: b * 30 + 22, s: [100, h] },
        ]) as Keyframe[]
        keys.push({ t: FRAMES, s: [100, 100] })
        return group([rect(90, 700, [0, -350]), fill()], transform({ p: still([-W / 2 + 160 + i * 145, H / 2 - 80]), s: moving(keys) }))
    }))]),
    spin: () => animation('Spin', [
        layer([group([polygon(3, 380), stroke(12)])], { r: moving(loopRamp([0], [360])) }),
        layer([group([polygon(4, 220), stroke(8)])], { r: moving(loopRamp([0], [-360])), s: moving(onBeats([118, 118, 100], [100, 100, 100])) }),
    ]),
    burst: () => animation('Burst', [
        layer([group([star(8, 100, 420), fill()])], {
            r: moving(loopRamp([0], [90])),
            s: moving(onBeats([150, 150, 100], [70, 70, 100])),
            o: moving(onBeats([100], [55])),
        }),
    ]),
    orbit: () => animation('Orbit', [
        layer(Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2
            return group([ellipse(56, [Math.cos(a) * 340, Math.sin(a) * 340]), fill()])
        }), { r: moving(loopRamp([0], [360])) }),
        layer(Array.from({ length: 3 }, (_, i) => {
            const a = (i / 3) * Math.PI * 2
            return group([ellipse(36, [Math.cos(a) * 170, Math.sin(a) * 170]), fill()])
        }), { r: moving(loopRamp([0], [-720])) }),
        layer([group([ellipse(680), stroke(3)])], { o: still(45) }),
    ]),
    scan: () => animation('Scan', [
        layer([
            group([rect(W + 40, 10), fill()]),
            group([rect(W + 40, 160, [0, -90]), fill()], transform({ o: still(18) })),
        ], { p: moving(loopRamp([W / 2, -100, 0], [W / 2, H + 200, 0])) }),
    ]),
} as const

export type BuiltInLottie = keyof typeof BUILDERS

export const LOTTIE_LABELS: Record<BuiltInLottie, string> = {
    rings: 'Rings',
    bars: 'Bars',
    spin: 'Spin',
    burst: 'Burst',
    orbit: 'Orbit',
    scan: 'Scan',
}

export const BUILT_IN_LOTTIES = Object.keys(BUILDERS) as BuiltInLottie[]

export const isBuiltInLottie = (value: string): value is BuiltInLottie => value in BUILDERS

const cache = new Map<BuiltInLottie, object>()

export function builtInLottie(name: BuiltInLottie) {
    if (!cache.has(name)) {
        layerIndex = 0
        cache.set(name, BUILDERS[name]())
    }
    return cache.get(name)!
}
