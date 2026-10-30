import { useEffect, useRef, useState } from 'react'
import { getPlayer } from '../engine/players'
import type { SourceId } from '../store/schema'
import { getVideoTitle } from '../utils/youtube'
import { IDLE_TIMEOUT_MS } from '../utils/config'

// Calls `fn` every animation frame; for imperative UI (meters, live markers)
export function useFrame(fn: () => void) {
    const fnRef = useRef(fn)
    fnRef.current = fn
    useEffect(() => {
        let raf = 0
        const tick = () => {
            fnRef.current()
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [])
}

// Current playback position of a stage player, polled
export function usePlayhead(id: SourceId, intervalMs = 250) {
    const [time, setTime] = useState(0)
    useEffect(() => {
        const timer = setInterval(async () => {
            const player = getPlayer(id)
            if (!player) return
            const t = await player.getCurrentTime()
            if (typeof t === 'number') setTime(t)
        }, intervalMs)
        return () => clearInterval(timer)
    }, [id, intervalMs])
    return time
}

export function useVideoTitle(videoId: string | undefined) {
    const [title, setTitle] = useState<string | null>(null)
    useEffect(() => {
        setTitle(null)
        if (!videoId) return
        let cancelled = false
        getVideoTitle(videoId).then((t) => !cancelled && setTitle(t))
        return () => { cancelled = true }
    }, [videoId])
    return title
}

export function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
    useEffect(() => {
        const mql = window.matchMedia(query)
        const onChange = () => setMatches(mql.matches)
        mql.addEventListener('change', onChange)
        return () => mql.removeEventListener('change', onChange)
    }, [query])
    return matches
}

// True after a few seconds without pointer or key input (hides overlays on the output)
export function useIdle(enabled: boolean) {
    const [idle, setIdle] = useState(false)
    useEffect(() => {
        if (!enabled) return setIdle(false)
        let timeout: ReturnType<typeof setTimeout>
        const reset = () => {
            setIdle(false)
            clearTimeout(timeout)
            timeout = setTimeout(() => setIdle(true), IDLE_TIMEOUT_MS)
        }
        const events = ['mousemove', 'keydown', 'pointerdown', 'touchstart']
        events.forEach((e) => window.addEventListener(e, reset))
        reset()
        return () => {
            events.forEach((e) => window.removeEventListener(e, reset))
            clearTimeout(timeout)
        }
    }, [enabled])
    return idle
}
