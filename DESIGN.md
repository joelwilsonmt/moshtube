---
name: MOSHTUBE
description: A browser VJ mixer built like matte graphite rack gear, with one amber signal light.
colors:
  rack: "oklch(0.155 0.006 255)"
  panel: "oklch(0.2 0.007 255)"
  raised: "oklch(0.25 0.008 255)"
  line: "oklch(0.32 0.009 255)"
  edge: "oklch(0.5 0.012 255)"
  ink: "oklch(0.94 0.004 255)"
  dim: "oklch(0.74 0.012 255)"
  signal: "oklch(0.81 0.155 74)"
  signal-ink: "oklch(0.22 0.04 74)"
  layer-a: "oklch(0.74 0.12 240)"
  layer-b: "oklch(0.74 0.14 12)"
  layer-c: "oklch(0.85 0.16 128)"
  layer-m: "oklch(0.94 0.004 255)"
  danger: "oklch(0.7 0.18 27)"
  stage: "#000000"
typography:
  wordmark:
    fontFamily: "Saira Semi Condensed, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    fontFeature: "tnum"
  control:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    fontFeature: "tnum"
  readout:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    fontFeature: "tnum"
  label:
    fontFamily: "Saira Semi Condensed, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.08em"
  chip:
    fontFamily: "Saira Semi Condensed, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
rounded:
  hairline: "1px"
  sm: "2px"
  segment: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
components:
  button-default:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-default-hover:
    backgroundColor: "{colors.line}"
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-mosh-me-daddy:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "48px"
  button-ghost:
    textColor: "{colors.dim}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
  icon-button:
    textColor: "{colors.dim}"
    rounded: "{rounded.md}"
    size: "32px"
  icon-button-sm:
    textColor: "{colors.dim}"
    rounded: "{rounded.md}"
    size: "28px"
  toggle:
    textColor: "{colors.dim}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "28px"
  toggle-on:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.rack}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "32px"
  segmented:
    backgroundColor: "{colors.rack}"
    rounded: "{rounded.md}"
    padding: "2px"
  segmented-selected:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.segment}"
    height: "28px"
  layer-chip:
    textColor: "{colors.rack}"
    typography: "{typography.chip}"
    rounded: "{rounded.sm}"
    size: "20px"
  channel-strip:
    backgroundColor: "{colors.rack}"
    rounded: "{rounded.md}"
    padding: "8px"
  channel-strip-selected:
    backgroundColor: "{colors.raised}"
  popover:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: MOSHTUBE

## Overview

**Creative North Star: "The Graphite Rack"**

MOSHTUBE is a piece of VJ gear rendered in a browser tab: a matte graphite chassis with the stage cut into it, a row of channel strips along the bottom edge, and a single amber lamp that lights only when something is live, active, or the one thing to press. The output is the art. Everything around it is dark, flat, and quiet so the stage carries all the colour and motion on screen.

Density is that of hardware, not a dashboard: controls are compact (28 to 32px), grouped into strips and sections separated by hairlines rather than floated on cards. Labels are small uppercase condensed caps, like silkscreen printed on a faceplate; readouts are tabular numerals. Modulation is made visible the way a mixer shows it: per-strip LED meters, a four-step beat light, and amber markers that ride the live value of any oscillating slider.

The system refuses two things the build visibly avoids: the generic dark admin dashboard (sidebars of cards around a small video) and the near-black-plus-neon-glow costume. Nothing glows. Colour beyond graphite is either the amber signal or a layer identity colour, and each has a fixed job.

**Key Characteristics:**
- Matte graphite in three surface steps (rack, panel, raised), separated by hairline dividers.
- One amber signal colour for live, active, and primary; nothing else is amber.
- Four layer identity colours (A blue, B rose, C lime, Master white) used as labels on the hardware, never as decoration.
- Silkscreen labels in Saira Semi Condensed; everything else in the system UI sans with tabular numerals.
- Modulation shown live: LED meters, beat light, amber value markers.
- Flat at rest; soft shadow only on things that float above the rack.

## Colors

A cool blue-grey graphite neutral ramp with one warm amber signal and four functional layer colours.

