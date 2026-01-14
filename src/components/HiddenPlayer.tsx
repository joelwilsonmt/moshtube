import { useRef, useState, useEffect } from 'react'
import YouTube, { YouTubePlayer, YouTubeProps } from 'react-youtube'
import { useStore } from 'zustand'
import { appStore, updateVideoState } from '../store/appStore'
import { Slider } from './ui/core'
import { Play, Pause } from 'lucide-react'

interface Props {
  id: 'videoA' | 'videoB'
}

export function HiddenPlayer({ id }: Props) {
  const state = useStore(appStore, s => s[id])
  const isMasterPlaying = useStore(appStore, s => s.outputPlaying)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const [currentTime, setCurrentTime] = useState(0)

  // Polling for scrubber update AND Loop Logic
  useEffect(() => {
    const interval = setInterval(async () => {
        if (playerRef.current) {
            const t = await playerRef.current.getCurrentTime()
            setCurrentTime(t)
            
            // Loop Logic: Sync with Stage behavior
            if (state.loop && state.end > state.start && t >= state.end) {
                 playerRef.current.seekTo(state.start, true)
            }
        }
    }, 100)
    return () => clearInterval(interval)
  }, [state.loop, state.start, state.end])

  // Listen for Seek Events (from Control Panel)
  useEffect(() => {
      if (!playerRef.current || !state.seek) return
      // Prevent internal seek loop if we just broadcasted it? 
      // Actually, checking if time is significantly different or relying on trigger.
      // Since `seek` is an object with a timestamp trigger, we can just effect on that.
      playerRef.current.seekTo(state.seek.time, true)
      setCurrentTime(state.seek.time)
  }, [state.seek?.trigger])

  const handleSeek = (val: number) => {
      setCurrentTime(val)
      playerRef.current?.seekTo(val, true)
      // Broadcast seek to Stage
      updateVideoState(id, { seek: { time: val, trigger: Date.now() } })
  }

  const opts: YouTubeProps['opts'] = {
      height: '100%',
      width: '100%',
      playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          mute: 1 // Always mute mini player
      },
  }

  // Sync Playback state
  useEffect(() => {
       if (!playerRef.current) return
       if (state.playing && isMasterPlaying) playerRef.current.playVideo()
       else playerRef.current.pauseVideo()
  }, [state.playing, isMasterPlaying])

  return (
    <div className="space-y-2">
        <div 
            className="aspect-video w-full bg-zinc-900 rounded overflow-hidden relative border border-zinc-800 group/player cursor-pointer"
            onClick={() => updateVideoState(id, { playing: !state.playing })}
        >
             <YouTube
                key={state.id}
                videoId={state.id}
                opts={opts}
                className="w-full h-full object-cover opacity-50 group-hover/player:opacity-100 transition-opacity pointer-events-none"
                iframeClassName="w-full h-full object-cover pointer-events-none"
                onReady={(e) => {
                    playerRef.current = e.target
                    // Initial Seek to Loop Start to match renderer
                    if (state.start > 0) e.target.seekTo(state.start, true)

                    if (state.playing && isMasterPlaying) e.target.playVideo()
                }}
             />
        </div>
        
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>{currentTime.toFixed(1)}s</span>
                <span>{state.duration.toFixed(1)}s</span>
            </div>
            <Slider 
                min={0} max={state.duration || 100} step={0.1}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
            />
        </div>

        <div className="flex justify-between items-center text-xs text-zinc-500">
            <span className="font-mono text-[10px]">{state.id}</span>
            <button 
                onClick={() => updateVideoState(id, { playing: !state.playing })}
                className={`p-1.5 rounded-full transition-colors ${state.playing ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100' : 'bg-green-600 text-white hover:bg-green-500'}`}
            >
                {state.playing ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            </button>
        </div>
    </div>
  )
}
