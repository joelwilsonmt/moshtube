import { createStore } from 'zustand/vanilla'

// Sources whose newest video hasn't faded in yet (first load or a swap in progress)
export const swapStore = createStore(() => ({ videoA: false, videoB: false }))
