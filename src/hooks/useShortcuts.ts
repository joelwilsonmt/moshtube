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

// Only text entry swallows shortcuts; sliders, checkboxes and buttons don't type
const TEXT_INPUTS = ['text', 'search', 'url', 'email', 'number', 'password', 'tel']
const isTyping = (el: EventTarget | null) =>
    el instanceof HTMLElement &&
    (el.isContentEditable ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        (el instanceof HTMLInputElement && TEXT_INPUTS.includes(el.type)))

// Space activates a button reached by Tab; after a mouse click it means play/pause.
// (:focus-visible can't tell: Chrome turns it on as soon as any key is pressed.)
let focusedByKeyboard = false
window.addEventListener('pointerdown', () => { focusedByKeyboard = false }, true)
window.addEventListener('keydown', (e) => { if (e.key === 'Tab') focusedByKeyboard = true }, true)

const ownsSpace = (el: EventTarget | null) =>
    el instanceof HTMLElement &&
    (((el.tagName === 'BUTTON' || el.tagName === 'SUMMARY') && focusedByKeyboard) ||
        (el instanceof HTMLInputElement && el.type === 'checkbox'))

export function useShortcuts(handlers: { fullscreen: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTyping(e.target)) return
            if (e.key === ' ' && ownsSpace(e.target)) return
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
