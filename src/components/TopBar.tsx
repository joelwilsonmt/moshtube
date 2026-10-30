import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { Github, Link2, Maximize, Pause, Play, Redo2, Undo2 } from 'lucide-react'
import { appStore, setOutputPlaying } from '../store/appStore'
import { historyStore, redo, undo } from '../store/history'
import { announce, uiStore } from '../store/uiStore'
import { Button, IconButton } from './ui/core'
import { ShortcutsButton, Tempo } from './Tempo'
import { PresetsMenu } from './Library'
import { MidiMenu, PopOutButton } from './Live'

const STATUS_MS = 7000

export function Wordmark({ className = '' }: { className?: string }) {
    return <span className={`font-label text-[17px] font-bold uppercase leading-none tracking-[0.06em] ${className}`}>Moshtube</span>
}

// Last action, announced to screen readers and shown briefly
// `full` shows the whole message (wrapping), for touch screens where tooltips can't reach
export function StatusLine({ className = '', full = false }: { className?: string; full?: boolean }) {
    const status = useStore(uiStore, (s) => s.status)
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        if (status?.sticky) return setVisible(true)
        const remaining = status ? STATUS_MS - (Date.now() - status.at) : 0
        if (remaining <= 0) return setVisible(false)
        setVisible(true)
        const t = setTimeout(() => setVisible(false), remaining)
        return () => clearTimeout(t)
    }, [status])
    return (
        <p role="status" aria-live="polite" title={status?.detail} className={`${full ? 'line-clamp-2' : 'truncate'} text-[13px] text-dim transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'} ${className}`}>
            {full ? (
                <span>{visible && (status?.detail ?? status?.text)}</span>
            ) : (
                <>
                    <span aria-hidden={!!status?.detail}>{visible && status?.text}</span>
                    {status?.detail && <span className="sr-only">{visible && status.detail}</span>}
                </>
            )}
        </p>
    )
}

export async function copyLink() {
    try {
        // Recipients land in the viewer first, with a Remix button into the mixer
        const url = new URL(window.location.href)
        url.searchParams.set('view', '1')
        await navigator.clipboard.writeText(url.toString())
        announce('Link copied. It opens this exact mix, with a button to remix it.')
    } catch {
        announce('Could not copy. Copy the address bar instead.')
    }
}

// `keyHint` adds the Space shortcut to the name; off on touch layouts
export function PlayToggle({ className, withText = false, keyHint = true }: { className?: string; withText?: boolean; keyHint?: boolean }) {
    const playing = useStore(appStore, (s) => s.outputPlaying)
    const label = `${playing ? 'Pause' : 'Play'} output${keyHint ? ' (Space)' : ''}`
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

export function TopBar({ onFullscreen }: { onFullscreen: () => void }) {
    const canUndo = useStore(historyStore, (h) => h.past.length > 0)
    const canRedo = useStore(historyStore, (h) => h.future.length > 0)

    return (
        <header className="flex h-11 items-center gap-4 border-b border-line bg-panel px-3">
            <h1 className="shrink-0"><Wordmark /></h1>
            <Tempo />
            <StatusLine className="min-w-0 flex-1" />
            <div className="flex shrink-0 items-center gap-1">
                <PlayToggle />
                <IconButton icon={Undo2} label="Undo (Z)" onClick={undo} disabled={!canUndo} />
                <IconButton icon={Redo2} label="Redo (Shift+Z)" onClick={redo} disabled={!canRedo} />
                <div className="mx-1.5 h-5 w-px bg-line" />
                <PresetsMenu />
                <Button variant="ghost" onClick={copyLink}>
                    <Link2 size={15} aria-hidden="true" />
                    Copy link
                </Button>
                <MidiMenu />
                <PopOutButton />
                <IconButton icon={Maximize} label="Fullscreen (F)" onClick={onFullscreen} />
                <ShortcutsButton />
                <a
                    href="https://github.com/joelwilsonmt/moshtube"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Source code on GitHub"
                    title="Source code on GitHub"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-dim transition-colors hover:bg-raised hover:text-ink"
                >
                    <Github size={16} aria-hidden="true" />
                </a>
            </div>
        </header>
    )
}
