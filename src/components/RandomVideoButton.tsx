import { LoaderCircle, Shuffle } from 'lucide-react'
import { useStore } from 'zustand'
import { useSwapBusy } from '../engine/swap'
import { checkpoint } from '../store/history'
import type { SourceId } from '../store/schema'
import { announce } from '../store/uiStore'
import { loadRandomVideo, videoErrorStore } from '../utils/youtube'
import { cn, IconButton } from './ui/core'

const FULL_LOOP = { start: 0, end: 0, lastInteraction: 0 }

// Spins and ignores presses until the previous pick is on screen, so mashing it can't
// queue up loads. aria-disabled (not disabled) keeps keyboard focus where it was.
export function RandomVideoButton({ id, size, className }: { id: SourceId; size?: 'sm' | 'md'; className?: string }) {
    const error = useStore(videoErrorStore, (s) => !!s[id])
    const busy = useSwapBusy(id, error)
    const letter = id === 'videoA' ? 'A' : 'B'
    return (
        <IconButton
            size={size}
            icon={busy ? LoaderCircle : Shuffle}
            label={busy ? `Loading a random video for ${letter}…` : `Random video for ${letter}`}
            aria-disabled={busy || undefined}
            onClick={() => {
                if (busy) return
                checkpoint('random video')
                announce(`Loading a random video for ${letter}…`)
                void loadRandomVideo(id, FULL_LOOP)
            }}
            className={cn(busy && 'cursor-progress text-ink hover:bg-transparent [&>svg]:animate-spin motion-reduce:[&>svg]:animate-none', className)}
        />
    )
}
