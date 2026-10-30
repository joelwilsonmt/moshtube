import { useRef, useEffect } from 'react'
import { useStore } from 'zustand'
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube'
import { appStore, updateVideoState } from '../store/appStore'
import type { AppState, SourceId, VideoState } from '../store/schema'
import { applyFx, FxDefs, wave } from '../fx/effects'
import { beatsNow } from '../engine/clock'
import { registerPlayer } from '../engine/players'
import { handlePlayerError } from '../utils/youtube'
import { OverlayLayer } from './OverlayLayer'

const REVEAL_DELAY_MS = 4000

// Live top-layer opacity: the mix, swept from 0 up to it when oscillating
export function liveMix(state: AppState, beats: number) {
    if (!state.mixOsc.on) return state.mix
    return state.mix * wave(state.mixOsc.shape, (beats / state.mixOsc.rate) % 1)
}

// Runs every frame, writing modulated values straight to the DOM (no React renders)
function useFxLoop(apply: (beats: number, state: AppState) => void) {
    const applyRef = useRef(apply)
    applyRef.current = apply
    useEffect(() => {
        let raf = 0
        const tick = () => {
            applyRef.current(beatsNow(), appStore.getState())
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [])
}

interface LayerProps {
    id: SourceId
    isTop: boolean
}

function Layer({ id, isTop }: LayerProps) {
    const videoId = useStore(appStore, (s) => s[id].id)
    const playing = useStore(appStore, (s) => s[id].playing)
    const start = useStore(appStore, (s) => s[id].start)
    const end = useStore(appStore, (s) => s[id].end)
    const loop = useStore(appStore, (s) => s[id].loop)
    const seekTrigger = useStore(appStore, (s) => s[id].seek?.trigger)
    const effects = useStore(appStore, (s) => s[id].effects)
    const blendMode = useStore(appStore, (s) => s.blendMode)
    const isMasterPlaying = useStore(appStore, (s) => s.outputPlaying)

    const playerRef = useRef<YouTubePlayer | null>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    // Hold the layer at black until its video actually plays, so YouTube's loading
    // chrome never shows on the output; then fade it in
    const readyRef = useRef(false)
    const fadeRef = useRef(0)
    const revealRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const scanRef = useRef<HTMLDivElement>(null)
    const shouldPlay = playing && isMasterPlaying

    useFxLoop((beats, state) => {
        const wrap = wrapRef.current
        if (!wrap) return
        const fx = applyFx(state[id].effects, id, { beats, bpm: state.bpm })
        wrap.style.filter = fx.filter
        wrap.style.transform = fx.transform
        fadeRef.current += ((readyRef.current ? 1 : 0) - fadeRef.current) * 0.08
        if (fadeRef.current > 0.995) fadeRef.current = 1
        wrap.style.opacity = String((isTop ? liveMix(state, beats) : 1) * fadeRef.current)
        if (scanRef.current) {
            scanRef.current.style.display = fx.scanlineHeight ? 'block' : 'none'
            if (fx.scanlineHeight) scanRef.current.style.backgroundSize = `100% ${fx.scanlineHeight}px`
        }
    })

    // A new video remounts the player; drop the old one so nothing calls into a detached iframe
    useEffect(() => () => {
        playerRef.current = null
        registerPlayer(id, null)
        readyRef.current = false
        fadeRef.current = 0
        clearTimeout(revealRef.current)
        revealRef.current = undefined
    }, [id, videoId])

    useEffect(() => {
        if (!playerRef.current) return
        if (shouldPlay) {
            playerRef.current.setPlaybackRate?.(1)
            playerRef.current.playVideo()
        } else {
            playerRef.current.pauseVideo()
        }
    }, [shouldPlay])

    // Seek when loop start changes, or when the inspector scrubs
    useEffect(() => {
        playerRef.current?.seekTo(start, true)
    }, [start])

    useEffect(() => {
        const seek = appStore.getState()[id].seek
        if (playerRef.current && seek) playerRef.current.seekTo(seek.time, true)
    }, [seekTrigger, id])

    useEffect(() => {
        if (!loop || !end || end <= start) return
        const interval = setInterval(async () => {
            if (!shouldPlay || !playerRef.current) return
            const t = await playerRef.current.getCurrentTime()
            if (t >= end) playerRef.current.seekTo(start, true)
        }, 100)
        return () => clearInterval(interval)
    }, [start, end, loop, shouldPlay])

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: shouldPlay ? 1 : 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            mute: 1, // Must be muted for autoplay
        },
    }

    const onReady: YouTubeProps['onReady'] = (e) => {
        playerRef.current = e.target
        registerPlayer(id, e.target)
        // The output is a picture, not a control: keep the iframe out of the tab order
        e.target.getIframe?.()?.setAttribute('tabindex', '-1')
        const state = appStore.getState()[id]
        const dur = e.target.getDuration()

        // end < 0 is an offset from the duration; without user edits the loop is the whole video
        const updates: Partial<VideoState> = { duration: dur }
        if (state.end < 0) {
            updates.end = Math.max(0, dur + state.end)
        } else if (!state.lastInteraction) {
            updates.end = dur
            updates.start = 0
        }
        updateVideoState(id, updates)

        if (state.playing && appStore.getState().outputPlaying) {
            if (state.start > 0) e.target.seekTo(state.start, true)
            e.target.playVideo()
        } else {
            readyRef.current = true // nothing will play, so show what's there
        }
    }

    const onStateChange: YouTubeProps['onStateChange'] = (e) => {
        // YouTube's own play/pause glyph lingers for a moment after playback starts
        if (e.data === 1 && !readyRef.current && !revealRef.current) {
            revealRef.current = setTimeout(() => { readyRef.current = true }, REVEAL_DELAY_MS)
        }
        if (e.data === 0) { // ENDED
            e.target.seekTo(start, true)
            e.target.playVideo()
        }
    }

    return (
        <div
            ref={wrapRef}
            className={`absolute inset-0 pointer-events-none overflow-hidden ${isTop ? 'z-10' : 'z-0'}`}
            style={isTop ? { mixBlendMode: blendMode } : undefined}
        >
            {/* Cover-crop: the 16:9 player fills any stage shape (container query units) */}
            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ width: 'max(100cqw, calc(100cqh * 16 / 9))', height: 'max(100cqh, calc(100cqw * 9 / 16))' }}
            >
                <YouTube
                    key={videoId}
                    videoId={videoId}
                    opts={opts}
                    onReady={onReady}
                    onStateChange={onStateChange}
                    onError={(e) => videoId && handlePlayerError(id, videoId, e.data)}
                    className="w-full h-full scale-[1.35]" // crops YouTube's title bar
                    iframeClassName="w-full h-full pointer-events-none"
                    title={`Source ${id === 'videoA' ? 'A' : 'B'} video`}
                />
            </div>
            <div
                ref={scanRef}
                className="absolute inset-0 pointer-events-none z-20 hidden"
                style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%)' }}
            />
            <FxDefs effects={effects} scope={id} />
        </div>
    )
}

