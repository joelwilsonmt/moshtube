export interface ShaderConfig {
    label: string
    min: number
    max: number
    step: number
    default: number
}

export const getShaderConfig = (shader: string): ShaderConfig => {
    switch(shader) {
        case 'pixelate': return { label: 'Pixel Size', min: 2, max: 32, step: 2, default: 8 }
        case 'scanlines': return { label: 'Line Height', min: 2, max: 10, step: 1, default: 3 }
        case 'wavy': return { label: 'Distortion', min: 0, max: 100, step: 1, default: 40 }
        case 'posterize': return { label: 'Levels', min: 2, max: 16, step: 1, default: 4 }
        case 'vcr': return { label: 'Degradation', min: 0, max: 2, step: 0.1, default: 1 } 
        case 'trippy': return { label: 'Color Shift', min: 0, max: 360, step: 10, default: 180 } 

        case 'glow': return { label: 'Glow Radius', min: 0, max: 20, step: 1, default: 10 }
        case 'glitch': return { label: 'Tear Amount', min: 0, max: 100, step: 1, default: 30 }
        
        case 'ink': return { label: 'Contrast', min: 1, max: 5, step: 0.1, default: 3 }
        case 'predator': return { label: 'Heat Shift', min: 0, max: 360, step: 10, default: 180 }
        case 'solarize': return { label: 'Threshold', min: 0, max: 100, step: 1, default: 50 }
        case 'dream': return { label: 'Softness', min: 0, max: 20, step: 1, default: 5 }
        case 'xray': return { label: 'Density', min: 0, max: 1, step: 0.1, default: 1 }
        default: return { label: 'Intensity', min: 0, max: 1, step: 0.1, default: 0.5 }
    }
}
