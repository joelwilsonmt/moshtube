# MOSHTUBE

**Moshtube** is an interactive, browser-based video synthesizer and VJ tool that allows users to remix and blend dual YouTube video streams in real-time. Built as a creative coding experiment, it features a custom "mosh" engine that applies dynamic SVG filters and CSS blend modes to simulate glitch art, analog signal degradation, and psychedelic visual effects.

![Moshtube](/screenshot.png)

## Key Features

*   **Dual Video Engine**: Blend two independent YouTube sources (A/B) with precise control over playback, looping, and synchronization.
*   **Dynamic Shaders**: Apply real-time visual effects including **Glitch**, **VCR**, **Pixelate**, **Wavy**, **Trippy**, and **Scanlines**.
*   **Live Blending**: Mix video layers using CSS blend modes like **Overlay**, **Difference**, **Exclusion**, and **Multiply**.
*   **Procedural Chaos**:
    *   **MOSH**: Randomize shaders and parameters for the current videos.
    *   **MOSH EVERYTHING**: Randomize shaders, blend modes, mix levels, and oscillation.
    *   **MOSH ME DADDY**: A "shuffle" mode that loads random videos, sets random loops, and triggers a full system mosh.
*   **Oscillation**: Automate parameter modulation for shader intensity and master mix levels using sine-wave oscillation.
*   **Smart Overlay**: Context-aware UI that reveals layer ordering controls only when relevant (e.g., in Overlay mode).
*   **URL State Sync**: Share your creations with deep-linked URLs that preserve all video IDs, timestamps, and parameters.
*   **Fullscreen Mode**: Immersive playback with a floating control bar for uninterrupted VJing.

## Tech Stack

*   **Core**: React 18, TypeScript, Vite
*   **State Management**: Zustand (with Zod schema validation)
*   **Styling**: Tailwind CSS, Lucide React
*   **Graphics**: SVG Filters (`feTurbulence`, `feDisplacementMap`), CSS Mix-Blend-Modes
*   **Runtime**: Bun

## Getting Started

1.  **Install Dependencies**
    ```bash
    bun install
    ```

2.  **Run Development Server**
    ```bash
    bun run dev
    ```

3.  **Build for Production**
    ```bash
    bun run build
    ```

## Controls

*   **M**: Toggle Master Mute (if implemented) / or standard YouTube controls if visible.
*   **Mosh Button**: Randomizes effects for the selected video.
*   **Shuffle Icon**: Loads a random video from the curated source list.
*   **Slider / Input**: Fine-tune loop start/end points and shader intensities.

## License

MIT
