import {
  AppStateSchema, BlendModeSchema, defaultState, EffectTypeSchema, MoshScopeSchema, PatternSchema, WaveShapeSchema,
  type AppState, type Effect, type Osc, type VideoState,
} from '../store/schema'
import { createEffect, EFFECTS } from '../fx/effects'

// Effect stacks: `type:amount[:rate:shape]`, comma-separated. A rate means oscillation is on.
// e.g. a_fx=wavy:40:16:sine,glitch:30
const SHAPES = WaveShapeSchema.options

function encodeOsc(osc: Osc) {
  return `${osc.rate}:${osc.shape}`
}

function decodeOsc(rate?: string, shape?: string): Osc {
  const r = parseFloat(rate ?? '')
  if (!Number.isFinite(r) || r <= 0) return { ...defaultState.mixOsc }
  const s = SHAPES.includes(shape as Osc['shape']) ? (shape as Osc['shape']) : 'sine'
  return { on: true, rate: r, shape: s }
}

function encodeEffects(effects: Effect[]) {
  return effects
    .map((e) => {
      const base = EFFECTS[e.type].param ? `${e.type}:${+e.amount.toFixed(2)}` : `${e.type}:1`
      return e.osc.on ? `${base}:${encodeOsc(e.osc)}` : base
    })
    .join(',')
}

function decodeEffects(raw: string): Effect[] {
  return raw.split(',').flatMap((chunk) => {
    const [type, amount, rate, shape] = chunk.split(':')
    const parsedType = EffectTypeSchema.safeParse(type)
    if (!parsedType.success) return []
    const param = EFFECTS[parsedType.data].param
    const value = parseFloat(amount)
    const clamped = param && Number.isFinite(value) ? Math.min(param.max, Math.max(param.min, value)) : param?.default ?? 1
    return [createEffect(parsedType.data, { amount: clamped, osc: decodeOsc(rate, shape) })]
  })
}

function serializeVideo(params: URLSearchParams, p: 'a' | 'b', v: VideoState) {
  if (v.id) params.set(`${p}_id`, v.id)
  params.set(`${p}_start`, v.start.toFixed(2))
  params.set(`${p}_end`, v.end.toFixed(2))
  params.set(`${p}_loop`, v.loop ? '1' : '0')
  if (v.effects.length) params.set(`${p}_fx`, encodeEffects(v.effects))
  if (v.hold) params.set(`${p}_hold`, '1')
  // Only whether the loop was set by hand matters to whoever opens the link
  if (v.lastInteraction) params.set(`${p}_li`, '1')
}

export function serializeState(state: AppState): URLSearchParams {
  const params = new URLSearchParams()
  serializeVideo(params, 'a', state.videoA)
  serializeVideo(params, 'b', state.videoB)

  params.set('mix', state.mix.toFixed(2))
  if (state.mixOsc.on) params.set('mix_osc', encodeOsc(state.mixOsc))
  params.set('blend', state.blendMode)
  params.set('overlay', state.activeOverlay)
  if (state.masterEffects.length) params.set('m_fx', encodeEffects(state.masterEffects))
  if (state.bpm !== defaultState.bpm) params.set('bpm', String(state.bpm))
  const c = state.overlay
  if (c.kind !== 'off') {
    params.set('c', c.kind === 'pattern' ? c.pattern : 'media')
    if (c.kind === 'media') params.set('c_url', c.url)
    if (c.kind === 'pattern') params.set('c_hue', String(Math.round(c.hue)))
    params.set('c_op', c.opacity.toFixed(2))
    params.set('c_blend', c.blend)
  }
  if (c.hold) params.set('c_hold', '1')
  if (state.autoMosh.on) params.set('auto', `${state.autoMosh.bars}:${state.autoMosh.scope}`)
  const locks = [state.locks.mix && 'mix', state.locks.blend && 'blend'].filter(Boolean)
  if (locks.length) params.set('lock', locks.join(','))

  return params
}

