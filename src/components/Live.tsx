import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { Cable, MonitorUp, X } from 'lucide-react'
import { announce } from '../store/uiStore'
import { clearBinding, connectMidi, learn, MIDI_TARGETS, midiStore, midiSupported, type MidiTarget } from '../engine/midi'
import { openOutputWindow, useOutputSink } from '../engine/sync'
import { IDLE_TIMEOUT_MS } from '../utils/config'
import { Stage } from './Stage'
import { Button, cn, IconButton } from './ui/core'

const POPOVER_ID = 'midi'

// Hidden entirely where the browser has no Web MIDI (Safari, Firefox without the add-on)
export function MidiMenu() {
    const { status, inputs, learning, bindings } = useStore(midiStore)
    if (!midiSupported()) return null

    return (
        <>
            <IconButton icon={Cable} label={status === 'ready' && inputs.length ? `MIDI controller (connected: ${inputs.join(', ')})` : 'MIDI controller'} popoverTarget={POPOVER_ID} />
            <div
                id={POPOVER_ID}
                popover="auto"
                className="fixed inset-auto right-3 top-12 m-0 w-80 rounded-lg border border-line bg-panel p-4 text-ink shadow-[0_12px_32px_oklch(0_0_0/0.55)]"
            >
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="label">MIDI controller</h2>
                    {status === 'ready' && (
                        <span className="truncate text-xs text-dim">{inputs.length ? inputs.join(', ') : 'No devices found'}</span>
                    )}
                </div>

                {status !== 'ready' ? (
                    <div className="space-y-3">
                        <p className="text-[13px] text-dim">
                            {status === 'denied'
                                ? 'MIDI access was blocked. Allow it in the site settings, then try again.'
                                : 'Plug in a controller, connect, then press Learn and move a knob or pad.'}
                        </p>
                        <Button variant="primary" onClick={connectMidi}>Connect MIDI</Button>
                        {status === 'connecting' && <p className="text-xs text-dim">Waiting for permission. Check for a browser prompt, or click Connect again.</p>}
                    </div>
                ) : (
                    <ul className="-mx-1 space-y-0.5">
                        {(Object.keys(MIDI_TARGETS) as MidiTarget[]).map((target) => {
                            const b = bindings[target]
                            const isLearning = learning === target
                            return (
                                <li key={target} className="flex h-9 items-center gap-2 rounded-md px-1">
                                    <span className="flex-1 truncate text-[13px]">{MIDI_TARGETS[target].label}</span>
                                    <span className={cn('text-xs', isLearning ? 'text-signal' : 'text-dim')}>
                                        {isLearning ? 'Move a control…' : b ? `${b.kind === 'cc' ? 'CC' : 'Note'} ${b.number} · ch ${b.channel + 1}` : 'Not mapped'}
                                    </span>
                                    <Button className="h-7 px-2 text-xs" onClick={() => learn(isLearning ? null : target)}>
                                        {isLearning ? 'Cancel' : 'Learn'}
                                    </Button>
                                    {b
                                        ? <IconButton size="sm" icon={X} label={`Clear ${MIDI_TARGETS[target].label} mapping`} onClick={() => clearBinding(target)} />
                                        : <span className="w-7 shrink-0" aria-hidden="true" />}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </>
    )
}

export function PopOutButton() {
    return (
        <IconButton
            icon={MonitorUp}
            label="Open output in a new window (for a projector or second screen)"
            onClick={() => {
                const win = openOutputWindow()
                announce(win ? 'Output window opened. Drag it to the other screen and double-click it for fullscreen.' : 'The pop-up was blocked. Allow pop-ups for this site and try again.')
            }}
        />
    )
}

// The pop-out window: output only, mirrored from the main window
export function OutputView() {
    useOutputSink()
    const [idle, setIdle] = useState(false)

    useEffect(() => {
        document.title = 'Moshtube output'
        let timeout: ReturnType<typeof setTimeout>
        const reset = () => {
            setIdle(false)
            clearTimeout(timeout)
            timeout = setTimeout(() => setIdle(true), IDLE_TIMEOUT_MS)
        }
        window.addEventListener('mousemove', reset)
        reset()
        return () => {
            window.removeEventListener('mousemove', reset)
            clearTimeout(timeout)
        }
    }, [])

    const toggleFullscreen = () => {
        if (document.fullscreenElement) void document.exitFullscreen()
        else void document.documentElement.requestFullscreen()
    }

    return (
        <main className={cn('relative h-[100dvh] w-full bg-black', idle && 'cursor-none')} onDoubleClick={toggleFullscreen}>
            <Stage />
            <p className={cn('pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-panel/90 px-3 py-1.5 text-xs text-dim transition-opacity duration-300', idle ? 'opacity-0' : 'opacity-100')}>
                Double-click for fullscreen. Controls stay in the main window.
            </p>
        </main>
    )
}
