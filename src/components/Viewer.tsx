import { useCallback, useEffect, useRef, useState } from 'react'
import { Link2, Maximize, Minimize, SlidersHorizontal } from 'lucide-react'
import { appStore, setOutputPlaying } from '../store/appStore'
import { enterMixer } from '../store/uiStore'
import { useIdle } from '../hooks/useLive'
import { Stage } from './Stage'
import { copyLink, PlayToggle, Wordmark } from './TopBar'
import { Button, cn, IconButton } from './ui/core'

// What a shared link opens: the mix itself, with one way in to the mixer
export function ViewerView() {
    const rootRef = useRef<HTMLDivElement>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const idle = useIdle(true)

    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    const toggleFullscreen = useCallback(() => {
        if (document.fullscreenElement) void document.exitFullscreen()
        else void rootRef.current?.requestFullscreen()
    }, [])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
            if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) {
                e.preventDefault()
                setOutputPlaying(!appStore.getState().outputPlaying)
            }
            if (e.key === 'f') toggleFullscreen()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [toggleFullscreen])

    const chrome = cn('transition-[opacity,transform] duration-300', idle && 'pointer-events-none opacity-0')

    return (
        <div ref={rootRef} className={cn('relative h-[100dvh] w-full overflow-hidden bg-black', idle && 'cursor-none')}>
            <main className="absolute inset-0">
                <Stage />
            </main>

            <header className={cn('absolute left-3 top-3 flex items-center gap-3 rounded-md border border-line bg-panel/85 px-3 py-2 backdrop-blur', chrome)}>
                <h1><Wordmark /></h1>
                <span className="text-[13px] text-dim">A shared mix</span>
            </header>

            <div
                className={cn(
                    'absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-line bg-panel/90 p-2 shadow-[0_8px_24px_oklch(0_0_0/0.5)] backdrop-blur',
                    chrome,
                    idle && 'translate-y-3'
                )}
            >
                <PlayToggle className="h-11 w-11" />
                <Button variant="primary" onClick={enterMixer} className="h-11 whitespace-nowrap px-5 text-[15px]">
                    <SlidersHorizontal size={17} aria-hidden="true" />
                    Remix this
                </Button>
                <IconButton icon={Link2} label="Copy link to this mix" onClick={copyLink} className="h-11 w-11" />
                <IconButton
                    icon={isFullscreen ? Minimize : Maximize}
                    label={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
                    onClick={toggleFullscreen}
                    className="h-11 w-11 max-md:hidden"
                />
            </div>
        </div>
    )
}