### Primary
- **Signal Amber** (signal): the live/active/primary lamp. Fills the Mosh Me Daddy button (and at most one commit action inside a popover), lights the current beat, tops every LED meter as the peak segment, draws the live-value marker on oscillating sliders and the crossfader, pulses the edge of strips a randomizer just changed, and is the focus ring, caret, and text-selection tint. Pressed toggles and active icon buttons are not amber (see Toggles).
- **Signal Ink** (signal-ink): text and icons on a signal fill (9.45:1).

### Secondary
- **Layer A Blue** (layer-a), **Layer B Rose** (layer-b), **Layer C Lime** (layer-c), **Master White** (layer-m): layer identity. They appear only on layer chips (letter in rack-coloured text on the colour), LED meter segments, and the inset selection ring of a selected strip (60% opacity; Master 50%).

### Tertiary
- **Fault Red** (danger): broken-video dot on thumbnails, "Video unavailable" text, invalid input border. Errors only.

### Neutral
- **Rack** (rack): the deepest level. Page background, the inset wells of inputs, selects, segmented controls and the tempo group, unselected strips (at 60%), thumbnail wells.
- **Panel** (panel): the chassis faces: top bar, inspector, mixer row, popovers.
- **Raised** (raised): default buttons, the selected strip, segmented selection, hover fill for ghost and icon buttons.
- **Line** (line): hairline dividers and section rules only (1.43:1, non-interactive); also the unlit beat-light dot and the pressed fill.
- **Edge** (edge): every control boundary: button and input borders, slider tracks (3.04:1 on panel, 3.28:1 on rack).
- **Ink** (ink): primary text, slider caps, fader cap (15.18:1 on panel).
- **Dim** (dim): secondary text, labels, idle icons (6.92:1 on raised).
- **Stage Black** (stage): the stage and output well only; the videos sit on true black.

### Named Rules
**The One Lamp Rule.** Amber means live or primary, and nothing else. If an element is amber it is either moving with the music, marking what just changed, or the single action to press on that surface. Switched-on controls stay neutral so the primary action keeps the only amber fill.

**The Labels-Not-Paint Rule.** Layer colours identify a channel; they never fill panels, buttons, or backgrounds. Chips, meters, and selection rings are the whole list.

**The Edge-Versus-Line Rule.** Anything you can operate gets an edge-coloured boundary (at least 3:1); a line-coloured hairline only divides and is never the sole outline of a control.

## Typography

**Display Font:** none; the wordmark is the only display text.
**Body Font:** system-ui (with -apple-system, Segoe UI, Roboto, sans-serif), tabular numerals globally.
**Label/Mono Font:** Saira Semi Condensed (self-hosted, weights 500/600/700), for silkscreen labels, the wordmark, and layer chip letters.

**Character:** A neutral system sans does the reading and the numbers; a condensed technical face is reserved for what would be printed on the faceplate. The pairing reads as hardware labelling plus an LCD readout, not as editorial type.

### Hierarchy
- **Wordmark** (700, 17px, line-height 1, 0.06em, uppercase, Saira): MOSHTUBE in the top bar and phone header only.
- **Title** (600, 14px): the inspector heading naming the selected strip.
- **Readout** (700, 14px, tabular): the BPM value; numeric readouts beside sliders use 12px 600 in ink.
- **Body** (500, 13px): button text, strip titles, menu and popover text, the status line (13px regular in dim).
- **Control** (500, 12px): toggles, compact selects, field labels (in dim), strip footers.
- **Label** (600, 11px, 0.08em, uppercase, Saira, dim): section titles in the inspector, control group names on strips (Crossfade, Blend), popover headings.
- **Chip** (700, 12px, Saira): the single letter in a layer chip.
- The phone view scales the one primary action to 16px; Mosh Me Daddy in the mixer is 15px 600.

### Named Rules
**The Silkscreen Rule.** Saira Semi Condensed is for labels printed on the gear (section and control-group names, the wordmark, layer letters). Running text, values, and buttons stay in the system sans.

**The Tabular Rule.** Every number on screen uses tabular figures so readouts don't jitter while values move.

