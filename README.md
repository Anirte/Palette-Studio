# Palette Studio

A web-based tool for generating perceptually uniform, design-system-ready color palettes, built on Google's HCT color model.

---

## What it does

Palette Studio allows you to define brand colors and instantly generate a complete semantic color system, including scales, theme variants, and contrast scoring, optimized for design systems.

The generation process is powered by HCT (Hue, Chroma, Tone), the perceptual color space developed for Material Design 3. This ensures that generated palettes remain consistent and balanced across all shades rather than relying solely on mathematical uniformity.

---

## Features

- **Semantic roles** — Core (Primary, Secondary), Neutral (Background, Surface, Border, Text), Accent, Semantic (Error, Warning, Success, Info), and Extended roles.
- **Mood sliders** — adjustable parameters for Valence (lightness), Arousal (saturation), Temperature (warm/cool), and shade count.
- **Harmony presets** — support for Complementary, Triadic, Analogous, Split-complementary, and other standard color relationships.
- **Image extraction** — automated extraction of dominant colors from images using K-means clustering in OKLCH.
- **AI Generation** — local LLM integration via LM Studio to generate palettes from natural language descriptions.
- **APCA contrast** — real-time contrast scoring based on the WCAG 3.0 draft algorithm for configurable backgrounds.
- **Export** — output formats including CSS Variables, Tailwind CSS configuration, JSON, and direct integration with Penpot's color library.
- **Persistence** — automatic state management via localStorage.

---

## Usage

### Color Sources
Define base brand colors. Each role derives its hue from these sources. Different sources can be assigned to individual roles using the dropdown menu provided for each semantic token.

### Mood Sliders
- **Valence** — controls palette lightness. Negative values lean toward dark theme characteristics, positive values toward light.
- **Arousal** — controls saturation levels. Negative values produce muted tones, positive values produce vivid tones.
- **Temperature** — applies a warm or cool hue shift across the palette.
- **Shades** — defines the number of steps in each color scale (5–12).

### AI Generation
Requires LM Studio running locally on port 1234 with a compatible model loaded. Provide a description of the desired brand personality, and the system will automatically configure hues and adjust the mood sliders.

---

## Tech notes

- Implementation: Single-file `index.html` structure with no external build dependencies.
- Color math: Google Material Color Utilities (HCT) and OKLCH for image processing.
- Contrast: APCA (Advanced Perceptual Contrast Algorithm, WCAG 3.0 draft).
- Data: State persistence managed via browser localStorage.

---

## License

Apache License 2.0

This project uses Google Material Color Utilities.
Copyright 2021 Google LLC — licensed under Apache License 2.0.
