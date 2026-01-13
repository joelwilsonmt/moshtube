import { appStore, setPlaying, updateVideoState } from './src/store/appStore'

const unsub = appStore.subscribe((state) => {
    console.log('Store Update:', { 
        videoA: state.videoA.id, 
        videoB: state.videoB.id 
    })
})

const initial = appStore.getState()
console.log('Initial State:', { videoA: initial.videoA.id })

// Simulate user pasting a new URL
console.log('--- Simulating Update ---')
const newId = 'dQw4w9WgXcQ' // Rick Roll
updateVideoState('videoA', { id: newId, playing: true })

const updated = appStore.getState()
console.log('Updated State:', { videoA: updated.videoA.id })

if (updated.videoA.id === newId) {
    console.log('SUCCESS: Store updated correctly')
} else {
    console.error('FAILURE: Store did not update')
}

unsub()
