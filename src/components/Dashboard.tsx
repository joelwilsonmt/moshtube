import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { Link2, Minimize, Pause, Play, Sparkles, Undo2 } from 'lucide-react'
import { appStore, setOutputPlaying } from '../store/appStore'
import { historyStore, undo } from '../store/history'
import { useMediaQuery } from '../hooks/useLive'
import { useShortcuts } from '../hooks/useShortcuts'
import { useAutoMosh } from '../engine/tempo'
import { IDLE_TIMEOUT_MS } from '../utils/config'
import { moshMeDaddy } from '../utils/mosh'
import { Stage } from './Stage'
import { copyLink, StatusLine, TopBar, Wordmark } from './TopBar'
import { Inspector } from './Inspector'
import { Mixer } from './Mixer'
import { MoshCluster } from './MoshCluster'
import { Button, cn, IconButton } from './ui/core'

function useIdle(enabled: boolean) {
    const [idle, setIdle] = useState(false)
    useEffect(() => {
        if (!enabled) return setIdle(false)
        let timeout: ReturnType<typeof setTimeout>
        const reset = () => {
            setIdle(false)
            clearTimeout(timeout)
            timeout = setTimeout(() => setIdle(true), IDLE_TIMEOUT_MS)
        }
        const events = ['mousemove', 'keydown', 'pointerdown', 'touchstart']
        events.forEach((e) => window.addEventListener(e, reset))
        reset()
        return () => {
            events.forEach((e) => window.removeEventListener(e, reset))
            clearTimeout(timeout)
        }
    }, [enabled])
    return idle
}

function PlayToggle({ className, withText = false }: { className?: string; withText?: boolean }) {
    const playing = useStore(appStore, (s) => s.outputPlaying)
    const label = playing ? 'Pause output (Space)' : 'Play output (Space)'
    if (withText) {
        return (
            <Button onClick={() => setOutputPlaying(!playing)} className={className}>
                {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                {playing ? 'Pause' : 'Play'}
            </Button>
        )
    }
    return <IconButton icon={playing ? Pause : Play} label={label} onClick={() => setOutputPlaying(!playing)} className={className} />
}

function DesktopView() {
    const stageRef = useRef<HTMLDivElement>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const idle = useIdle(isFullscreen)

    useEffect(() => {
        const onChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current)
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    const toggleFullscreen = useCallback(() => {
        if (document.fullscreenElement) void document.exitFullscreen()
        else void stageRef.current?.requestFullscreen()
    }, [])

    useShortcuts({ fullscreen: toggleFullscreen })

    return (
        <div className="grid h-[100dvh] min-h-[600px] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto]">
            <TopBar onFullscreen={toggleFullscreen} />
            <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_320px]">
                <main ref={stageRef} className={cn('relative min-w-0 bg-black', isFullscreen && idle && 'cursor-none')}>
                    <Stage />
                    {isFullscreen && (
                        <div
                            className={cn(
                                'absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-line bg-panel/90 p-2 shadow-[0_8px_24px_oklch(0_0_0/0.5)] backdrop-blur transition-[opacity,transform] duration-300',
                                idle ? 'pointer-events-none translate-y-3 opacity-0' : 'opacity-100'
                            )}
                        >
                            <MoshCluster compact />
                            <div className="mx-1 h-6 w-px bg-line" />
                            <PlayToggle />
                            <IconButton icon={Minimize} label="Exit fullscreen (F)" onClick={toggleFullscreen} />
                        </div>
                    )}
                </main>
                <Inspector />
            </div>
            <Mixer />
        </div>
    )
}

// Phones get the output and the one button that matters
function MobileView() {
    const canUndo = useStore(historyStore, (h) => h.past.length > 0)
    return (
        <div className="flex min-h-[100dvh] flex-col">
            <header className="flex h-12 items-center justify-between border-b border-line bg-panel px-4">
                <h1><Wordmark /></h1>
                <IconButton icon={Link2} label="Copy link to this mix" onClick={copyLink} />
            </header>
            <main className="relative min-h-[40dvh] w-full flex-1 bg-black">
                <Stage />
            </main>
            <div className="flex flex-col gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <StatusLine className="min-h-5" />
                <p className="text-[13px] text-dim">Full controls, effects and the mixer are on desktop.</p>
                <Button variant="primary" onClick={moshMeDaddy} className="h-14 text-base">
                    <Sparkles size={18} aria-hidden="true" />
                    Mosh Me Daddy
                </Button>
                <div className="grid grid-cols-2 gap-3">
                    <PlayToggle withText className="h-11" />
                    <Button onClick={undo} disabled={!canUndo} className="h-11">
                        <Undo2 size={16} aria-hidden="true" />
                        Undo
                    </Button>
                </div>
            </div>
        </div>
    )
}

export function Dashboard() {
    useAutoMosh()
    const isPhone = useMediaQuery('(max-width: 767px)')
    return isPhone ? <MobileView /> : <DesktopView />
}
