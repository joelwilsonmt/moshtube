import { useStore } from 'zustand'
import { Link2, Sparkles, Undo2 } from 'lucide-react'
import { historyStore, undo } from '../store/history'
import { uiStore } from '../store/uiStore'
import { useMediaQuery } from '../hooks/useLive'
import { useShortcuts } from '../hooks/useShortcuts'
import { useAutoMosh } from '../engine/tempo'
import { moshMeDaddy } from '../utils/mosh'
import { COMPACT_QUERY } from '../utils/config'
import { StageHost, StageSlot, toggleStageFullscreen } from './StageHost'
import { ViewerView } from './Viewer'
import { copyLink, PlayToggle, StatusLine, TopBar, Wordmark } from './TopBar'
import { Inspector } from './Inspector'
import { Mixer } from './Mixer'
import { Button, IconButton } from './ui/core'

function DesktopView() {
    useShortcuts({ fullscreen: toggleStageFullscreen })

    return (
        <div className="grid h-[100dvh] min-h-[480px] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto]">
            <a href="#mosh" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-panel focus:px-3 focus:py-2">
                Skip to the mosh buttons
            </a>
            <TopBar onFullscreen={toggleStageFullscreen} />
            {/* The mixer comes before the inspector in tab order, though it sits below */}
            <Mixer className="row-start-3" />
            <div className="row-start-2 grid min-h-0 grid-cols-[minmax(0,1fr)_320px] max-[1279px]:grid-cols-[minmax(0,1fr)_280px]">
                <main className="relative min-w-0 bg-black">
                    <StageSlot className="absolute inset-0" />
                </main>
                <Inspector />
            </div>
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
                <IconButton icon={Link2} label="Copy link to this mix" onClick={copyLink} className="h-11 w-11" />
            </header>
            <main className="relative min-h-[40dvh] w-full flex-1 bg-black">
                <StageSlot className="absolute inset-0" />
                {/* The whole picture is the button: tap the video to mosh */}
                <button type="button" onClick={moshMeDaddy} aria-label="Mosh Me Daddy (tap the video)" className="absolute inset-0 z-10 focus-visible:outline-offset-[-4px]" />
            </main>
            <div className="flex flex-col gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <StatusLine full className="min-h-5" />
                <div className="flex gap-2">
                    <Button variant="primary" onClick={moshMeDaddy} className="h-12 flex-1 text-[15px]">
                        <Sparkles size={17} aria-hidden="true" />
                        Mosh Me Daddy
                    </Button>
                    <PlayToggle keyHint={false} className="h-12 w-12 border border-edge" />
                    <IconButton icon={Undo2} label="Undo" onClick={undo} disabled={!canUndo} className="h-12 w-12 border border-edge" />
                </div>
                <p className="text-center text-xs text-dim [@media(max-height:500px)]:hidden">Tap the video to mosh. Effects and the full mixer open on a larger screen.</p>
            </div>
        </div>
    )
}

export function Dashboard() {
    useAutoMosh()
    const compact = useMediaQuery(COMPACT_QUERY)
    const viewer = useStore(uiStore, (s) => s.viewer)
    return (
        <>
            {viewer ? <ViewerView /> : compact ? <MobileView /> : <DesktopView />}
            <StageHost />
        </>
    )
}
