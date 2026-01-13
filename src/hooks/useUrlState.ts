import { useEffect } from 'react'
import { appStore } from '../store/appStore'
import { serializeState, deserializeState } from '../utils/serialization'

export function useUrlState() {
  // 1. Hydrate from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // Only hydrate if we have some params, ideally?
    // Or just always. If url is empty, params is empty.
    // Deserialize returns defaults + overrides.
    // If we want to preserve "defaultState" from store vs "defaultState" from serialization, they should be same.
    const state = deserializeState(params)
    if (state) {
      appStore.setState((prev) => ({ ...prev, ...state }))
    }
  }, [])

  // 2. Sync to URL on change
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const unsub = appStore.subscribe((state) => {
         clearTimeout(timeout)
         timeout = setTimeout(() => {
             const params = serializeState(state)
             const newSearch = params.toString()
             // Avoid loop if already equal (though we sort of own the URL)
             const currentSearch = window.location.search.replace(/^\?/, '')
             if (currentSearch !== newSearch) {
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
