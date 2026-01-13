import { createStore } from 'zustand/vanilla'
import { defaultState, type AppState } from './schema'

export const appStore = createStore<AppState>(() => defaultState)

export function updateVideoState(target: 'videoA' | 'videoB', updates: Partial<AppState['videoA']>) {
  appStore.setState((state) => ({
    ...state,
    [target]: { ...state[target], ...updates }
  }))
}

export function setBlendMode(mode: AppState['blendMode']) {
  appStore.setState((state) => ({ ...state, blendMode: mode }))
}

export function setMix(value: number) {
  appStore.setState((state) => ({ ...state, mix: value }))
}

export const setMixOscillate = (val: boolean) => appStore.setState({ mixOscillate: val })

export function setPlaying(target: 'videoA' | 'videoB', playing: boolean) {
  updateVideoState(target, { playing })
}

export const setActiveOverlay = (id: 'videoA' | 'videoB') => appStore.setState({ activeOverlay: id })
export const setOutputPlaying = (playing: boolean) => appStore.setState({ outputPlaying: playing })
