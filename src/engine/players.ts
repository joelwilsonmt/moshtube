import type { YouTubePlayer } from 'react-youtube'
import type { SourceId } from '../store/schema'

// The stage players are the single source of truth for playback position
const players = new Map<SourceId, YouTubePlayer>()

export const registerPlayer = (id: SourceId, player: YouTubePlayer | null) => {
  if (player) players.set(id, player)
  else players.delete(id)
}

export const getPlayer = (id: SourceId) => players.get(id)

// Inspect from devtools / browser automation during development
if (import.meta.env.DEV) Object.assign(window, { __moshPlayers: players })
