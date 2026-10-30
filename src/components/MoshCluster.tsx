import { Shuffle, Sparkles, Zap } from 'lucide-react'
import { moshEverything, moshGlobal, moshMeDaddy } from '../utils/mosh'
import { cn, Kbd } from './ui/core'

const TIERS = [
    { key: '1', label: 'Mosh', hint: 'Effects', icon: Zap, run: moshGlobal },
    { key: '2', label: 'Mosh Everything', hint: 'Effects + mix', icon: Shuffle, run: moshEverything },
] as const

// The three randomizers, always in this order, wherever they appear
export function MoshCluster({ compact = false, className }: { compact?: boolean; className?: string }) {
    return (
        <div className={cn('flex gap-1.5', compact ? 'flex-row items-center' : 'flex-col', className)}>
            {TIERS.map(({ key, label, hint, icon: Icon, run }) => (
                <button
                    key={key}
                    type="button"
                    onClick={run}
                    title={`${hint} (${key})`}
                    aria-label={label}
                    aria-keyshortcuts={key}
                    className="group flex h-9 items-center gap-2 rounded-md border border-edge bg-raised px-3 text-left text-[13px] font-medium text-ink transition-colors duration-150 hover:bg-line/70 active:bg-line"
                >
                    <Icon size={15} aria-hidden="true" className="shrink-0 text-dim group-hover:text-ink" />
                    <span className="whitespace-nowrap">{label}</span>
                    {!compact && <span className="ml-auto whitespace-nowrap pl-3 text-xs text-dim max-[1399px]:sr-only">{hint}</span>}
                    <Kbd>{key}</Kbd>
                </button>
            ))}
            <button
                type="button"
                onClick={moshMeDaddy}
                title="New videos, effects, blend and mix (3)"
                aria-label="Mosh Me Daddy"
                aria-keyshortcuts="3"
                className={cn(
                    'flex items-center gap-2 rounded-md bg-signal px-3 text-left font-semibold text-signal-ink transition-[filter] duration-150 hover:brightness-110 active:brightness-95',
                    compact ? 'h-9 text-[13px]' : 'h-12 text-[15px]'
                )}
            >
                <Sparkles size={compact ? 15 : 17} aria-hidden="true" className="shrink-0" />
                <span className="whitespace-nowrap">Mosh Me Daddy</span>
                {!compact && <span className="ml-auto whitespace-nowrap pl-3 text-xs font-medium opacity-80 max-[1399px]:sr-only">New videos + all</span>}
                <Kbd>3</Kbd>
            </button>
        </div>
    )
}
