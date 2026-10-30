# MOSHTUBE

Moshtube is a browser VJ mixer for YouTube. Pick two videos (or let it pick), blend them, stack glitch effects on top, and hit Mosh until something good happens. The whole mix lives in the URL, so sharing it is copying the link.

![Moshtube](/screenshot.png)

## What it does

- **Two YouTube sources (A and B)** with loop regions, a crossfader, and CSS blend modes. Random picks are checked before they load, so dead or embed-blocked videos get skipped.
- **Effect stacks**: up to four per source plus output effects over the whole mix. 21 effects across color (trippy, duotone, 1-bit, posterize…), distortion (wavy, glitch, RGB split…), texture (scanlines, VCR, grain…) and motion (mirror, zoom, rotate, strobe).
- **Tempo**: set the BPM or tap it. Oscillation runs in beats and bars with sine, triangle, square, or saw shapes, and auto-mosh can fire a randomizer every few bars.
- **Randomizers**: **Mosh** rerolls effects, **Mosh Everything** adds blend and mix, and **Mosh Me Daddy** loads new videos and rerolls everything. Undo works on all of them, and you can lock a source, the crossfade, or the blend mode so they leave it alone.
- **Layer C** sits on top of both sources: one of ten tempo-synced WebGL patterns, one of sixteen original Lottie animations (or a link to your own Lottie JSON), or a transparent video or GIF from a link.
- **Presets and your own videos**: save mixes by name, and paste a list of YouTube links for shuffle to use. Both are stored in your browser.
- **Live use**: fullscreen mode, a pop-out output window for a projector, and MIDI controller mapping (in browsers with Web MIDI).
- **Shared links** open as a viewer: the mix fills the screen, with a **Remix this** button into the mixer. A visit with no link starts on a fresh random mix.
- **Phones** get the output, a big Mosh Me Daddy button, play/pause, and undo. The full mixer is on desktop.

## Keyboard

| Key | Action |
|---|---|
| `1` `2` `3` | Mosh / Mosh Everything / Mosh Me Daddy |
| `Space` | Play or pause the output |
| `T` | Tap tempo |
| `A` | Auto-mosh on or off |
| `Z` / `Shift+Z` | Undo / redo |
| `F` | Fullscreen |
| `?` | Show shortcuts |

## Tech

React 19, TypeScript, Vite, Zustand + Zod, Tailwind CSS 3, Lucide icons. Effects are CSS and SVG filters on the YouTube iframes. The videos are cross-origin, so their pixels can't be read and there's no canvas pass over them. Layer C is the app's own WebGL. Client-only, no backend.

## Development

```bash
bun install
bun run dev            # http://localhost:5180
bun run build          # typecheck + production build
bun run check:sources  # verify every random-pool video is still embeddable
```

## License

MIT
