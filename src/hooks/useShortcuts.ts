import { useEffect } from 'react'
import { appStore, setAutoMosh, setOutputPlaying } from '../store/appStore'
import { tap } from '../engine/tempo'
import { redo, undo } from '../store/history'
import { moshEverything, moshGlobal, moshMeDaddy } from '../utils/mosh'

export const SHORTCUTS = [
    { keys: '1', action: 'Mosh: new effects' },
    { keys: '2', action: 'Mosh Everything: effects, blend and mix' },
    { keys: '3', action: 'Mosh Me Daddy: new videos + everything' },
    { keys: 'Space', action: 'Play or pause the output' },
    { keys: 'T', action: 'Tap tempo' },
    { keys: 'A', action: 'Auto-mosh on or off' },
    { keys: 'Z', action: 'Undo' },
    { keys: 'Shift Z', action: 'Redo' },
    { keys: 'F', action: 'Fullscreen' },
    { keys: '?', action: 'Show shortcuts' },
] as const

const isTyping = (el: EventTarget | null) =>
    el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName))

export function useShortcuts(handlers: { fullscreen: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTyping(e.target)) return
            // Buttons handle Space themselves
            if (e.key === ' ' && e.target instanceof HTMLButtonElement) return
            const actions: Record<string, () => void> = {
                '1': moshGlobal,
                '2': moshEverything,
                '3': moshMeDaddy,
                ' ': () => setOutputPlaying(!appStore.getState().outputPlaying),
                z: undo,
                Z: redo,
                f: handlers.fullscreen,
                t: tap,
                a: () => setAutoMosh({ on: !appStore.getState().autoMosh.on }),
                '?': () => document.getElementById('shortcuts')?.togglePopover(),
            }
            const action = actions[e.key]
            if (!action) return
            e.preventDefault()
            action()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [handlers.fullscreen])
}
