# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily casual, creative players: people who land on a shared link or stumble on the site, hit the randomizers, and make weird visual mixes for fun and to share. Running visuals at a show is a secondary use the tool should not get in the way of (fullscreen, keyboard, MIDI, pop-out output), but it is not the primary design target.

## Product Purpose

Moshtube is a browser VJ toy/tool that blends two YouTube videos (Source A and Source B) with filter "shaders", CSS blend modes, a mix control, oscillation, and randomizers. Success is a visitor getting from first load to a mix they like, and sharing it, within a minute, with no setup.

## Positioning

Two things together, equally weighted:
- Zero-setup YouTube VJ: any YouTube video becomes source material in a browser tab, with no downloads, install, or account, and the whole mix lives in a shareable URL.
- Randomness as an instrument: the mosh randomizers (MOSH, MOSH EVERYTHING, MOSH ME DADDY) generate happy accidents on demand; the user then keeps or tweaks what they like.

## Operating Context

- Desktop browser is the full experience. Phones mostly arrive via shared links and get a reduced view: the stage plus one big Mosh Me Daddy button and play/pause.
- Fullscreen output with an idle-hiding control pill exists for showing the visuals on a big screen.
- Shared links (URL query state) are the main distribution mechanism.

## Capabilities and Constraints

- Client-only. No backend, no accounts. Presets and a user video pool live in the URL and localStorage.
- Video sources are cross-origin YouTube iframes. Effects are limited to CSS filters, SVG filters, transforms, blend modes, and layers composited over the iframes; reading video pixels (canvas/WebGL on the video) is not possible. Own-content layers (generative WebGL, Lottie, transparent video) composited over the videos are possible.
- Random video picks are checked for embeddability (YouTube oEmbed) and broken videos are rerolled at runtime; `bun run check:sources` validates the pool.
- Every state field must round-trip through URL serialization (`src/utils/serialization.ts`).
- Cloudflare Web Analytics beacon in `index.html` stays.
- Planned: per-source effect stacking and a master output effect; tempo/automation (oscillation speed/shape, BPM tap, auto-mosh every N bars, keyboard shortcuts); presets, copy-link, user-defined video pool; a third overlay layer (C); Web MIDI mapping; pop-out projector output window.
- Undecided: how layer C content is sourced/curated; licensing of any bundled Lottie files.

## Brand Commitments

- Name: MOSHTUBE.
- The irreverent randomizer naming stays, including "Mosh Me Daddy".
- Open source: github.com/joelwilsonmt/moshtube.

## Evidence on Hand

- README.md and `public/screenshot.png` describe the current app.
- No testimonials, user counts, or press exist; do not fabricate any.

## Product Principles

1. First mosh within seconds: the randomizers are the front door, and setup is never required.
2. The output is the art; controls serve it and never crowd it.
3. Every happy accident is keepable: shareable by URL, undoable, lockable.
4. Playful by default, capable underneath: power features (tempo, MIDI, pop-out) stay out of a casual visitor's way.
