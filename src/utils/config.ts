export const IDLE_TIMEOUT_MS = 5000

// Phones, plus touch screens too short for the rack (a phone turned sideways). A short
// desktop window keeps the mixer: the one-row rack still leaves a usable stage.
export const COMPACT_QUERY = '(max-width: 767px), (max-height: 500px) and (pointer: coarse)'
export const isCompact = () => window.matchMedia(COMPACT_QUERY).matches