## Layout

The desktop view is a fixed full-viewport grid (100dvh, minimum 600px tall): a 44px top bar, then the stage filling the remaining width beside a 320px inspector, then the mixer row pinned along the bottom. The stage is the largest region at every desktop width and nothing overlays it except the fullscreen control pill.

The mixer row is a single horizontal run of fixed-width strips with 8px gaps and 8px padding, scrolling horizontally rather than wrapping: Source A (196px), crossfader (flexible, minimum 272px), Source B (196px), Layer C (132px), Master (184px), mosh cluster (212px). At 1400px and wider the strips grow (216 / 300 / 216 / 132 / 200 / 300px) and the mosh cluster reveals its hint text.

Panels use 16px horizontal padding and 14px vertical rhythm per section; within sections controls stack at 12px, label-to-control at 6px. Inline control groups use 4 to 8px gaps. The top bar separates groups with 20px-tall vertical hairlines.

Below 768px wide (or under 500px tall on touch screens) the app switches to a separate phone view: a 48px header (wordmark, copy link), the stage filling the free height with a cover crop (tapping it runs Mosh Me Daddy), then the status line showing the full change list, and one row of a 48px Mosh Me Daddy button with 48px Play and Undo, with safe-area bottom padding. The full mixer is desktop-only.

## Elevation & Depth

The rack is flat. Depth comes from three tonal steps (rack below panel below raised) and hairline dividers, not shadows. Shadows exist only on elements that genuinely float above the rack: popovers and the fullscreen control pill. Slider caps carry a 1px contact shadow so they read as physical caps on the track.

### Shadow Vocabulary
- **Popover lift** (`box-shadow: 0 12px 32px oklch(0 0 0 / 0.55)`): native popovers for presets, MIDI, and keyboard shortcuts.
- **Overlay pill** (`box-shadow: 0 8px 24px oklch(0 0 0 / 0.5)`, panel at 90% with backdrop blur): the idle-hiding fullscreen control pill over the stage.
- **Cap contact** (`box-shadow: 0 1px 2px oklch(0 0 0 / 0.5)`): slider thumbs only.

### Named Rules
**The Flat Rack Rule.** Anything docked into the rack (bars, strips, sections, buttons) has no shadow. Only floating layers get one, and it is a soft dark drop, never a coloured glow.

## Shapes

Small, consistent, machined corners. Controls, strips, wells, and buttons share a 6px radius; popovers and the fullscreen pill step up to 8px; segments inside a segmented control use 4px; layer chips and thumbnail wells use 2px; LED meter segments are 1px. Round shapes are reserved for things that are round on real gear: slider caps (14px circles), beat-light dots (10px), live-value markers, the error dot. The crossfader cap is a 18 by 28px rectangle with a dark centre line drawn by a hard-stop split, like a fader knob. Borders are 1px throughout.

## Components

### Buttons
Compact, matter-of-fact hardware buttons.
- **Shape:** 6px corners, 32px tall (28px compact, 36px for mosh tiers, 48px for Mosh Me Daddy in the mixer, 56px on phones).
- **Default:** raised fill, ink text, 1px edge border, 13px medium; hover moves to line at 70%, pressed to line.
- **Primary:** signal fill, signal-ink text, semibold; hover brightens (110%), pressed dims (95%). Mosh Me Daddy everywhere it appears; inside a popover, at most one commit action (Save mix, Connect MIDI).
- **Ghost:** no fill, dim text; hover raises to the raised fill and ink text.
- **Icon buttons:** 32px (or 28px) square, 16px (or 14px) stroke icons, dim at rest; when active or held, raised fill, ink icon and a 1px inset edge ring.
- **Hover / Focus:** 150ms colour transitions; focus is a 2px solid signal outline offset 2px. Disabled drops to 40% opacity.
- **Key hints:** a small outlined keycap (18px, 10px semibold, current-colour border at 30%) sits at the end of a button whose action has a shortcut.

### Chips
- **Layer chip:** a 20px square, 2px corners, filled with the layer colour, single Saira letter in rack colour. It leads every strip, the inspector heading, and both ends of the crossfader.

