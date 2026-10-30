import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { sliderCheckpoint } from '../../store/history'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ButtonVariant = 'default' | 'primary' | 'ghost'

const buttonVariants: Record<ButtonVariant, string> = {
  default: 'bg-raised text-ink border border-edge hover:bg-line/70 active:bg-line',
  primary: 'bg-signal text-signal-ink font-semibold hover:brightness-110 active:brightness-95',
  ghost: 'text-dim hover:text-ink hover:bg-raised active:bg-line',
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>(
  ({ className, variant = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md px-3 h-8 text-[13px] font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40',
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string // accessible name and tooltip
  active?: boolean
  size?: 'sm' | 'md'
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, active, size = 'md', className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
        active ? 'bg-raised text-ink ring-1 ring-inset ring-edge hover:bg-line/70' : 'text-dim hover:text-ink hover:bg-raised active:bg-line',
        className
      )}
      {...props}
    >
      <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" />
    </button>
  )
)
IconButton.displayName = 'IconButton'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-8 w-full rounded-md border border-edge bg-rack px-2.5 text-[13px] text-ink placeholder:text-dim/80 transition-colors focus-visible:border-signal aria-[invalid=true]:border-danger',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Select, type SelectOption } from './Select'

const SLIDER_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']

// Every slider gesture (drag or key nudges) is one undo step
export const Range = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      className={cn('range', className)}
      onPointerDown={sliderCheckpoint}
      onKeyDown={(e) => SLIDER_KEYS.includes(e.key) && sliderCheckpoint(e)}
      {...props}
    />
  )
)
Range.displayName = 'Range'

// Label + control with a programmatic association; `children` receives the control id
export function Field({ label, value, className, children }: {
  label: string
  value?: React.ReactNode // readout shown at the right of the label
  className?: string
  children: (id: string) => React.ReactNode
}) {
  const id = React.useId()
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label id={`${id}-label`} htmlFor={id} className="text-xs font-medium text-dim">{label}</label>
        {value !== undefined && <span className="text-xs font-semibold text-ink">{value}</span>}
      </div>
      {children(id)}
    </div>
  )
}

export function Segmented<T extends string>({ label, value, options, onChange, className }: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn('flex rounded-md border border-edge bg-rack p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-7 flex-1 rounded px-2 text-xs font-medium transition-colors duration-150',
            value === o.value ? 'bg-raised text-ink' : 'text-dim hover:text-ink'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ pressed, onChange, children, className, ...props }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  pressed: boolean
  onChange: (pressed: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-xs font-medium transition-colors duration-150',
        pressed ? 'border-ink/60 bg-raised text-ink' : 'border-edge text-dim hover:bg-raised hover:text-ink',
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', pressed ? 'bg-ink' : 'ring-1 ring-inset ring-dim')} />
      {children}
    </button>
  )
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-current/30 px-1 font-sans text-[10px] font-semibold leading-none opacity-80">
      {children}
    </kbd>
  )
}

// Section inside a panel: label row, optional actions, body
export function Section({ id, title, actions, children, className }: {
  id?: string
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn('scroll-mt-2 border-t border-line px-4 py-3.5 first:border-t-0', className)}>
      <div className="mb-3 flex h-7 items-center justify-between gap-2">
        <h3 className="label">{title}</h3>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
