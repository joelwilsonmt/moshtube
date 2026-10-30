import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { Github, Link2, Maximize, Redo2, Undo2 } from 'lucide-react'
import { historyStore, redo, undo } from '../store/history'
import { announce, uiStore } from '../store/uiStore'
import { Button, IconButton } from './ui/core'
import { ShortcutsButton, Tempo } from './Tempo'
import { PresetsMenu } from './Library'

const STATUS_MS = 4000

export function Wordmark({ className = '' }: { className?: string }) {
    return <span className={`font-label text-[17px] font-bold uppercase leading-none tracking-[0.06em] ${className}`}>Moshtube</span>
}

// Last action, announced to screen readers and shown briefly
export function StatusLine({ className = '' }: { className?: string }) {
    const status = useStore(uiStore, (s) => s.status)
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const remaining = status ? STATUS_MS - (Date.now() - status.at) : 0
        if (remaining <= 0) return
        setVisible(true)
        const t = setTimeout(() => setVisible(false), remaining)
        return () => clearTimeout(t)
    }, [status])
    return (
        <p role="status" aria-live="polite" className={`truncate text-[13px] text-dim transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'} ${className}`}>
            {status?.text}
        </p>
    )
}

export async function copyLink() {
    try {
        await navigator.clipboard.writeText(window.location.href)
        announce('Link copied. Anyone who opens it gets this exact mix.')
    } catch {
        announce('Could not copy. Copy the address bar instead.')
    }
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
                <IconButton icon={Undo2} label="Undo (Z)" onClick={undo} disabled={!canUndo} />
                <IconButton icon={Redo2} label="Redo (Shift+Z)" onClick={redo} disabled={!canRedo} />
                <div className="mx-1.5 h-5 w-px bg-line" />
                <PresetsMenu />
                <Button variant="ghost" onClick={copyLink}>
                    <Link2 size={15} aria-hidden="true" />
                    <span className="max-[1399px]:sr-only">Copy link</span>
                </Button>
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
