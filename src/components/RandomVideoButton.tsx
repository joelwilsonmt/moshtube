import { Shuffle } from 'lucide-react'
import { useStore } from 'zustand'
import { useSwapBusy } from '../engine/swap'
import { checkpoint } from '../store/history'
import type { SourceId } from '../store/schema'
import { loadRandomVideo, videoErrorStore } from '../utils/youtube'
import { IconButton } from './ui/core'

const FULL_LOOP = { start: 0, end: 0, lastInteraction: 0 }

// Disabled until the previous pick is on screen, so mashing it can't queue up loads
export function RandomVideoButton({ id, name, size, className }: { id: SourceId; name?: string; size?: 'sm' | 'md'; className?: string }) {
    const error = useStore(videoErrorStore, (s) => !!s[id])
    const busy = useSwapBusy(id, error)
    const label = name ? `Random video for ${name}` : 'Random video'
    return (
        <IconButton
            size={size}
            icon={Shuffle}
            label={busy ? `${label} (next video loading)` : label}
            disabled={busy}
            onClick={() => { checkpoint('random video'); void loadRandomVideo(id, FULL_LOOP) }}
            className={className}
        />
    )
}
