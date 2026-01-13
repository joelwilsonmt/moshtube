import { useRef, useEffect, useState } from 'react'
import { useStore } from 'zustand'
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube'
import { appStore, updateVideoState } from '../store/appStore'
import { getShaderConfig } from '../utils/shaderUtils'

// Map "Shader" names to CSS Filters
const getPosterizeSteps = (steps: number) => {
    const arr = []
    for (let i = 0; i <= steps; i++) {
        arr.push(i / steps)
    }
    return arr.join(' ')
}

const getCssFilter = (shader: string, params: Record<string, number>, layerId: string) => {
    const i = params.intensity 
    switch (shader) {
        case 'pixelate': return `url(#${layerId}-pixelate)`
        case 'wavy': return `url(#${layerId}-wavy)`
        case 'posterize': return `url(#${layerId}-posterize)`

        case 'vcr':
             const deg = i ?? 1
             return `blur(${deg * 0.5}px) sepia(${50 * deg}%) contrast(${100 + 50 * deg}%) saturate(${100 + 50 * deg}%)`
        case 'trippy':
             const shift = i ?? 180
             return `invert(100%) hue-rotate(${shift}deg) contrast(150%)`
        case 'glow':
             const rad = i ?? 10
             return `drop-shadow(0 0 ${rad}px rgba(255,255,255,0.8)) brightness(1.2)`
        case 'scanlines':
            return 'contrast(120%) brightness(110%)'

        case 'glitch': return `url(#${layerId}-glitch)`

        case 'ink': 
             const contrast = i ?? 3
             return `grayscale(1) contrast(${contrast}) brightness(1.2)`
        case 'predator':
             const heat = i ?? 180
             return `invert(1) hue-rotate(${heat}deg) saturate(200%)`
        case 'solarize':
             return 'invert(100%) contrast(150%)'
        case 'dream':
             const blur = i ?? 5
             return `blur(${blur}px) brightness(1.2) saturate(150%)`
        case 'xray':
             return 'grayscale(1) invert(1) contrast(1.2)'
        default:
            return 'none'
    }
}

interface LayerProps {
  id: 'videoA' | 'videoB'
  className?: string
  style?: React.CSSProperties
}