export function Stage() {
    const activeOverlay = useStore(appStore, (s) => s.activeOverlay)
    const masterEffects = useStore(appStore, (s) => s.masterEffects)
    const masterRef = useRef<HTMLDivElement>(null)
    const scanRef = useRef<HTMLDivElement>(null)

    useFxLoop((beats, state) => {
        const el = masterRef.current
        if (!el) return
        const fx = applyFx(state.masterEffects, 'master', { beats, bpm: state.bpm })
        el.style.filter = fx.filter
        el.style.transform = fx.transform
        if (scanRef.current) {
            scanRef.current.style.display = fx.scanlineHeight ? 'block' : 'none'
            if (fx.scanlineHeight) scanRef.current.style.backgroundSize = `100% ${fx.scanlineHeight}px`
        }
    })

    return (
        <div className="absolute inset-0 overflow-hidden bg-black [container-type:size]" aria-label="Output" role="img">
            <div ref={masterRef} className="absolute inset-0 isolate">
                <Layer id="videoA" isTop={activeOverlay === 'videoA'} />
                <Layer id="videoB" isTop={activeOverlay === 'videoB'} />
                <OverlayLayer />
                <div
                    ref={scanRef}
                    className="absolute inset-0 pointer-events-none z-20 hidden"
                    style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%)' }}
                />
            </div>
            <FxDefs effects={masterEffects} scope="master" />
        </div>
    )
}
