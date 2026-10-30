// 75.4 -> "1:15.4", 3725 -> "1:02:05"
export function formatTime(seconds: number, precise = false) {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    const sec = precise ? s.toFixed(1).padStart(4, '0') : String(Math.floor(s)).padStart(2, '0')
    return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

// Accepts "75", "1:15", "1:15.5", "1:02:05"; null when unparseable
export function parseTime(input: string): number | null {
    const parts = input.trim().split(':')
    if (!parts.length || parts.length > 3 || parts.some((p) => p.trim() === '' || isNaN(Number(p)))) return null
    return parts.reduce((total, p) => total * 60 + Number(p), 0)
}
