import { useStore } from 'zustand'
import { Link2, Sparkles, Undo2 } from 'lucide-react'
import { historyStore, undo } from '../store/history'
import { uiStore } from '../store/uiStore'
import { useMediaQuery } from '../hooks/useLive'
import { useShortcuts } from '../hooks/useShortcuts'
import { useAutoMosh } from '../engine/tempo'
import { moshMeDaddy } from '../utils/mosh'
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
            <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_320px] max-[1279px]:grid-cols-[minmax(0,1fr)_280px]">
                <main className="relative min-w-0 bg-black">
                    <StageSlot className="absolute inset-0" />
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
                <IconButton icon={Link2} label="Copy link to this mix" onClick={copyLink} className="h-11 w-11" />
            </header>
            <main className="relative min-h-[40dvh] w-full flex-1 bg-black">
                <StageSlot className="absolute inset-0" />
            </main>
            <div className="flex flex-col gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <StatusLine className="min-h-5" />
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
                <p className="text-center text-xs text-dim [@media(max-height:500px)]:hidden">Effects, layers and the full mixer open on a larger screen.</p>
            </div>
        </div>
    )
}

// Phones, plus touch screens too short for the rack (a phone turned sideways)
const COMPACT = '(max-width: 767px), (max-height: 500px) and (pointer: coarse)'

export function Dashboard() {
    useAutoMosh()
    const compact = useMediaQuery(COMPACT)
    const viewer = useStore(uiStore, (s) => s.viewer)
    return (
        <>
            {viewer ? <ViewerView /> : compact ? <MobileView /> : <DesktopView />}
            <StageHost />
        </>
    )
}
