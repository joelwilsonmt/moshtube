// Checks every random-pool and default video against YouTube oEmbed.
// Exits 1 if any are removed, private, or not embeddable. Run: bun run check:sources
import { SOURCE_A_IDS, SOURCE_B_IDS } from '../src/utils/sourceLists'
import { defaultState } from '../src/store/schema'

const ids = [...new Set([...SOURCE_A_IDS, ...SOURCE_B_IDS, defaultState.videoA.id, defaultState.videoB.id])]
    .filter((id): id is string => !!id)

const results = await Promise.all(ids.map(async (id) => {
    const watchUrl = `https://www.youtube.com/watch?v=${id}`
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`)
    return { id, status: res.status }
}))

const broken = results.filter(r => r.status !== 200)
for (const { id, status } of broken) console.log(`${status}  ${id}  https://youtu.be/${id}`)
console.log(`${ids.length - broken.length}/${ids.length} playable`)
process.exit(broken.length ? 1 : 0)
