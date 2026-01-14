
import * as React from 'react'
import { cn } from './core'

interface DualRangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  className?: string
}

export function DualRangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  className,
}: DualRangeSliderProps) {
  const [isDragging, setIsDragging] = React.useState<'min' | 'max' | null>(null)
  const sliderRef = React.useRef<HTMLDivElement>(null)

  // Memoize functionality to get percentage
  const getPercentage = React.useCallback(
    (val: number) => ((val - min) / (max - min)) * 100,
    [min, max]
  )

  // Use refs for value to avoid stale closures in event listeners if we didn't use updated state
  // But here we will depend on adding/removing listeners or use a ref for the current value in handlers
  // Actually, a cleaner way for global mouse events is using a stable handler that reads a ref
  const valueRef = React.useRef(value)
  valueRef.current = value

  React.useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !sliderRef.current) return

      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.min(
        Math.max((e.clientX - rect.left) / rect.width, 0),
        1
      )
      
      const rawValue = min + percentage * (max - min)
      // Round to step
      const steppedValue = Math.round(rawValue / step) * step
      // Clamp to min/max
      const clampedValue = Math.min(Math.max(steppedValue, min), max)

      const [currentMin, currentMax] = valueRef.current

      if (isDragging === 'min') {
        const newValue = Math.min(clampedValue, currentMax - step)
        onChange([newValue, currentMax])
      } else {
        const newValue = Math.max(clampedValue, currentMin + step)
        onChange([currentMin, newValue])
      }
    }

    const handlePointerUp = () => {
      setIsDragging(null)
    }

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging, min, max, step, onChange])

  const leftPercent = getPercentage(value[0])
  const rightPercent = getPercentage(value[1])

  return (
    <div
      ref={sliderRef}
      className={cn(
        'relative w-full h-4 flex items-center select-none touch-none cursor-pointer',
        className
      )}
      onPointerDown={(e) => {
          // Optional: click on track to jump nearest handle?
          // For now, let's just stick to dragging handles for precision, 
          // or simple logic to jump nearest.
          // Let's keep it simple: handles only usually, but web standard often allows track click.
          // Implementing track click for dual slider is tricky (which one moves?).
          // We will stick to handle dragging for safety.
      }}
    >
      {/* Track Background */}
      <div className="absolute w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        {/* Active Range */}
        <div
          className="absolute h-full bg-zinc-200"
          style={{
            left: `${leftPercent}%`,
            width: `${rightPercent - leftPercent}%`,
          }}
        />
      </div>

      {/* Left Handle */}
      <div
        className={cn(
            "absolute w-3.5 h-3.5 bg-white border border-zinc-300 rounded-full shadow hover:scale-110 transition-transform cursor-grab focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900 z-10",
            isDragging === 'min' && "cursor-grabbing scale-110 z-20"
        )}
        style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
        onPointerDown={(e) => {
          e.stopPropagation()
          e.preventDefault() // Prevent text selection
          setIsDragging('min')
        }}
      />

      {/* Right Handle */}
      <div
         className={cn(
            "absolute w-3.5 h-3.5 bg-white border border-zinc-300 rounded-full shadow hover:scale-110 transition-transform cursor-grab focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900 z-10",
            isDragging === 'max' && "cursor-grabbing scale-110 z-20"
        )}
        style={{ left: `${rightPercent}%`, transform: 'translateX(-50%)' }}
        onPointerDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setIsDragging('max')
        }}
      />
    </div>
  )
}
