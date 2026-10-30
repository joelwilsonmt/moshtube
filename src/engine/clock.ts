import { appStore } from '../store/appStore'

// Beat clock shared by oscillation, meters, strobe and (later) auto-mosh.
// Pauses with the output so modulation freezes on the frame you stopped on.
let anchorTime = performance.now()
let anchorBeats = 0
let { bpm, outputPlaying } = appStore.getState()

const elapsedBeats = (now: number) => anchorBeats + ((now - anchorTime) * bpm) / 60000

export function beatsNow(now = performance.now()) {
  return outputPlaying ? elapsedBeats(now) : anchorBeats
}

function reanchor(now = performance.now()) {
  anchorBeats = beatsNow(now)
  anchorTime = now
}

// Re-phase so the next beat lands now (used by tap tempo)
export function resetPhase() {
  anchorBeats = Math.ceil(beatsNow())
  anchorTime = performance.now()
}

appStore.subscribe((state) => {
  if (state.bpm !== bpm || state.outputPlaying !== outputPlaying) {
    reanchor()
    bpm = state.bpm
    outputPlaying = state.outputPlaying
  }
})
