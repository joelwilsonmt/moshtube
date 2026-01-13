import { z } from 'zod'

export const ShaderTypeSchema = z.enum([
  'none',
  'trippy',
  'scanlines',
  'vcr',
  'wavy',
  'posterize',
  'pixelate',
  'glow',
  'glitch',
  'ink',
  'predator',
  'solarize',
  'dream',
  'xray'
])

export const BlendModeSchema = z.enum([
  'normal',
  'multiply',
  'screen',
  'overlay',
  'difference',
  'exclusion'
])

export const VideoStateSchema = z.object({
  id: z.string().optional(), // YouTube Video ID
  start: z.number().default(0),
  end: z.number().default(0),
  duration: z.number().default(100), // Max duration
  loop: z.boolean().default(true),
  playing: z.boolean().default(true), // Playback state
  lastInteraction: z.number().optional(), // Timestamp of last user edit
  shader: ShaderTypeSchema.default('none'),
  shaderParams: z.record(z.string(), z.number()).default({}), // Generic params like strength, radius
  seek: z.object({
      time: z.number(),
      trigger: z.number()
  }).optional(),
  oscillate: z.boolean().default(false),
})

export const AppStateSchema = z.object({
  videoA: VideoStateSchema,
  videoB: VideoStateSchema,
  blendMode: BlendModeSchema.default('normal'),
  mix: z.number().min(0).max(1).default(0.5), // Top layer opacity
  mixOscillate: z.boolean().default(false),
  activeOverlay: z.enum(['videoA', 'videoB']).default('videoA'),
  masterShader: ShaderTypeSchema.default('none'),
  masterShaderParams: z.record(z.string(), z.number()).default({}),
  outputPlaying: z.boolean().default(true), // Master render loop
})

export type ShaderType = z.infer<typeof ShaderTypeSchema>
export type BlendMode = z.infer<typeof BlendModeSchema>
export type AppState = z.infer<typeof AppStateSchema>

export const defaultState: AppState = {
  videoA: { id: '-Pail6FITXc', start: 0, end: 10, duration: 100, loop: true, playing: true, shader: 'none', shaderParams: {}, lastInteraction: 0, oscillate: false }, // New default A
  videoB: { id: 'KM9ptQ2Tz3s', start: 0, end: 10, duration: 100, loop: true, playing: true, shader: 'none', shaderParams: {}, lastInteraction: 0, oscillate: false }, // New default B
  blendMode: 'overlay',
  mix: 0.5,
  mixOscillate: false,
  activeOverlay: 'videoA',
  masterShader: 'none',
  masterShaderParams: {},
  outputPlaying: true
}
