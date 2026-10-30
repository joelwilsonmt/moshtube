import { createStore } from 'zustand/vanilla'
import { appStore } from './appStore'
import { checkpoint } from './history'
import { announce } from './uiStore'
import { deserializeState, serializeState } from '../utils/serialization'
import { parseYouTubeId } from '../utils/youtube'

// Per-browser library: saved presets and the user's own video pool.
// Stored in localStorage; every access tolerates it being unavailable.

export interface Preset {
    id: string
    name: string
    query: string // serialized mix, same format as the URL
    savedAt: number
}

interface Library {
    presets: Preset[]
    pool: string[]
    useMyPool: boolean
}

const KEY = 'moshtube:library'

function load(): Library {
    try {
        const raw = localStorage.getItem(KEY)
        if (raw) {
            const data = JSON.parse(raw)
            return {
                presets: Array.isArray(data.presets) ? data.presets : [],
                pool: Array.isArray(data.pool) ? data.pool.filter((id: unknown) => typeof id === 'string') : [],
                useMyPool: !!data.useMyPool,
            }
        }
    } catch { /* private mode or corrupt: start empty */ }
    return { presets: [], pool: [], useMyPool: false }
}

export const libraryStore = createStore<Library>(load)

libraryStore.subscribe((state) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(state))
    } catch { /* storage full or blocked: library lives for this session only */ }
})

export function savePreset(name: string) {
    const preset: Preset = {
        id: Math.random().toString(36).slice(2, 8),
        name: name.trim() || `Mix ${libraryStore.getState().presets.length + 1}`,
        query: serializeState(appStore.getState()).toString(),
        savedAt: Date.now(),
    }
    libraryStore.setState((s) => ({ presets: [preset, ...s.presets] }))
    announce(`Saved “${preset.name}”`)
}

export function loadPreset(preset: Preset) {
    checkpoint(`load “${preset.name}”`)
    appStore.setState((s) => ({ ...s, ...deserializeState(new URLSearchParams(preset.query)) }))
    announce(`Loaded “${preset.name}”`)
}

export function deletePreset(id: string) {
    libraryStore.setState((s) => ({ presets: s.presets.filter((p) => p.id !== id) }))
}

// Accepts any mix of links and IDs separated by whitespace or commas; returns how many were valid
export function setPoolFromText(text: string) {
    const ids = [...new Set(text.split(/[\s,]+/).map(parseYouTubeId).filter((id): id is string => !!id))]
    libraryStore.setState({ pool: ids })
    return ids.length
}

export const setUseMyPool = (useMyPool: boolean) => libraryStore.setState({ useMyPool })
