import { useState } from 'react'
import { useStore } from 'zustand'
import { Bookmark, Trash2 } from 'lucide-react'
import { deletePreset, libraryStore, loadPreset, savePreset, setPoolFromText, setUseMyPool } from '../store/library'
import { Button, IconButton, Input, Segmented } from './ui/core'

const POPOVER_ID = 'presets'

export function PresetsMenu() {
    const presets = useStore(libraryStore, (s) => s.presets)
    const [name, setName] = useState('')
    const close = () => document.getElementById(POPOVER_ID)?.hidePopover()

    return (
        <>
            <Button variant="ghost" popoverTarget={POPOVER_ID}>
                <Bookmark size={15} aria-hidden="true" />
                <span className="max-[1399px]:sr-only">Presets</span>
            </Button>
            <div
                id={POPOVER_ID}
                popover="auto"
                className="fixed inset-auto right-3 top-12 m-0 w-80 rounded-lg border border-line bg-panel p-4 text-ink shadow-[0_12px_32px_oklch(0_0_0/0.55)]"
            >
                <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault()
                        savePreset(name)
                        setName('')
                    }}
                >
                    <label htmlFor="preset-name" className="sr-only">Preset name</label>
                    <Input id="preset-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Mix ${presets.length + 1}`} maxLength={40} />
                    <Button type="submit" variant="primary" className="shrink-0">Save mix</Button>
                </form>

                {presets.length ? (
                    <ul className="-mx-2 mt-3 max-h-72 overflow-y-auto">
                        {presets.map((p) => (
                            <li key={p.id} className="flex items-center gap-1 rounded-md px-2 hover:bg-raised">
                                <button
                                    type="button"
                                    onClick={() => { loadPreset(p); close() }}
                                    className="flex min-w-0 flex-1 flex-col py-2 text-left"
                                >
                                    <span className="truncate text-[13px] font-medium">{p.name}</span>
                                    <span className="text-xs text-dim">{new Date(p.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                </button>
                                <IconButton size="sm" icon={Trash2} label={`Delete ${p.name}`} onClick={() => deletePreset(p.id)} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-3 text-[13px] text-dim">
                        Save mixes you like to come back to them. Presets stay in this browser; use Copy link to share one.
                    </p>
                )}
            </div>
        </>
    )
}

// Shuffle source: the built-in picks or a list the user pastes in
export function MyVideos() {
    const pool = useStore(libraryStore, (s) => s.pool)
    const useMyPool = useStore(libraryStore, (s) => s.useMyPool)
    const [text, setText] = useState(() => pool.map((id) => `https://youtu.be/${id}`).join('\n'))
    const [saved, setSaved] = useState<number | null>(null)

    return (
        <div className="space-y-2">
            <p className="text-xs font-medium text-dim" aria-hidden="true">Shuffle picks from (both sources)</p>
            <Segmented
                label="Shuffle picks from (both sources)"
                value={useMyPool && pool.length ? 'mine' : 'picks'}
                options={[
                    { value: 'picks', label: 'Moshtube picks' },
                    { value: 'mine', label: `My videos${pool.length ? ` (${pool.length})` : ''}` },
                ]}
                onChange={(v) => setUseMyPool(v === 'mine')}
            />
            {useMyPool && !pool.length && <p className="text-xs text-dim">Add some videos below first. Until then, shuffle uses Moshtube picks.</p>}
            <details className="group" open={useMyPool && !pool.length ? true : undefined}>
                <summary className="cursor-pointer list-none text-xs font-medium text-dim hover:text-ink [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Edit my videos</span>
                    <span className="hidden group-open:inline">Hide my videos</span>
                </summary>
                <div className="mt-2 space-y-2">
                    <label htmlFor="my-videos" className="text-xs text-dim">YouTube links or IDs, one per line. Shared by A and B, saved in this browser.</label>
                    <textarea
                        id="my-videos"
                        value={text}
                        onChange={(e) => { setText(e.target.value); setSaved(null) }}
                        rows={5}
                        spellCheck={false}
                        placeholder="https://youtu.be/…"
                        className="w-full resize-y rounded-md border border-edge bg-rack px-2.5 py-2 text-[13px] text-ink placeholder:text-dim/80 focus-visible:border-signal focus-visible:outline-none"
                    />
                    <div className="flex items-center gap-2">
                        <Button onClick={() => { const n = setPoolFromText(text); setSaved(n); if (n) setUseMyPool(true) }}>Save list</Button>
                        {saved !== null && (
                            <span className="text-xs text-dim" role="status">
                                {saved ? `${saved} video${saved === 1 ? '' : 's'} saved` : 'No YouTube links found'}
                            </span>
                        )}
                    </div>
                </div>
            </details>
        </div>
    )
}
