export const IDLE_TIMEOUT_MS = 5000

// Phones, plus any window too short for the rack to leave a usable stage (a phone turned
// sideways, a squat desktop window)
export const COMPACT_QUERY = '(max-width: 767px), (max-height: 500px)'
export const isCompact = () => window.matchMedia(COMPACT_QUERY).matches
