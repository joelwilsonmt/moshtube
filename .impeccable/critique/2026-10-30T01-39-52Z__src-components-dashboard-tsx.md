---
target: moshtube UI
total_score: 16
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/Users/publius/Code/moshtube/src/components/Dashboard.tsx"
target_fingerprint: "sha256:485f871a90f0c1af424c0bce8d6cb207c60151f901d7b226eb89787634193154"
target_path: /Users/publius/Code/moshtube/src/components/Dashboard.tsx
timestamp: 2026-10-30T01-39-52Z
slug: src-components-dashboard-tsx
---
Method: dual-agent (A: design review · B: detector + browser overlay)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | MOSH changes things silently; no "what changed"; fullscreen has no play state |
| 2 | Match System / Real World | 2 | "Master Mix" is top-layer opacity, not a crossfader; no A/B ends |
| 3 | User Control and Freedom | 1 | No undo/lock for randomizers; stray stage click pauses output |
| 4 | Consistency and Standards | 1 | Mosh buttons differ in color/order/case per location; two play/pause per source |
| 5 | Error Prevention | 2 | ID validation good; DADDY replaces both videos with no undo |
| 6 | Recognition Rather Than Recall | 2 | 14 shaders, no preview; blend descriptions help |
| 7 | Flexibility and Efficiency | 1 | Zero keyboard shortcuts; URL deep links only accelerator |
| 8 | Aesthetic and Minimalist Design | 2 | Duplicate preview players eat sidebar; stage ~50-56% width |
| 9 | Error Recovery | 2 | New inline player errors + ID hint; nothing else |
| 10 | Help and Documentation | 1 | One tooltip; mosh tiers unexplained |
| Total | | 16/40 | Poor |

## Design Specificity Verdict
LLM: category-interchangeable dark shadcn dashboard. Only "MOSH" copy is authored. Purple-pink Sparkles gradient reads as stock AI button. No mixer vocabulary (crossfader, channel strips, program/preview, tempo). Fullscreen pill is the one performance-native element.
Detector: CLI 2 distinct ai-color-palette hits (Dashboard.tsx:106, 274; reported 4 incl. hover variants). Browser overlay 16: nested-cards 6, low-contrast 5 (#71717a/#52525b on zinc, white on orange gradient 3.7:1), undersized-ui-text 3, dark-glow 1, ai-color-palette 1, skipped-heading 1. Agreement with LLM on gradient and generic identity. nested-cards partly false positive (control-surface grouping). Run note: Assessment A drove B's [Human] tab briefly (shader toggled, restored).

## Priority Issues
- [P0] Phone layout broken: 390px stage 0px wide, 617px horizontal scroll, footer overlaps. Fix: dedicated phone view (stage + one mosh) or desktop-only notice. /impeccable adapt
- [P1] Layout starves stage and has no room for roadmap (stacking, master FX, layer C, tempo, presets, MIDI, pop-out). Fix: stage-dominant mixer layout, layer strips A/B/C/Master with thumbnails, single inspector, real transport bar. /impeccable shape
- [P1] Mix semantics misleading; layer order hidden except overlay mode. Fix: crossfader with labeled ends, always-visible order. /impeccable clarify
- [P1] Unsafe for live use: stage click pauses, no undo, no locks, no shortcuts, 5 mosh actions in 4 places. Fix: one mosh control with scopes, undo stack from URL history, param locks, keymap. /impeccable distill + harden
- [P2] A11y + identity: 6 unnamed icon buttons, 13 unlabeled controls, non-focusable loop handles, iframes in tab order, hover-only maximize, 5 contrast failures, default focus rings, generic AI gradient. /impeccable audit + colorize/typeset

## Persona Red Flags
Alex (performing VJ): no shortcuts/MIDI; stage click freezes output; fullscreen pill lacks mix/blend/play; mosh order differs per location; no undo/locks; DADDY black frames.
Sam (keyboard/SR): unnamed buttons, unlinked labels, unfocusable loop handles, 4 iframe tab stops, invisible focused maximize, nothing announced after mosh.
Casey (mobile): 0px stage, sideways scroll, overlapping footer, hover-only maximize, 28/30 targets under 44px.

## Minor Observations
"Example Mosh Me Daddy" leftover copy; mixed casing; loop times in raw seconds (36145s) not mm:ss; duplicate loop readouts; previews at 50% opacity with YouTube chrome; fixed 10s mix oscillation; 10px zinc-600 GitHub link; buttons lack type="button"; h1 to h3 skip.

## Questions to Consider
- If the output is the art, why do two muted copies of the sources get more room than the mix?
- Crossfader or opacity knob? With layer C coming it can't be both.
- One MOSH with scope modifiers instead of five buttons in four places?
- With a pop-out projector window, does the main window become preview/program?
