import { defaultState, type AppState } from '../store/schema'

export function serializeState(state: AppState): URLSearchParams {
  const params = new URLSearchParams()
  
  // Video A
  if (state.videoA.id) params.set('a_id', state.videoA.id)
  params.set('a_start', state.videoA.start.toFixed(2))
  params.set('a_end', state.videoA.end.toFixed(2))
  params.set('a_loop', state.videoA.loop ? '1' : '0')
  params.set('a_shader', state.videoA.shader)
  if (state.videoA.shaderParams.intensity !== undefined) {
      params.set('a_int', state.videoA.shaderParams.intensity.toString())
  }
  if (state.videoA.lastInteraction) params.set('a_li', state.videoA.lastInteraction.toString())

  // Video B
  if (state.videoB.id) params.set('b_id', state.videoB.id)
  params.set('b_start', state.videoB.start.toFixed(2))
  params.set('b_end', state.videoB.end.toFixed(2))
  params.set('b_loop', state.videoB.loop ? '1' : '0')
  params.set('b_shader', state.videoB.shader)
  if (state.videoB.shaderParams.intensity !== undefined) {
      params.set('b_int', state.videoB.shaderParams.intensity.toString())
  }
  if (state.videoB.lastInteraction) params.set('b_li', state.videoB.lastInteraction.toString())

  // Global
  params.set('mix', state.mix.toFixed(2))
  params.set('blend', state.blendMode)
  params.set('overlay', state.activeOverlay)
  
  return params
}

export function deserializeState(params: URLSearchParams): Partial<AppState> {
  const sA = { ...defaultState.videoA }
  const sB = { ...defaultState.videoB }

  // A
  if (params.has('a_id')) sA.id = params.get('a_id')!
  if (params.has('a_start')) sA.start = parseFloat(params.get('a_start')!)
  if (params.has('a_end')) sA.end = parseFloat(params.get('a_end')!)
  if (params.has('a_loop')) sA.loop = params.get('a_loop') === '1'
  if (params.has('a_shader')) sA.shader = params.get('a_shader') as any
  if (params.has('a_int')) sA.shaderParams = { intensity: parseFloat(params.get('a_int')!) }
  if (params.has('a_li')) sA.lastInteraction = parseFloat(params.get('a_li')!)

  // B
  if (params.has('b_id')) sB.id = params.get('b_id')!
  if (params.has('b_start')) sB.start = parseFloat(params.get('b_start')!)
  if (params.has('b_end')) sB.end = parseFloat(params.get('b_end')!)
  if (params.has('b_loop')) sB.loop = params.get('b_loop') === '1'
  if (params.has('b_shader')) sB.shader = params.get('b_shader') as any
  if (params.has('b_int')) sB.shaderParams = { intensity: parseFloat(params.get('b_int')!) }
  if (params.has('b_li')) sB.lastInteraction = parseFloat(params.get('b_li')!)

  // Global
  const mix = params.has('mix') ? parseFloat(params.get('mix')!) : defaultState.mix
  const blendMode = params.has('blend') ? params.get('blend') as any : defaultState.blendMode
  const activeOverlay = params.has('overlay') ? params.get('overlay') as any : defaultState.activeOverlay

  return {
      videoA: sA,
      videoB: sB,
      mix,
      blendMode,
      activeOverlay
  }
}
