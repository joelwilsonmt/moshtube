import { useEffect } from 'react'
import { appStore } from '../store/appStore'
import { serializeState, deserializeState } from '../utils/serialization'
import { rollFreshMix } from '../utils/mosh'

// Runs once before the first render, so the stage never mounts with videos it's about
// to replace. A visit with no mix in the URL opens on a fresh random one.
export function hydrateFromUrl() {
  const params = new URLSearchParams(window.location.search)
  if ([...params.keys()].length === 0) {
    rollFreshMix()
    return
  }
  appStore.setState((prev) => ({ ...prev, ...deserializeState(params) }))
}

// Keeps the address bar in sync with the mix, so the URL is always shareable
export function useUrlSync() {
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const unsub = appStore.subscribe((state) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        const newSearch = serializeState(state).toString()
        if (window.location.search.replace(/^\?/, '') !== newSearch) {
          const url = new URL(window.location.href)
          url.search = newSearch
          window.history.replaceState(null, '', url.toString())
        }
      }, 200)
    })
    return () => {
      unsub()
      clearTimeout(timeout)
    }
  }, [])
}
