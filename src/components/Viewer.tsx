import { useEffect } from 'react'
import { Link2, Maximize, SlidersHorizontal } from 'lucide-react'
import { appStore, setOutputPlaying } from '../store/appStore'
import { enterMixer } from '../store/uiStore'
import { StageSlot, toggleStageFullscreen } from './StageHost'
import { copyLink, PlayToggle, Wordmark } from './TopBar'
import { Button, IconButton } from './ui/core'

// What a shared link opens: the mix itself, with one way in to the mixer.
// The controls stay put; only fullscreen hides them when idle.
export function ViewerView() {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
            if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) {
                e.preventDefault()
                setOutputPlaying(!appStore.getState().outputPlaying)
            }
            if (e.key === 'f') toggleStageFullscreen()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
            <StageSlot className="absolute inset-0" />

            <header className="absolute left-3 top-3 z-10 flex items-center gap-3 rounded-md border border-line bg-panel/85 px-3 py-2 backdrop-blur">
                <h1><Wordmark /></h1>
                <span className="text-[13px] text-dim">A shared mix</span>
            </header>

            <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-line bg-panel/90 p-2 shadow-[0_8px_24px_oklch(0_0_0/0.5)] backdrop-blur">
                <PlayToggle className="h-11 w-11" />
                <Button variant="primary" onClick={enterMixer} className="h-11 whitespace-nowrap px-5 text-[14px] font-semibold">
                    <SlidersHorizontal size={17} aria-hidden="true" />
                    Remix this
                </Button>
                <IconButton icon={Link2} label="Copy link to this mix" onClick={copyLink} className="h-11 w-11" />
                <IconButton icon={Maximize} label="Fullscreen (F)" onClick={toggleStageFullscreen} className="h-11 w-11 max-md:hidden" />
            </div>
        </div>
    )
}
