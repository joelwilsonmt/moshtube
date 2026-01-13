import { useRef, useState, useEffect } from 'react'
import { useStore } from 'zustand'
import { appStore, setBlendMode, setMix, setOutputPlaying, setMixOscillate, setActiveOverlay } from '../store/appStore'
import { VideoControlPanel } from './VideoControlPanel'
import { Stage } from './Stage' 
import { BlendModeSchema } from '../store/schema'
import { Slider, Label } from './ui/core'
import { Play, Pause, Maximize, Minimize, Zap, Sparkles } from 'lucide-react'
import { moshGlobal, moshMeDaddy } from '../utils/mosh'

import { HiddenPlayer } from './HiddenPlayer'
import { IDLE_TIMEOUT_MS } from '../utils/config'

export function Dashboard() {
  const blendMode = useStore(appStore, s => s.blendMode)
  const mix = useStore(appStore, s => s.mix)
  const mixOscillate = useStore(appStore, s => s.mixOscillate)
  const activeOverlay = useStore(appStore, s => s.activeOverlay) || 'videoB'
  const outputPlaying = useStore(appStore, s => s.outputPlaying)
  const blendOptions = BlendModeSchema.options

  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isIdle, setIsIdle] = useState(false)

  // Mix Oscillation
  useEffect(() => {
      if (!mixOscillate) return
      let rafId: number
      const animate = () => {
           const time = Date.now()
           // 10s period sine wave (0 to 1)
           const factor = (Math.sin((time / 10000) * Math.PI * 2) + 1) / 2
           setMix(factor)
           rafId = requestAnimationFrame(animate)
      }
      rafId = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(rafId)
  }, [mixOscillate])

  useEffect(() => {
      const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
      document.addEventListener('fullscreenchange', handleChange)
      return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  // Idle Timer
  useEffect(() => {
      let timeout: any
      const resetIdle = () => {
          setIsIdle(false)
          clearTimeout(timeout)
          timeout = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS)
      }
      const events = ['mousemove', 'keydown', 'click', 'touchstart']
      events.forEach(e => window.addEventListener(e, resetIdle))
      resetIdle()
      return () => {
          events.forEach(e => window.removeEventListener(e, resetIdle))
          clearTimeout(timeout)
      }
  }, [])

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen()
      } else {
          document.exitFullscreen()
      }
  }

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-zinc-800 flex items-center px-4 shrink-0">
        <h1 className="font-bold text-xl tracking-tighter">MOSHTUBE</h1>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-80 border-r border-zinc-800 p-2 overflow-y-auto shrink-0">
          <VideoControlPanel id="videoA" title="Source A" />
          <div className="mt-4">
            <HiddenPlayer id="videoA" />
          </div>
        </aside>

        {/* Center Canvas / Stage */}
        <main 
            ref={containerRef} 
            className={`flex-1 bg-black flex flex-col items-center justify-center relative overflow-hidden group/stage ${isFullscreen && isIdle ? 'cursor-none' : 'cursor-pointer'}`}
            onClick={() => setOutputPlaying(!outputPlaying)}
        >
             <div className="flex-1 w-full h-full relative">
                 <Stage />
                 
                 {/* Fullscreen Controls Overlay */}
                 {isFullscreen && (
                     <div 
                        className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 pr-3 pl-3 rounded-2xl bg-zinc-900/80 backdrop-blur-lg border border-white/10 shadow-2xl transition-all duration-500 z-50 ${isIdle ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}
                        onClick={(e) => e.stopPropagation()}
                     >
                        <button
                            onClick={() => moshMeDaddy()}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-pink-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Sparkles size={16} fill="currentColor" />
                            <span className="whitespace-nowrap">Mosh Me Daddy</span>
                        </button>

                        <button 
                            onClick={() => moshGlobal()}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                            <Zap size={16} fill="currentColor" />
                            Mosh
                        </button>
                        
                        <div className="w-px h-8 bg-white/10 mx-1" />

                        <button 
                            onClick={() => toggleFullscreen()}
                            className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors"
                        >
                            <Minimize size={20} />
                        </button>
                     </div>
                 )}

                 {/* Maximize Button (Only when not fullscreen) */}
                 {!isFullscreen && (
                     <button 
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleFullscreen()
                        }}
                        className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded backdrop-blur-sm transition-opacity opacity-0 group-hover/stage:opacity-100 z-40"
                     >
                        <Maximize size={20} />
                     </button>
                 )}
             </div>
             
             {/* Master Transport Controls - Hide in Fullscreen */}
             {!isFullscreen && (
                 <div className="h-12 w-full bg-zinc-950 border-t border-zinc-800 flex items-center justify-center shrink-0 z-50 gap-4">
                      
                      <button 
                        onClick={(e) => {
                            e.stopPropagation()
                            moshGlobal()
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all hover:scale-105 shadow-lg shadow-purple-900/50"
                      >
                          <Zap size={14} fill="currentColor" />
                          MOSH
                      </button>

                      <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setOutputPlaying(!outputPlaying)
                        }}
                        className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${outputPlaying ? 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700' : 'bg-green-600 text-white shadow-lg shadow-green-900/50 hover:bg-green-500'}`}
                      >
                         {outputPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                      </button>
                 </div>
             )}
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 border-l border-zinc-800 p-2 overflow-y-auto shrink-0">
           <VideoControlPanel id="videoB" title="Source B" />
           <div className="mt-4">
             <HiddenPlayer id="videoB" />
           </div>
        </aside>
      </div>

      {/* Bottom Master Controls */}
      <footer className="h-24 border-t border-zinc-800 px-6 shrink-0 bg-zinc-900/30 flex items-center">
        <div className="grid grid-cols-3 gap-8 w-full max-w-6xl mx-auto items-center">
            
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                    <Label className="whitespace-nowrap font-bold text-zinc-400 w-20">Blend Mode</Label>
                    <select 
                        value={blendMode}
                        onChange={(e) => setBlendMode(e.target.value as any)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md p-1.5 text-sm focus:ring-1 focus:ring-green-500 outline-none"
                    >
                        {blendOptions.map(m => {
                            let desc = ''
                            switch(m) {
                                case 'normal': desc = '(Standard)'; break;
                                case 'multiply': desc = '(Darker)'; break;
                                case 'screen': desc = '(Brighter)'; break;
                                case 'overlay': desc = '(Contrast)'; break;
                                case 'difference': desc = '(Invert)'; break;
                                case 'exclusion': desc = '(Soft Invert)'; break;
                            }
                            return <option key={m} value={m}>{m.toUpperCase()} {desc}</option>
                        })}
                    </select>
                </div>

                <div 
                    className={`flex items-center gap-4 overflow-hidden transition-all duration-500 ease-out ${blendMode === 'overlay' ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                     <Label className="whitespace-nowrap font-bold text-zinc-400 w-20">Layer Order</Label>
                     <div className="flex bg-zinc-950 rounded-md border border-zinc-800 p-0.5 flex-1">
                         <button 
                            onClick={() => setActiveOverlay('videoA')}
                            className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${activeOverlay === 'videoA' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                         >
                            A on Top
                         </button>
                         <button 
                            onClick={() => setActiveOverlay('videoB')}
                            className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${activeOverlay === 'videoB' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                         >
                            B on Top
                         </button>
                     </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                    <Label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Master Mix</Label>
                    <span className="text-xs font-mono text-zinc-300">{mix.toFixed(2)}</span>
                </div>
                <Slider 
                    min={0} max={1} step={0.01}
                    value={mix}
                    onChange={(e) => setMix(parseFloat(e.target.value))}
                    className="py-1"
                />
                 <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-200 select-none justify-center pt-1">
                    <input 
                        type="checkbox" 
                        checked={mixOscillate}
                        onChange={(e) => setMixOscillate(e.target.checked)}
                        className="accent-green-500 rounded bg-zinc-800 border-zinc-700"
                    />
                    Oscillate (10s)
                </label>
            </div>

            <div className="flex justify-end">
                 <button
                    onClick={() => moshMeDaddy()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg shadow-lg hover:shadow-pink-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                 >
                    <Sparkles size={18} fill="currentColor" className="text-white shrink-0" />
                    <span className="text-sm font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">Example Mosh Me Daddy</span>
                 </button>
            </div>
        </div>
      </footer>
    </div>
  )
}
