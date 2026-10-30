// Original Lottie animations for Layer C, authored in code (no third-party files or licenses).
// Each is one seamless loop drawn in white on a 1920x1080 frame; the overlay tints it with
// the Layer C hue and drives the frame from the beat clock, so a loop always lasts N beats.

const W = 1920
const H = 1080
const FRAMES = 120
const WHITE = [1, 1, 1, 1]

type Value = number[]
type Keyframe = { t: number; s: Value; h?: 1; o?: { x: number[]; y: number[] }; i?: { x: number[]; y: number[] } }

const still = (k: unknown) => ({ a: 0, k })
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

// Open or closed path through the given points (straight segments)
const path = (points: Value[], closed = false) => ({
    ty: 'sh',
    ks: still({ i: points.map(() => [0, 0]), o: points.map(() => [0, 0]), v: points, c: closed }),
})

// A value that moves through `samples` evenly across the loop (eased), ending where it started
function cycle(samples: Value[]): Keyframe[] {
    const step = FRAMES / samples.length
    return [...samples.map((s, k) => ({ t: k * step, s, o: { x: [0.4], y: [0] }, i: { x: [0.6], y: [1] } })), { t: FRAMES, s: samples[0] }]
}

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
            { t: b * 30 + 22, s: [100, h], ...EASE_OUT },
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
    squares: () => animation('Squares', [0, 1, 2, 3].map((i) =>
        layer([group([rect(220, 220), stroke(8)])], {
            s: moving(loopRamp([10, 10, 100], [900, 900, 100], i / 4)),
            o: moving(loopRamp([100], [0], i / 4)),
            r: moving(loopRamp([0], [90], i / 4)),
        })
    )),
    dots: () => animation('Dots', [layer(Array.from({ length: 16 * 9 }, (_, n) => {
        const x = n % 16
        const y = Math.floor(n / 16)
        const keys: Keyframe[] = [0, 1, 2, 3].flatMap((b) => {
            const lit = seeded(n * 3.1 + b * 17.7) > 0.62
            return [{ t: b * 30, s: [lit ? 100 : 12], h: 1 as const }]
        })
        keys.push({ t: FRAMES, s: keys[0].s })
        return group([ellipse(30, [-W / 2 + 120 + x * 112, -H / 2 + 100 + y * 110]), fill()], transform({ o: moving(keys) }))
    }))]),
    rain: () => animation('Rain', [layer(Array.from({ length: 22 }, (_, i) => {
        const x = -W / 2 + seeded(i * 4.7) * W
        const phase = seeded(i * 9.3)
        return group([rect(5, 140 + seeded(i) * 160), fill()], transform({
            p: moving(loopRamp([x, -H / 2 - 300], [x, H / 2 + 300], phase)),
            o: still(40 + seeded(i * 2.1) * 60),
        }))
    }))]),
    wave: () => animation('Wave', [layer(Array.from({ length: 28 }, (_, i) => {
        const x = -W / 2 + 120 + i * ((W - 240) / 27)
        const samples = Array.from({ length: 8 }, (_, k) => [x, Math.sin((k / 8 + i / 28) * Math.PI * 2) * 220])
        return group([ellipse(34), fill()], transform({ p: moving(cycle(samples)) }))
    }))]),
    flower: () => animation('Flower', [
        layer([group([star(6, 120, 380), stroke(6)])], { r: moving(loopRamp([0], [60])) }),
        layer([group([star(8, 80, 250), stroke(5)])], { r: moving(loopRamp([0], [-90])) }),
        layer([group([star(5, 40, 130), fill()])], { r: moving(loopRamp([0], [144])), s: moving(onBeats([125, 125, 100], [100, 100, 100])) }),
    ]),
    pinwheel: () => animation('Pinwheel', [
        layer(Array.from({ length: 6 }, (_, i) =>
            group([rect(80, 360, [0, -220]), fill()], transform({ r: still(i * 60), o: still(i % 2 ? 55 : 100) }))
        ), { r: moving(loopRamp([0], [120])), s: moving(onBeats([112, 112, 100], [96, 96, 100])) }),
    ]),
    crosshair: () => animation('Crosshair', [
        layer([
            group([ellipse(520), stroke(4)]),
            group([ellipse(260), stroke(4)]),
            group([path([[-420, 0], [-150, 0]]), path([[150, 0], [420, 0]]), path([[0, -420], [0, -150]]), path([[0, 150], [0, 420]]), stroke(4)]),
            group([ellipse(24), fill()]),
        ], { r: moving(loopRamp([0], [90])), s: moving(onBeats([108, 108, 100], [100, 100, 100])) }),
    ]),
    tiles: () => animation('Tiles', [layer(Array.from({ length: 10 * 5 }, (_, n) => {
        const x = n % 10
        const y = Math.floor(n / 10)
        const phase = ((x + y) % 10) / 10
        return group([rect(150, 150), fill()], transform({
            p: still([-W / 2 + 150 + x * 180, -H / 2 + 150 + y * 195]),
            s: moving(cycle([0, 1, 2, 3].map((k) => [Math.abs(Math.cos((k / 4 + phase) * Math.PI)) * 100, 100]))),
            o: still((x + y) % 2 ? 35 : 90),
        }))
    }))]),
    zigzag: () => animation('Zigzag', [0, 1, 2].map((row) => {
        const period = 240
        const points = Array.from({ length: 26 }, (_, k) => [-W / 2 - period * 1.5 + k * (period / 2), k % 2 ? -60 : 60])
        return layer([group([path(points), stroke(10)])], {
            p: moving(loopRamp([W / 2, H / 2 + (row - 1) * 300, 0], [W / 2 + (row % 2 ? -period : period), H / 2 + (row - 1) * 300, 0])),
            o: still(row === 1 ? 100 : 50),
        })
    })),
    sun: () => animation('Sun', [
        layer([group([ellipse(260), fill()])], { s: moving(onBeats([112, 112, 100], [100, 100, 100])) }),
        layer(Array.from({ length: 16 }, (_, i) =>
            group([rect(18, i % 2 ? 120 : 200, [0, -280]), fill()], transform({ r: still(i * 22.5) }))
        ), { r: moving(loopRamp([0], [45])), s: moving(onBeats([118, 118, 100], [100, 100, 100])) }),
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
    squares: 'Squares',
    dots: 'Dots',
    rain: 'Rain',
    wave: 'Wave',
    flower: 'Flower',
    pinwheel: 'Pinwheel',
    crosshair: 'Crosshair',
    tiles: 'Tiles',
    zigzag: 'Zigzag',
    sun: 'Sun',
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