function Layer({ id, className = '', style }: LayerProps) {
    const state = useStore(appStore, s => s[id])
    const { videoId, playing, shader, shaderParams, start, end, seek } = {
        videoId: state.id,
        playing: state.playing,
        shader: state.shader,
        shaderParams: state.shaderParams,
        start: state.start,
        end: state.end,
        seek: state.seek,
    }
    
    const isMasterPlaying = useStore(appStore, s => s.outputPlaying)
    const playerRef = useRef<YouTubePlayer | null>(null)
    const [duration, setDuration] = useState(0)
    
    const shouldPlay = playing && isMasterPlaying

    // Sync Playback
    useEffect(() => {
        if (!playerRef.current) return
        if (shouldPlay) {
             // Ensure normal playback speed
             if (typeof playerRef.current?.setPlaybackRate === 'function') {
                 playerRef.current.setPlaybackRate(1)
             }
            playerRef.current.playVideo()
        } else {
            playerRef.current.pauseVideo()
        }
    }, [shouldPlay])

    // Seek when Loop Start changes
    useEffect(() => {
        if (!playerRef.current) return
        playerRef.current.seekTo(start, true)
    }, [start])

    // Handle Scrubbing/Seeking from MiniPlayer
    useEffect(() => {
        if (!playerRef.current || !seek) return
        playerRef.current.seekTo(seek.time, true)
    }, [seek?.trigger])

    // Loop Logic
    useEffect(() => {
        if (!playerRef.current || start == null || !end || end <= start) return
        
        const interval = setInterval(async () => {
             // Only loop if we are actually playing (not frozen)
             if (!shouldPlay) return

             const currentTime = await playerRef.current.getCurrentTime()
             if (currentTime >= end) {
                 playerRef.current.seekTo(start, true)
             }
        }, 100) 
        
        return () => clearInterval(interval)
    }, [start, end, shouldPlay])
    // Oscillation Logic
    useEffect(() => {
        if (!state.oscillate || !state.shader || state.shader === 'none') return

        const config = getShaderConfig(state.shader)
        let rafId: number
        
        const animate = () => {
             const time = Date.now()
             // 10s period sine wave (0 to 1) - T=10s => w = 2PI/10000
             const factor = (Math.sin((time / 10000) * Math.PI * 2) + 1) / 2

             const val = config.min + (config.max - config.min) * factor
             
             // Read fresh params to avoid clobbering
             const currentParams = appStore.getState()[id].shaderParams
             updateVideoState(id, { shaderParams: { ...currentParams, intensity: val } })
             
             rafId = requestAnimationFrame(animate)
        }
        
        rafId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(rafId)
    }, [state.oscillate, state.shader, id])

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: playing && isMasterPlaying ? 1 : 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            mute: 1, // Must be muted for autoplay
             // origin: window.location.origin
        },
    }

    const onReady: YouTubeProps['onReady'] = (e) => {
        playerRef.current = e.target
        const dur = e.target.getDuration()
        setDuration(dur)
        
        // Update store with actual duration. 
        // If end < 0, interpret as offset from duration.
        // If no interaction, set selection to full video.
        const updates: any = { duration: dur }
        
        if (state.end < 0) {
            updates.end = Math.max(0, dur + state.end)
        } else if (!state.lastInteraction || state.lastInteraction === 0) {
            updates.end = dur
            updates.start = 0
        }

        updateVideoState(id, updates)
        
        // Initial sync
        if (playing && isMasterPlaying) {
            // Seek to start position if defined and user-set
            if (state.lastInteraction && state.lastInteraction > 0 && start > 0) {
                 e.target.seekTo(start, true)
            }
            e.target.playVideo()
        }
    }

    // Dynamic Style for CSS Effects
    const filter = getCssFilter(shader, shaderParams, id)
    const transform = 'none'

    const onStateChange: YouTubeProps['onStateChange'] = (e) => {
        if (e.data === 0) { // ENDED
             e.target.seekTo(start, true)
             e.target.playVideo()
        }
    }

    return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={{ ...style, filter, transform }}>
             <YouTube
                key={videoId}
                videoId={videoId}
                opts={opts}
                onReady={onReady}
                onStateChange={onStateChange}
                className="w-full h-full object-cover scale-[1.35]" // Small scale to remove letterboxing?
                iframeClassName="w-full h-full object-cover pointer-events-none"
             />
             {shader === 'scanlines' && (
                <div className="absolute inset-0 pointer-events-none z-20 bg-[size:100%_3px] bg-repeat-y" 
                     style={{
                        backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%)',
                        backgroundSize: `100% ${shaderParams.intensity ?? 3}px`
                     }} 
                />
             )}
             
            {/* Local SVG Filters for Dynamic Intensity */}
            <svg className="absolute w-0 h-0 pointer-events-none">
                <defs>
                    <filter id={`${id}-wavy`}>
                        <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="5" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale={shader === 'wavy' ? (shaderParams.intensity ?? 40) : 0} />
                    </filter>
                    
                    <filter id={`${id}-posterize`}>
                        <feComponentTransfer>
                            <feFuncR type="discrete" tableValues={getPosterizeSteps(shaderParams.intensity ?? 4)} />
                            <feFuncG type="discrete" tableValues={getPosterizeSteps(shaderParams.intensity ?? 4)} />
                            <feFuncB type="discrete" tableValues={getPosterizeSteps(shaderParams.intensity ?? 4)} />
                        </feComponentTransfer>
                    </filter>
                    
                    <filter id={`${id}-pixelate`}>
                        <feMorphology operator="dilate" radius={(shader === 'pixelate' ? (shaderParams.intensity ?? 8) : 0)} in="SourceGraphic" />
                    </filter>
                </defs>
            </svg>
            
            {/* Extended SVG Filters */}
            <svg className="absolute w-0 h-0 pointer-events-none">
                <defs>
                   <filter id={`${id}-glitch`}>
                        <feTurbulence type="turbulence" baseFrequency="0.5 0.05" numOctaves="2" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale={shader === 'glitch' ? (shaderParams.intensity ?? 30) : 0} />
                    </filter>
                </defs>
            </svg>
        </div>
    )
}

export function Stage() {
    const blendMode = useStore(appStore, s => s.blendMode)
    const mix = useStore(appStore, s => s.mix)
    const activeOverlay = useStore(appStore, s => s.activeOverlay) || 'videoB'

    const bottomId = activeOverlay === 'videoA' ? 'videoB' : 'videoA'
    const topId = activeOverlay

    return (
        <div className="relative w-full h-full bg-black overflow-hidden group">
            {/* Bottom Layer */}
            <Layer 
                id={bottomId} 
                className="z-0"
            />
            
            {/* Top Layer (Overlay) */}
            <Layer 
                id={topId} 
                className="z-10"
                style={{ 
                    mixBlendMode: blendMode as any, 
                    opacity: mix 
                }}
            />
        </div>
    )
}
