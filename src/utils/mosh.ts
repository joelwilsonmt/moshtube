import { updateVideoState, setBlendMode, setMix, setMixOscillate } from '../store/appStore'
import { ShaderTypeSchema, BlendModeSchema } from '../store/schema'
import { getShaderConfig } from './shaderUtils'
import { loadRandomVideo } from './youtube'

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
    // Apply effects now; videos swap in once a playable pick is confirmed
    moshEverything()

    const loop = { start: 15, end: -5, loop: true } // end -5 signals "Duration - 5s"
    void loadRandomVideo('videoA', loop)
    void loadRandomVideo('videoB', loop)
}
