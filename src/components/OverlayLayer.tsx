import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { appStore } from '../store/appStore'
import type { Pattern } from '../store/schema'
import { beatsNow } from '../engine/clock'
import { createPatternRenderer } from '../fx/patterns'
import { builtInLottie, isBuiltInLottie } from '../fx/lotties'
import type { AnimationItem } from 'lottie-web'
import { cn } from './ui/core'

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

// Lottie loop driven frame by frame from the beat clock: one loop lasts `loopBeats`
// beats and freezes with the output. Built-ins are white and take the Layer C hue.
export function LottieView({ source, reportErrors = true }: { source: string; reportErrors?: boolean }) {
    const ref = useRef<HTMLDivElement>(null)
    const hue = useStore(appStore, (s) => s.overlay.hue)
    const builtIn = isBuiltInLottie(source)

    useEffect(() => {
        const container = ref.current
        if (!container) return
        let cancelled = false
        let raf = 0
        let anim: AnimationItem | null = null
        const fail = () => reportErrors && overlayErrorStore.setState({ error: 'That link did not load as a Lottie animation. It needs to be a direct link to a Lottie .json file.' })

        import('lottie-web/build/player/lottie_light')
            .then(({ default: lottie }) => {
                if (cancelled) return
                anim = lottie.loadAnimation({
                    container,
                    renderer: 'svg',
                    loop: false,
                    autoplay: false,
                    // lottie-web mutates animation data, so every instance gets its own copy
                    ...(isBuiltInLottie(source) ? { animationData: structuredClone(builtInLottie(source)) } : { path: source }),
                    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
                })
                anim.addEventListener('data_failed', fail)
                anim.addEventListener('DOMLoaded', () => { if (reportErrors) overlayErrorStore.setState({ error: null }) })
                const tick = () => {
                    const total = anim?.totalFrames ?? 0
                    if (total > 1) anim!.goToAndStop(((beatsNow() / appStore.getState().overlay.loopBeats) % 1) * (total - 1), true)
                    raf = requestAnimationFrame(tick)
                }
                raf = requestAnimationFrame(tick)
            })
            .catch(fail)

        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
            anim?.destroy()
        }
    }, [source, reportErrors])

    return <div ref={ref} className={cn('h-full w-full', builtIn && 'lottie-tint')} style={builtIn ? { color: `hsl(${hue} 90% 65%)` } : undefined} />
}

export function OverlayLayer() {
    const overlay = useStore(appStore, (s) => s.overlay)
    if (overlay.kind === 'off' || (overlay.kind === 'media' && !overlay.url)) return null
    const content = overlay.kind === 'pattern' ? <PatternCanvas pattern={overlay.pattern} />
        : overlay.kind === 'lottie' ? <LottieView source={overlay.lottie} />
        : <MediaView url={overlay.url} />
    return (
        <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{ mixBlendMode: overlay.blend, opacity: overlay.opacity }}
        >
            {content}
        </div>
    )
}
