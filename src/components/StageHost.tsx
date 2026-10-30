import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { Minimize, SlidersHorizontal } from 'lucide-react'
import { enterMixer, uiStore } from '../store/uiStore'
import { useIdle } from '../hooks/useLive'
import { Stage } from './Stage'
import { MoshCluster } from './MoshCluster'
import { PlayToggle } from './TopBar'
import { Button, cn, IconButton } from './ui/core'

// One stage for the app's lifetime. Each view renders an empty <StageSlot>; the host
// tracks that box, so switching views (viewer to mixer, rotating a phone) never
// remounts the YouTube players.
const slotStore = createStore(() => ({ slot: null as HTMLElement | null }))
let hostEl: HTMLDivElement | null = null

export function StageSlot({ className }: { className?: string }) {
    const ref = useRef<HTMLDivElement>(null)
    useLayoutEffect(() => {
        const el = ref.current
        slotStore.setState({ slot: el })
        return () => {
            if (slotStore.getState().slot === el) slotStore.setState({ slot: null })
        }
    }, [])
    return <div ref={ref} className={className} />
}

export function toggleStageFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void hostEl?.requestFullscreen()
}

export function useStageFullscreen() {
    const [on, setOn] = useState(false)
    useEffect(() => {
        const onChange = () => setOn(!!hostEl && document.fullscreenElement === hostEl)
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])
    return on
}

// Controls that float over the output in fullscreen and hide when idle
function FullscreenPill() {
    const viewer = useStore(uiStore, (s) => s.viewer)
    const idle = useIdle(true)
    return (
        <div
            className={cn(
                'absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-line bg-panel/90 p-2 shadow-[0_8px_24px_oklch(0_0_0/0.5)] backdrop-blur transition-[opacity,transform] duration-300',
                idle ? 'pointer-events-none translate-y-3 opacity-0' : 'opacity-100'
            )}
        >
            {viewer ? (
                <Button variant="primary" onClick={() => { void document.exitFullscreen(); enterMixer() }} className="whitespace-nowrap">
                    <SlidersHorizontal size={15} aria-hidden="true" />
                    Remix this
                </Button>
            ) : (
                <MoshCluster compact />
            )}
            <div className="mx-1 h-6 w-px bg-line" />
            <PlayToggle />
            <IconButton icon={Minimize} label="Exit fullscreen (F)" onClick={toggleStageFullscreen} />
        </div>
    )
}

export function StageHost() {
    const slot = useStore(slotStore, (s) => s.slot)
    const ref = useRef<HTMLDivElement>(null)
    const fullscreen = useStageFullscreen()
    const idle = useIdle(fullscreen)

    useLayoutEffect(() => {
        const host = ref.current
        hostEl = host
        if (!host) return
        if (!slot) {
            host.style.visibility = 'hidden'
            return
        }
        const place = () => {
            const r = slot.getBoundingClientRect()
            Object.assign(host.style, {
                visibility: 'visible',
                left: `${r.left}px`,
                top: `${r.top}px`,
                width: `${r.width}px`,
                height: `${r.height}px`,
            })
        }
        place()
        const ro = new ResizeObserver(place)
        ro.observe(slot)
        window.addEventListener('resize', place)
        window.addEventListener('scroll', place, true)
        return () => {
            ro.disconnect()
            window.removeEventListener('resize', place)
            window.removeEventListener('scroll', place, true)
        }
    }, [slot])

    return (
        <div ref={ref} className={cn('fixed z-0 overflow-hidden bg-black', fullscreen && idle && 'cursor-none')}>
            <Stage />
            {fullscreen && <FullscreenPill />}
        </div>
    )
}
