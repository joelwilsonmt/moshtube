---
version: 1
slug: "src-components-dashboard-tsx"
primary_target: "src/components/Dashboard.tsx"
related_targets: ["src/components"]
---

# Surface brief: moshtube app (Dashboard)

Scope: the whole app shell (desktop mixer + mobile reduced view). Mode: Operate (the stage output is the art).

Audience/job: casual creative players, often from a shared link; get to a mix they like and share it within a minute. Live use secondary.

Constraints: CSS/SVG effects on YouTube iframes only; own-content WebGL/transparent video for layer C; all state round-trips through the URL; client-only.

Unresolved: Lottie for layer C deferred until animations with clear licenses are chosen.

## Direction contract

THESIS: A VJ mixer you can play in ten seconds: stage dominates, a channel-strip mixer row and one mosh cluster sit beneath it. Refuses the generic dark admin dashboard (sidebars of cards around a small video) and the near-black-plus-neon-glow costume.

OWN-WORLD: Matte graphite in two neutral levels (rack, panel), hairline dividers, no glows or gradients. One amber signal color for live/active/primary only. Functional layer identity colors: A blue, B rose, C lime, Master white. System UI sans throughout, tabular numerals for readouts, uppercase small labels like silkscreen. Standard web controls.

STORY: Visitor sees the mix playing, hits Mosh Me Daddy, gets a new mix, nudges the crossfader or a strip, copies the link. Deeper: inspector effect stacks, tempo, presets, MIDI, pop-out.

FIRST VIEWPORT: Thin top bar (wordmark, presets/copy link, tempo readout + TAP + beat light, undo, help, pop-out, fullscreen). Stage fills the center. Right inspector (~320px) for the selected strip. Bottom mixer row: strips A, B, C with live thumbnail, meter, play, mosh, hold; crossfader between A and B with labeled ends and swap; Master strip (blend, master effect); mosh cluster Mosh / Mosh Everything / Mosh Me Daddy, the last primary in amber.

FORM: pinned by user (hardware mixer / VJ gear, translated through Operate rules); signature move: modulation made visible as live LED meters per strip plus a 4-step beat light on the tempo clock. seed: none (direction pinned by user; roll not run)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
