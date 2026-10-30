import { useEffect } from 'react'
import { appStore } from '../store/appStore'
import type { AppState, SourceId } from '../store/schema'
import { beatsNow, syncClock } from './clock'
import { getPlayer } from './players'

// Keeps a pop-out output window in step with the main window. The main window is the
// only writer; the output window mirrors state, the beat clock, and video positions.
type Message =
    | { type: 'hello' }
    | { type: 'state'; state: AppState }
    | { type: 'clock'; beats: number; sentAt: number }
    | { type: 'playhead'; times: Partial<Record<SourceId, number>>; sentAt: number }

const CHANNEL = 'moshtube-output'
const SOURCES: SourceId[] = ['videoA', 'videoB']
const DRIFT_S = 0.75

const open = () => ('BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null)

export function useOutputSource() {
    useEffect(() => {
        const channel = open()
        if (!channel) return
        const post = (m: Message) => channel.postMessage(m)
        const sendState = () => post({ type: 'state', state: appStore.getState() })

        channel.onmessage = (e: MessageEvent<Message>) => {
            if (e.data.type === 'hello') {
                sendState()
                post({ type: 'clock', beats: beatsNow(), sentAt: Date.now() })
            }
        }
        const unsub = appStore.subscribe(sendState)
        const timer = setInterval(async () => {
            post({ type: 'clock', beats: beatsNow(), sentAt: Date.now() })
            const times: Partial<Record<SourceId, number>> = {}
            for (const id of SOURCES) {
                const t = await getPlayer(id)?.getCurrentTime()
                if (typeof t === 'number') times[id] = t
            }
            post({ type: 'playhead', times, sentAt: Date.now() })
        }, 1000)

        return () => {
            unsub()
            clearInterval(timer)
            channel.close()
        }
    }, [])
}

export function useOutputSink() {
    useEffect(() => {
        const channel = open()
        if (!channel) return
        channel.onmessage = async (e: MessageEvent<Message>) => {
            const m = e.data
            if (m.type === 'state') appStore.setState(m.state)
            if (m.type === 'clock') syncClock(m.beats, m.sentAt)
            if (m.type === 'playhead') {
                const lag = (Date.now() - m.sentAt) / 1000
                for (const id of SOURCES) {
                    const remote = m.times[id]
                    const player = getPlayer(id)
                    if (remote === undefined || !player) continue
                    const local = await player.getCurrentTime()
                    if (Math.abs(local - (remote + lag)) > DRIFT_S) player.seekTo(remote + lag, true)
                }
            }
        }
        channel.postMessage({ type: 'hello' } satisfies Message)
        return () => channel.close()
    }, [])
}

export const isOutputWindow = () => new URLSearchParams(window.location.search).has('output')

export function openOutputWindow() {
    const url = new URL(window.location.href)
    url.searchParams.set('output', '1')
    return window.open(url.toString(), 'moshtube-output', 'popup,width=1280,height=720')
}
