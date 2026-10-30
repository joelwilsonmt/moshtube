import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useSelect } from 'downshift'
import { Check, ChevronDown } from 'lucide-react'
import { focusedByKeyboard } from '../../engine/modality'
import { cn } from './core'

export interface SelectOption<T extends string | number> {
    value: T
    label: string
    group?: string
    disabled?: boolean
    short?: string // shown in the closed control when space is tight
}

interface SelectProps<T extends string | number> {
    value: T | null
    options: SelectOption<T>[]
    onChange: (value: T) => void
    id?: string // ties to a <Field> label (its label carries `${id}-label`)
    'aria-label'?: string // when there's no visible label
    'aria-describedby'?: string
    placeholder?: string // shown when `value` matches nothing (action menus like "Add effect")
    size?: 'md' | 'sm'
    className?: string
    disabled?: boolean
    // Leading visual per option (previews); rendered in the menu and the closed control
    renderLeading?: (option: SelectOption<T>) => ReactNode
}

const MENU_MAX = 320
const GAP = 4

// Menus render in the nearest open popover (top layer) or <body>, positioned against
// the trigger, so a scrolling panel or a footer can never clip them
function useMenuPosition(trigger: HTMLElement | null, isOpen: boolean) {
    const [box, setBox] = useState<{ left: number; top?: number; bottom?: number; width: number; maxHeight: number } | null>(null)
    useLayoutEffect(() => {
        if (!isOpen || !trigger) return setBox(null)
        const place = () => {
            const r = trigger.getBoundingClientRect()
            const below = window.innerHeight - r.bottom - GAP - 8
            const above = r.top - GAP - 8
            const flip = below < Math.min(MENU_MAX, 200) && above > below
            const width = Math.max(r.width, 180)
            const left = Math.min(r.left, window.innerWidth - width - 8)
            setBox(flip
                ? { left, bottom: window.innerHeight - r.top + GAP, width, maxHeight: Math.min(MENU_MAX, above) }
                : { left, top: r.bottom + GAP, width, maxHeight: Math.min(MENU_MAX, below) })
        }
        place()
        window.addEventListener('resize', place)
        window.addEventListener('scroll', place, true)
        return () => {
            window.removeEventListener('resize', place)
            window.removeEventListener('scroll', place, true)
        }
    }, [trigger, isOpen])
    return box
}

export function Select<T extends string | number>({
    value, options, onChange, id, placeholder, size = 'md', className, disabled, renderLeading, ...aria
}: SelectProps<T>) {
    const triggerRef = useRef<HTMLDivElement | null>(null)
    const selected = options.find((o) => o.value === value) ?? null

    const { isOpen, highlightedIndex, getToggleButtonProps, getMenuProps, getItemProps } = useSelect({
        items: options,
        selectedItem: selected,
        itemToString: (o) => o?.label ?? '',
        isItemDisabled: (o) => !!o.disabled,
        toggleButtonId: id,
        labelId: id ? `${id}-label` : undefined,
        onSelectedItemChange: ({ selectedItem }) => {
            if (!selectedItem) return
            onChange(selectedItem.value)
            // After a mouse pick, give focus back to the page so shortcuts keep working
            if (!focusedByKeyboard()) requestAnimationFrame(() => triggerRef.current?.blur())
        },
    })

    const box = useMenuPosition(triggerRef.current, isOpen)
    const portalTarget = (triggerRef.current?.closest('[popover]') as HTMLElement | null) ?? document.body

    const toggleProps = getToggleButtonProps({
        ref: triggerRef,
        disabled,
        ...(aria['aria-label'] ? { 'aria-label': aria['aria-label'], 'aria-labelledby': undefined } : {}),
        'aria-describedby': aria['aria-describedby'],
    })

    return (
        <>
            <div
                {...toggleProps}
                className={cn(
                    'flex w-full cursor-pointer select-none items-center gap-2 rounded-md border border-edge bg-rack text-ink transition-colors hover:border-dim/60 focus-visible:border-signal',
                    size === 'sm' ? 'h-7 pl-2 pr-1.5 text-xs' : 'h-8 pl-2.5 pr-2 text-[13px]',
                    isOpen && 'border-dim/60',
                    disabled && 'pointer-events-none opacity-40',
                    className
                )}
            >
                {selected && renderLeading && <span className="shrink-0">{renderLeading(selected)}</span>}
                <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-dim')}>{selected ? selected.short ?? selected.label : placeholder}</span>
                <ChevronDown size={size === 'sm' ? 13 : 15} aria-hidden="true" className={cn('shrink-0 text-dim transition-transform duration-150', isOpen && 'rotate-180')} />
            </div>
            {createPortal(
                <ul
                    {...getMenuProps()}
                    className={cn(
                        'fixed z-[60] overflow-y-auto rounded-lg border border-line bg-panel p-1 text-[13px] text-ink shadow-[0_12px_32px_oklch(0_0_0/0.55)] focus:outline-none',
                        !(isOpen && box) && 'hidden'
                    )}
                    style={box ? { left: box.left, top: box.top, bottom: box.bottom, minWidth: box.width, maxHeight: box.maxHeight } : undefined}
                >
                    {isOpen && options.map((option, index) => {
                        const groupStart = option.group && option.group !== options[index - 1]?.group
                        const isSelected = option.value === value
                        return (
                            <li key={String(option.value)} role="presentation" className="list-none">
                                {groupStart && (
                                    <div role="presentation" className="label px-2 pb-1 pt-2.5 first:pt-1">{option.group}</div>
                                )}
                                <div
                                    {...getItemProps({ item: option, index })}
                                    className={cn(
                                        'flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 whitespace-nowrap',
                                        highlightedIndex === index && 'bg-raised',
                                        option.disabled && 'cursor-not-allowed text-dim/60',
                                        isSelected && 'font-semibold'
                                    )}
                                >
                                    {renderLeading && <span className="shrink-0">{renderLeading(option)}</span>}
                                    <span className="flex-1">{option.label}</span>
                                    <Check size={14} aria-hidden="true" className={cn('shrink-0', isSelected ? 'text-ink' : 'invisible')} />
                                </div>
                            </li>
                        )
                    })}
                </ul>,
                portalTarget
            )}
        </>
    )
}
