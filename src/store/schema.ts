import { z } from 'zod'

export const EffectTypeSchema = z.enum([
  // color
  'trippy', 'predator', 'solarize', 'xray', 'ink', 'duotone', 'threshold', 'posterize',
  // distort
  'wavy', 'glitch', 'pixelate', 'rgbsplit',
  // texture
  'scanlines', 'vcr', 'grain', 'glow', 'dream',
  // motion
  'mirror', 'zoom', 'rotate', 'strobe',
])

export const WaveShapeSchema = z.enum(['sine', 'triangle', 'square', 'saw'])

export const BlendModeSchema = z.enum([
  'normal',
  'multiply',
  'screen',
  'overlay',
  'difference',
  'exclusion'
])

export const PatternSchema = z.enum(['plasma', 'tunnel', 'grid', 'noise', 'kaleido', 'warp', 'ripple', 'moire', 'cells', 'lava'])

// Layer C: our own content composited over A/B (generative patterns or a transparent video/GIF)
export const OverlaySchema = z.object({
  kind: z.enum(['off', 'pattern', 'lottie', 'media']).default('off'),
  pattern: PatternSchema.default('plasma'),
  hue: z.number().min(0).max(360).default(280),
  url: z.string().default(''),
  lottie: z.string().default('rings'), // a built-in animation name, or a link to Lottie JSON
  loopBeats: z.number().default(4), // one animation loop lasts this many beats
  opacity: z.number().min(0).max(1).default(0.7),
  blend: BlendModeSchema.default('screen'),
  hold: z.boolean().default(false), // randomizers skip layer C
})

export const MoshScopeSchema = z.enum(['mosh', 'everything', 'daddy'])
export const AUTO_MOSH_BARS = [1, 2, 4, 8, 16] as const

// Oscillation rate is in beats per full cycle, synced to the tempo clock
export const OSC_RATES = [1, 2, 4, 8, 16, 32] as const

export const OscSchema = z.object({
  on: z.boolean().default(false),
  rate: z.number().default(16),
  shape: WaveShapeSchema.default('sine'),
})

export const EffectSchema = z.object({
  id: z.string(),
  type: EffectTypeSchema,
  amount: z.number(), // peak value; oscillation sweeps from the effect's min up to this
  osc: OscSchema,
})

export const VideoStateSchema = z.object({
  id: z.string().optional(), // YouTube Video ID
  start: z.number().default(0),
  end: z.number().default(0),
  duration: z.number().default(100),
  loop: z.boolean().default(true),
  playing: z.boolean().default(true),
  lastInteraction: z.number().optional(), // Timestamp of last user edit
  effects: z.array(EffectSchema).default([]),
  hold: z.boolean().default(false), // randomizers skip this layer
  seek: z.object({
      time: z.number(),
      trigger: z.number()
  }).optional(),
})

export const AppStateSchema = z.object({
  videoA: VideoStateSchema,
  videoB: VideoStateSchema,
  blendMode: BlendModeSchema.default('normal'),
  mix: z.number().min(0).max(1).default(0.5), // Top layer opacity
  mixOsc: OscSchema,
  activeOverlay: z.enum(['videoA', 'videoB']).default('videoA'),
  masterEffects: z.array(EffectSchema).default([]),
  overlay: OverlaySchema,
  outputPlaying: z.boolean().default(true), // Master render loop
  bpm: z.number().min(40).max(240).default(120),
  autoMosh: z.object({
    on: z.boolean().default(false),
    bars: z.number().default(4),
    scope: MoshScopeSchema.default('everything'),
  }),
  locks: z.object({
    mix: z.boolean().default(false),
    blend: z.boolean().default(false), // the Master lock: blend mode and output effects
  }),
})

export type EffectType = z.infer<typeof EffectTypeSchema>
export type WaveShape = z.infer<typeof WaveShapeSchema>
export type BlendMode = z.infer<typeof BlendModeSchema>
export type Osc = z.infer<typeof OscSchema>
export type Effect = z.infer<typeof EffectSchema>
export type VideoState = z.infer<typeof VideoStateSchema>
export type AppState = z.infer<typeof AppStateSchema>
export type SourceId = 'videoA' | 'videoB'
export type Overlay = z.infer<typeof OverlaySchema>
export type Pattern = z.infer<typeof PatternSchema>
export type MoshScope = z.infer<typeof MoshScopeSchema>

const defaultVideo = (id: string): VideoState => ({
  id, start: 0, end: 10, duration: 100, loop: true, playing: true, lastInteraction: 0, effects: [], hold: false,
})

export const defaultState: AppState = {
  videoA: defaultVideo('-Pail6FITXc'),
  videoB: defaultVideo('KM9ptQ2Tz3s'),
  blendMode: 'overlay',
  mix: 0.5,
  mixOsc: { on: false, rate: 16, shape: 'sine' },
  activeOverlay: 'videoA',
  masterEffects: [],
  overlay: { kind: 'off', pattern: 'plasma', hue: 280, url: '', lottie: 'rings', loopBeats: 4, opacity: 0.7, blend: 'screen', hold: false },
  outputPlaying: true,
  bpm: 120,
  autoMosh: { on: false, bars: 4, scope: 'everything' },
  locks: { mix: false, blend: false },
}
