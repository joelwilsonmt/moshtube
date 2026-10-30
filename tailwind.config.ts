import { type Config } from 'tailwindcss'

const token = (name: string) => `oklch(var(--${name}) / <alpha-value>)`

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rack: token('rack'),
        panel: token('panel'),
        raised: token('raised'),
        line: token('line'),
        edge: token('edge'),
        ink: token('ink'),
        dim: token('dim'),
        signal: token('signal'),
        'signal-ink': token('signal-ink'),
        'layer-a': token('layer-a'),
        'layer-b': token('layer-b'),
        'layer-c': token('layer-c'),
        'layer-m': token('layer-m'),
        danger: token('danger'),
      },
      fontFamily: {
        label: ['"Saira Semi Condensed"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
