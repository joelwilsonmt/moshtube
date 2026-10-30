import { cn } from './core'
import { sliderCheckpoint } from '../../store/history'

interface DualRangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  labels: [string, string] // accessible names for the two handles
  format?: (v: number) => string
  className?: string
}

// Two native range inputs stacked on one track: keyboard, screen reader and touch come for free
export function DualRangeSlider({ min, max, step = 1, value, onChange, labels, format = String, className }: DualRangeSliderProps) {
  const span = max - min || 1
  const left = ((value[0] - min) / span) * 100
  const right = ((value[1] - min) / span) * 100

  return (
    <div className={cn('relative h-5', className)}>
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-edge">
        <div className="absolute h-full rounded-full bg-dim" style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }} />
      </div>
      <input
        type="range"
        className="range range-dual"
        min={min} max={max} step={step}
        value={value[0]}
        aria-label={labels[0]}
        onPointerDown={sliderCheckpoint}
        aria-valuetext={format(value[0])}
        onChange={(e) => onChange([Math.min(parseFloat(e.target.value), value[1] - step), value[1]])}
      />
      <input
        type="range"
        className="range range-dual"
        min={min} max={max} step={step}
        value={value[1]}
        aria-label={labels[1]}
        onPointerDown={sliderCheckpoint}
        aria-valuetext={format(value[1])}
        onChange={(e) => onChange([value[0], Math.max(parseFloat(e.target.value), value[0] + step)])}
      />
    </div>
  )
}
