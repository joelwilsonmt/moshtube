import { createStore } from 'zustand/vanilla'
import { appStore, updateVideoState } from '../store/appStore'
import type { VideoState } from '../store/schema'
import { SOURCE_A_IDS, SOURCE_B_IDS } from './sourceLists'
import { libraryStore } from '../store/library'

type Target = 'videoA' | 'videoB'

const ID_RE = /^[A-Za-z0-9_-]{11}$/

// IFrame API error codes that mean the video itself can't play here
// (2: invalid ID, 100: removed/private, 101/150: embedding disabled by owner)
const FATAL_PLAYER_ERRORS = [2, 100, 101, 150]

// oEmbed statuses that mean the video is gone, private, or not embeddable
const BROKEN_OEMBED_STATUSES = [400, 401, 403, 404]

// Per-source playback error for the control panel. Not part of AppState, so never in the URL.
export const videoErrorStore = createStore<Record<Target, string | null>>(() => ({ videoA: null, videoB: null }))

appStore.subscribe((state, prev) => {
    const errors = videoErrorStore.getState()
    for (const target of ['videoA', 'videoB'] as const) {
        if (errors[target] && state[target].id !== prev[target].id) {
            videoErrorStore.setState({ [target]: null })
        }
    }
})

// Accepts a bare ID or any common YouTube URL shape (watch, youtu.be, shorts, embed, live)
export function parseYouTubeId(input: string): string | null {
    const raw = input.trim()
    if (ID_RE.test(raw)) return raw
    try {
        const url = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`)
        const host = url.hostname.replace(/^(www|m|music)\./, '')
        let candidate: string | null = null
        if (host === 'youtu.be') {
            candidate = url.pathname.slice(1)
        } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
            candidate = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?]+)/)?.[1] ?? null
        }
        return candidate && ID_RE.test(candidate) ? candidate : null
    } catch {
        return null
    }
}

const embeddable = new Map<string, boolean>()
const titles = new Map<string, string>()
const inflight = new Map<string, Promise<boolean>>()

export const thumbnailUrl = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`

// Title from the oEmbed lookup, fetching it if needed (null when unknown or broken)
export async function getVideoTitle(id: string): Promise<string | null> {
    if (!titles.has(id)) await checkEmbeddable(id)
    return titles.get(id) ?? null
}

// Network failures (offline, blocked by an extension) count as playable; the player's
// onError is the backstop.
export function checkEmbeddable(id: string): Promise<boolean> {
    const cached = embeddable.get(id)
    if (cached !== undefined) return Promise.resolve(cached)
    if (!inflight.has(id)) {
        inflight.set(id, fetchEmbeddable(id).finally(() => inflight.delete(id)))
    }
    return inflight.get(id)!
}

async function fetchEmbeddable(id: string): Promise<boolean> {
    try {
        const watchUrl = `https://www.youtube.com/watch?v=${id}`
        const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`)
        if (res.ok) {
            embeddable.set(id, true)
            const data = await res.json().catch(() => null)
            if (typeof data?.title === 'string') titles.set(id, data.title)
            return true
        }
        if (BROKEN_OEMBED_STATUSES.includes(res.status)) {
            embeddable.set(id, false)
            return false
        }
        return true
    } catch {
        return true
    }
}

const shuffle = <T,>(arr: T[]) => {
    const out = [...arr]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

// The user's own pool (shared by A and B) replaces the built-in lists when switched on
const poolFor = (target: Target) => {
    const { pool, useMyPool } = libraryStore.getState()
    if (useMyPool && pool.length) return pool
    return target === 'videoA' ? SOURCE_A_IDS : SOURCE_B_IDS
}
const isPoolId = (id: string) =>
    SOURCE_A_IDS.includes(id) || SOURCE_B_IDS.includes(id) || libraryStore.getState().pool.includes(id)

async function pickRandomId(target: Target): Promise<string | null> {
    const current = appStore.getState()[target].id
    const candidates = shuffle(poolFor(target).filter(id => id !== current && embeddable.get(id) !== false))
    for (const id of candidates) {
        if (await checkEmbeddable(id)) return id
    }
    return null
}

// Latest request per source wins, so rapid shuffle clicks can't land out of order
const pending: Record<Target, number> = { videoA: 0, videoB: 0 }

export async function loadRandomVideo(target: Target, updates: Partial<VideoState> = {}) {
    const token = ++pending[target]
    const id = await pickRandomId(target)
    if (token !== pending[target]) return
    if (!id) {
        videoErrorStore.setState({ [target]: 'No playable videos left in the random pool.' })
        return
    }
    updateVideoState(target, { id, playing: true, lastInteraction: Date.now(), ...updates })
}

export function handlePlayerError(target: Target, videoId: string, code: number) {
    if (!FATAL_PLAYER_ERRORS.includes(code)) return
    embeddable.set(videoId, false)
    if (isPoolId(videoId)) {
        // Reset to full-length loop; the broken video's duration was 0
        void loadRandomVideo(target, { start: 0, end: 0, lastInteraction: 0 })
        return
    }
    videoErrorStore.setState({ [target]: "This video can't be embedded (removed, private, or embedding disabled)." })
}
