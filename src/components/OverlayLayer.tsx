import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { appStore } from '../store/appStore'
import type { Pattern } from '../store/schema'
import { beatsNow } from '../engine/clock'
import { createPatternRenderer } from '../fx/patterns'

// Load errors for layer C media, shown in the inspector
export const overlayErrorStore = createStore(() => ({ error: null as string | null }))

const IMAGE_EXT = /\.(gif|png|webp|apng|avif)(\?|#|$)/i

// reportErrors: false for previews, so only the stage layer owns the error message
export function PatternCanvas({ pattern, reportErrors = true }: { pattern: Pattern; reportErrors?: boolean }) {
    const ref = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        const canvas = ref.current
        if (!canvas) return
        let renderer: ReturnType<typeof createPatternRenderer> = null
        try {
            renderer = createPatternRenderer(canvas, pattern)
        } catch (err) {
            console.error(err)
        }
        if (!renderer) {
            if (reportErrors) overlayErrorStore.setState({ error: 'This browser could not start WebGL, so patterns are unavailable.' })
            return
        }
        if (reportErrors) overlayErrorStore.setState({ error: null })
        let raf = 0
        const tick = () => {
            renderer!.render(beatsNow(), appStore.getState().overlay.hue)
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(raf)
            renderer!.dispose()
        }
    }, [pattern, reportErrors])
    return <canvas ref={ref} className="h-full w-full" />
}

export function MediaView({ url, reportErrors = true }: { url: string; reportErrors?: boolean }) {
    const playing = useStore(appStore, (s) => s.outputPlaying)
    const videoRef = useRef<HTMLVideoElement>(null)
    useEffect(() => { if (reportErrors) overlayErrorStore.setState({ error: null }) }, [url, reportErrors])
    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        if (playing) void video.play().catch(() => {})
        else video.pause()
    }, [playing, url])

    const onError = () => reportErrors && overlayErrorStore.setState({ error: 'That link did not load. It needs to be a direct link to a video or GIF file.' })
    if (IMAGE_EXT.test(url)) return <img src={url} alt="" onError={onError} className="h-full w-full object-cover" />
    return <video ref={videoRef} key={url} src={url} autoPlay loop muted playsInline onError={onError} className="h-full w-full object-cover" />
}

export function OverlayLayer() {
    const overlay = useStore(appStore, (s) => s.overlay)
    if (overlay.kind === 'off' || (overlay.kind === 'media' && !overlay.url)) return null
    return (
        <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{ mixBlendMode: overlay.blend, opacity: overlay.opacity }}
        >
            {overlay.kind === 'pattern' ? <PatternCanvas pattern={overlay.pattern} /> : <MediaView url={overlay.url} />}
        </div>
    )
}