### Cards / Containers
- **Channel strip:** 6px corners, 8px padding, rack at 60% when idle; selected strip moves to raised with a 1px inset ring in its layer colour. No border, no shadow.
- **Panel sections:** separated by a 1px line rule, 16px by 14px padding, heading row 28px tall with optional icon actions at the right.
- **Popovers:** panel fill, 1px line border, 8px corners, 16px padding, popover-lift shadow.

### Inputs / Fields
- **Style:** rack well, 1px edge border, 6px corners, 32px tall (28px compact), 13px ink text, dim placeholder; amber caret.
- **Focus:** the border turns signal; no outline ring on text fields and selects. Grouped controls (the tempo field) show focus on the group border.
- **Error / Disabled:** invalid fields take a danger border; disabled controls drop to 40 to 50% opacity.
- **Toggles:** 28px, edge border, dim 12px text, with a 6px state dot before the label (hollow when off). On state: raised fill, ink at 60% border, ink text, filled ink dot. Active icon buttons (locks) use raised fill with a 1px inset edge ring. Every protection is called "Lock": effects, sources, Layer C, crossfade and Master.
- **Segmented:** rack well with 2px inset padding; selected segment is raised with ink text, others dim.
- **Sliders:** 4px edge track with a 14px ink cap; the crossfader is a 6px track with the fader cap. A dual-handle loop range uses a dim fill between handles.

### Navigation
- **Top bar:** 44px, panel face with a bottom hairline. Left to right: wordmark, tempo chip (beat light and BPM; tap and auto-mosh live in its popover), status line taking the free space, then play, undo/redo, presets, copy link, MIDI, pop-out, fullscreen, shortcuts, source link as ghost or icon buttons.
- **Status line:** 13px dim, announces the last action politely, fades out over 300ms after seven seconds. Long change lists show a headline with the full list in the tooltip and to screen readers. First-visit and Remix guidance stays until the next message.

### LED Meter
The signature. An 8-segment vertical bar, 6px wide, 3px gaps, 1px corners, beside each strip's preview. The top segment is signal amber (the peak lamp); the rest are the strip's layer colour. Unlit segments sit at 14% opacity; lit segments are fully opaque and update every frame from the live modulation level.

### Beat Light
Four 10px round lamps in the top bar; the current beat of the bar is signal, the others line.

### Live-Value Marker
A 2px amber tick riding the track of any slider or crossfader whose value is oscillating, showing where the modulated value actually is while the cap stays at the set value.

### Mosh Cluster
The three randomizers, always in the same order: Mosh and Mosh Everything as 36px default-style buttons with icon, label, hint and keycap; Mosh Me Daddy below them as the 48px signal-filled primary. In the fullscreen pill it collapses into a single row of 36px buttons.

## Do's and Don'ts

### Do:
- **Do** keep amber to live modulation, change pulses, focus, and the one primary action per surface; pressed toggles and active icon buttons stay neutral.
- **Do** give every operable control an edge-coloured boundary or a raised fill; reserve line for dividers.
- **Do** lead every channel with its layer chip and carry its layer colour into its meter and selection ring.
- **Do** set section and control-group names as 11px uppercase Saira labels in dim, and everything else in the system sans.
- **Do** show modulation live: a meter, a beat lamp, or an amber marker on the value that moves.
- **Do** keep transitions to 150ms colour changes and 300ms fades for status and the overlay pill; no page-load choreography.
- **Do** keep the stage the largest region and leave it unobstructed outside fullscreen.

### Don't:
- **Don't** use glows, neon edge light, or coloured shadows; shadows are soft dark drops on floating layers only.
- **Don't** use soft decorative gradients on chrome; hard-stop splits that draw a physical detail (the fader cap centre line) are fine, and the stage output is exempt.
- **Don't** put layer colours on panels, button fills, text blocks, or backgrounds.
- **Don't** add a second filled amber button to the main mixer or phone view; Mosh Me Daddy is the primary.
- **Don't** wrap controls in floating cards with shadows around a small video; strips sit flush in the rack.
- **Don't** use line (1.43:1) as the only boundary of an interactive control.
