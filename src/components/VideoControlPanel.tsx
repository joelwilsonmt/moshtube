import { useStore } from 'zustand'
import { appStore, updateVideoState } from '../store/appStore'
import { Input, Label, Slider } from './ui/core'
import { ShaderTypeSchema } from '../store/schema'
import { Play, Pause, Zap, Shuffle } from 'lucide-react'
import { getShaderConfig } from '../utils/shaderUtils'
import { moshVideo } from '../utils/mosh'
import { SOURCE_A_IDS, SOURCE_B_IDS } from '../utils/sourceLists'

interface Props {
  id: 'videoA' | 'videoB'
  title: string
}

function ShaderControls({ shader, params, check, onChange, onCheck }: { shader: string, params: Record<string, number>, check: boolean, onChange: (p: any) => void, onCheck: (v: boolean) => void }) {
    const config = getShaderConfig(shader)
    const val = params.intensity ?? config.default
    
    return (
        <div className="pt-2 pb-2 border-b border-zinc-800 mb-2">
            <div className="flex justify-between mb-1">
                <Label>{config.label}</Label>
                <span className="text-xs font-mono">{val.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
                 <Slider 
                    min={config.min} max={config.max} step={config.step}
                    value={val}
                    onChange={(e) => onChange({ intensity: parseFloat(e.target.value) })}
                    className="flex-1"
                />
                 <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-200 select-none shrink-0 px-2 py-1 bg-zinc-950/50 rounded">
                    <input 
                        type="checkbox" 
                        checked={check}
                        onChange={(e) => onCheck(e.target.checked)}
                        className="accent-green-500 rounded bg-zinc-800 border-zinc-700 w-3.5 h-3.5"
                    />
                    Oscillate
                </label>
            </div>
        </div>
    )
}

export function VideoControlPanel({ id, title }: Props) {
  const state = useStore(appStore, (s) => s[id])
  const update = (updates: any) => updateVideoState(id, { ...updates, lastInteraction: Date.now() })
  const shaderOptions = ShaderTypeSchema.options

  const handleIdChange = (val: string) => {
      // Basic extraction
      let nextId = val
      try {
          const url = new URL(val)
          if (url.hostname.includes('youtube.com')) {
              nextId = url.searchParams.get('v') || nextId
          } else if (url.hostname.includes('youtu.be')) {
              nextId = url.pathname.slice(1) || nextId
          }
      } catch {}
      
      update({ id: nextId, playing: true, lastInteraction: Date.now() })
  }

  const handleRandom = () => {
      const list = id === 'videoA' ? SOURCE_A_IDS : SOURCE_B_IDS
      const randomId = list[Math.floor(Math.random() * list.length)]
      update({ id: randomId, playing: true, lastInteraction: Date.now() })
  }

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded mb-4">
      <h3 className="font-bold text-lg mb-4 flex justify-between items-center">
          {title}
          <div className="flex items-center gap-2">
              <button 
                onClick={() => moshVideo(id)}
                className="flex items-center gap-1 px-2 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-lg shadow-purple-900/50"
              >
                  <Zap size={12} fill="currentColor" />
                  MOSH
              </button>
              <button 
                onClick={() => update({ playing: !state.playing })}
                className={`p-1.5 rounded-full transition-colors ${state.playing ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100' : 'bg-green-600 text-white hover:bg-green-500'}`}
              >
                {state.playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              </button>
          </div>
      </h3>
      
      <div className="space-y-4">
        <Label>YouTube ID / URL</Label>
        <div className="flex gap-2">
            <Input 
              value={state.id || ''} 
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder="Video ID or URL"
              className="flex-1 font-mono text-xs"
            />
            <button 
                onClick={handleRandom}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                title="Random Suggested Video"
            >
                <Shuffle size={16} />
            </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Shader Effect</Label>
        <select 
          className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm"
          value={state.shader}
          onChange={(e) => updateVideoState(id, { shader: e.target.value as any })}
        >
          {shaderOptions.map(opt => (
            <option key={opt} value={opt}>{opt.toUpperCase()}</option>
          ))}
        </select>
        
        {state.shader !== 'none' && (
            <ShaderControls 
                shader={state.shader} 
                params={state.shaderParams} 
                check={!!state.oscillate}
                onChange={(p) => update({ shaderParams: { ...state.shaderParams, ...p } })} 
                onCheck={(v) => update({ oscillate: v })}
            />
        )}

        <div className="space-y-4">
            <div className="flex justify-between">
                <Label>Loop Start</Label>
                 <span className="text-xs font-mono">{state.start.toFixed(1)}s</span>
            </div>
            <Slider 
                min={0} max={state.duration || 100} step={0.1}
                value={state.start}
                onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    if (val < state.end) update({ start: val })
                }}
            />
            <Input
                type="number"
                min={0} max={state.duration || 100} step={0.01}
                value={state.start}
                onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    if (val < state.end) update({ start: val })
                }}
                className="mt-1 mb-3 font-mono"
            />
            
             <div className="flex justify-between">
                <Label>Loop End</Label>
                 <span className="text-xs font-mono">{state.end.toFixed(1)}s</span>
            </div>
            <Slider 
                min={0} max={state.duration || 100} step={0.1}
                value={state.end}
                onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    if (val > state.start) update({ end: val })
                }}
            />
            <Input
                type="number"
                min={0} max={state.duration || 100} step={0.01}
                value={state.end}
                onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    if (val > state.start) update({ end: val })
                }}
                className="mt-1 mb-2 font-mono"
            />
             <label className="flex items-center gap-2 text-sm">
                <input 
                    type="checkbox" 
                    checked={state.loop}
                    onChange={(e) => update({ loop: e.target.checked })}
                />
                Loop Enabled
            </label>
        </div>
    </div>
    </div>
  )
}
