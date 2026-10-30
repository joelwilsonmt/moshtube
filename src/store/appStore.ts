import { createStore } from 'zustand/vanilla'
import { defaultState, type AppState, type Effect, type SourceId, type VideoState } from './schema'

export const appStore = createStore<AppState>(() => defaultState)

export function updateVideoState(target: SourceId, updates: Partial<VideoState>) {
  appStore.setState((state) => ({
    ...state,
    [target]: { ...state[target], ...updates }
  }))
}

export function setBlendMode(mode: AppState['blendMode']) {
  appStore.setState({ blendMode: mode })
}

export function setMix(value: number) {
  appStore.setState({ mix: value })
}

export const setMixOsc = (updates: Partial<AppState['mixOsc']>) =>
  appStore.setState((s) => ({ mixOsc: { ...s.mixOsc, ...updates } }))

export const setActiveOverlay = (id: SourceId) => appStore.setState({ activeOverlay: id })
export const swapLayers = () => appStore.setState((s) => ({ activeOverlay: s.activeOverlay === 'videoA' ? 'videoB' : 'videoA' }))
export const setOutputPlaying = (playing: boolean) => appStore.setState({ outputPlaying: playing })
export const setBpm = (bpm: number) => appStore.setState({ bpm: Math.round(Math.min(240, Math.max(40, bpm)) * 10) / 10 })
export const setAutoMosh = (updates: Partial<AppState['autoMosh']>) =>
  appStore.setState((s) => ({ autoMosh: { ...s.autoMosh, ...updates } }))
export const setLock = (key: keyof AppState['locks'], value: boolean) =>
  appStore.setState((s) => ({ locks: { ...s.locks, [key]: value } }))

// Effect stacks live on a source (videoA/videoB) or on the master output
export type FxTarget = SourceId | 'master'

export const getEffects = (state: AppState, target: FxTarget) =>
  target === 'master' ? state.masterEffects : state[target].effects

export function setEffects(target: FxTarget, effects: Effect[]) {
  if (target === 'master') appStore.setState({ masterEffects: effects })
  else updateVideoState(target, { effects })
}

export function updateEffect(target: FxTarget, id: string, updates: Partial<Effect>) {
  const effects = getEffects(appStore.getState(), target)
  setEffects(target, effects.map((e) => (e.id === id ? { ...e, ...updates } : e)))
}