function num(params: URLSearchParams, key: string, fallback: number) {
  const v = parseFloat(params.get(key) ?? '')
  return Number.isFinite(v) ? v : fallback
}

function deserializeVideo(params: URLSearchParams, p: 'a' | 'b', base: VideoState): VideoState {
  const v: VideoState = { ...base, effects: [] }
  const id = params.get(`${p}_id`)
  if (id) v.id = id
  v.start = Math.max(0, num(params, `${p}_start`, v.start))
  v.end = num(params, `${p}_end`, v.end)
  if (params.has(`${p}_loop`)) v.loop = params.get(`${p}_loop`) === '1'
  if (params.has(`${p}_li`)) v.lastInteraction = num(params, `${p}_li`, 0)
  v.hold = params.get(`${p}_hold`) === '1'

  if (params.has(`${p}_fx`)) {
    v.effects = decodeEffects(params.get(`${p}_fx`)!)
  } else if (params.has(`${p}_shader`)) {
    // Links from before effect stacks: one shader + intensity
    const legacy = EffectTypeSchema.safeParse(params.get(`${p}_shader`))
    if (legacy.success) {
      const param = EFFECTS[legacy.data].param
      v.effects = [createEffect(legacy.data, { amount: num(params, `${p}_int`, param?.default ?? 1) })]
    }
  }
  return v
}

export function deserializeState(params: URLSearchParams): Partial<AppState> {
  const blend = BlendModeSchema.safeParse(params.get('blend'))
  const overlay = AppStateSchema.shape.activeOverlay.safeParse(params.get('overlay'))
  const locks = (params.get('lock') ?? '').split(',')
  const [rate, shape] = (params.get('mix_osc') ?? '').split(':')
  const [autoBars, autoScope] = (params.get('auto') ?? '').split(':')
  const bars = parseFloat(autoBars)
  const scope = MoshScopeSchema.safeParse(autoScope)

  const cKind = params.get('c')
  const pattern = PatternSchema.safeParse(cKind)
  const cBlend = BlendModeSchema.safeParse(params.get('c_blend'))
  const cUrl = params.get('c_url') ?? ''
  const layerC = {
    ...defaultState.overlay,
    kind: pattern.success ? 'pattern' as const : cKind === 'media' && /^https?:\/\//.test(cUrl) ? 'media' as const : 'off' as const,
    pattern: pattern.success ? pattern.data : defaultState.overlay.pattern,
    hue: Math.min(360, Math.max(0, num(params, 'c_hue', defaultState.overlay.hue))),
    url: /^https?:\/\//.test(cUrl) ? cUrl : '',
    opacity: Math.min(1, Math.max(0, num(params, 'c_op', defaultState.overlay.opacity))),
    blend: cBlend.success ? cBlend.data : defaultState.overlay.blend,
    hold: params.get('c_hold') === '1',
  }

  return {
    overlay: layerC,
    videoA: deserializeVideo(params, 'a', defaultState.videoA),
    videoB: deserializeVideo(params, 'b', defaultState.videoB),
    mix: Math.min(1, Math.max(0, num(params, 'mix', defaultState.mix))),
    mixOsc: decodeOsc(rate, shape),
    blendMode: blend.success ? blend.data : defaultState.blendMode,
    activeOverlay: overlay.success ? overlay.data : defaultState.activeOverlay,
    masterEffects: params.has('m_fx') ? decodeEffects(params.get('m_fx')!) : [],
    bpm: Math.min(240, Math.max(40, num(params, 'bpm', defaultState.bpm))),
    autoMosh: params.has('auto') && Number.isFinite(bars) && bars > 0
      ? { on: true, bars, scope: scope.success ? scope.data : 'everything' }
      : { ...defaultState.autoMosh },
    locks: { mix: locks.includes('mix'), blend: locks.includes('blend') },
  }
}
