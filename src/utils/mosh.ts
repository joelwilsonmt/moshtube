import { updateVideoState, setBlendMode, setMix, setMixOscillate } from '../store/appStore'
import { ShaderTypeSchema, BlendModeSchema } from '../store/schema'
import { getShaderConfig } from './shaderUtils'
import { SOURCE_A_IDS, SOURCE_B_IDS } from './sourceLists'

export const moshVideo = (id: 'videoA' | 'videoB') => {
    // filter out 'none' to ensure an effect is applied
    const options = ShaderTypeSchema.options.filter(s => s !== 'none')
    const randomShader = options[Math.floor(Math.random() * options.length)]
    
    const config = getShaderConfig(randomShader)
    const randomIntensity = config.min + Math.random() * (config.max - config.min)
    const randomOscillate = Math.random() > 0.5

    updateVideoState(id, {
        shader: randomShader,
        shaderParams: { intensity: randomIntensity },
        oscillate: randomOscillate
    })
}

export const moshGlobal = () => {
    moshVideo('videoA')
    moshVideo('videoB')
}

export const moshEverything = () => {
    moshGlobal()
    
    const blendOptions = BlendModeSchema.options
    setBlendMode(blendOptions[Math.floor(Math.random() * blendOptions.length)])
    
    setMix(Math.random())
    setMixOscillate(Math.random() > 0.5)
}

export const moshMeDaddy = () => {
    const idA = SOURCE_A_IDS[Math.floor(Math.random() * SOURCE_A_IDS.length)]
    const idB = SOURCE_B_IDS[Math.floor(Math.random() * SOURCE_B_IDS.length)]
    
    // Set Video A
    updateVideoState('videoA', {
        id: idA,
        start: 15,
        end: -5, // Signal for "Duration - 5s"
        loop: true,
        playing: true,
        lastInteraction: Date.now()
    })

    // Set Video B
    updateVideoState('videoB', {
        id: idB,
        start: 15,
        end: -5,
        loop: true,
        playing: true,
        lastInteraction: Date.now()
    })
    
    // Apply Effects
    moshEverything()
}
