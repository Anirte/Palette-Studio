# Palette Studio

A tool for generating perceptually uniform, design-system-ready color palettes with light and dark themes, built on Google's HCT color model. It runs in any browser and also works as a [Penpot](https://penpot.app) plugin that writes the result straight into your file's color library or design tokens.

---

## What it does

You define one or more brand colors (**sources**), choose which semantic roles you need (Primary, Background, Text, Error, ...), and Palette Studio builds a shade scale for every role. For each role you pick which shade to use in the Light theme and which in the Dark theme. Those picks are what gets checked for contrast, previewed on a sample screen and exported.

Roles are generated on one of two ladders:

- **HCT tone ladder** (core, neutrals, semantic roles). Step *N* is always the same HCT Tone for every role, as in Material Design 3. Contrast between two roles therefore follows from the distance between their steps instead of having to be guessed.
- **OKLCH ladder** (accents and extended roles). Anchored on the source color itself at step 500, which keeps decorative colors close to what you picked.

---

## Features

- **17 semantic roles in five groups**
  - *Core*: Primary, Secondary
  - *Neutrals*: Background, Surface, Border, Border Subtle, Text, Text Subtle. These are tinted greys that borrow hue and chroma from the source, so the palette stays connected.
  - *Accents*: Accent 1-3, each from its own source
  - *Semantic*: Error, Warning, Success, Info. Fixed hues (red, amber, green, blue) with chroma following the brand and the Arousal slider.
  - *Extended*: Highlight, On Primary

  Each role can be switched on or off and assigned to any source.
- **Mood sliders** (-50...+50), plus the shade count (5-12 steps):
  - *Valence* shifts lightness: negative toward dark, positive toward light.
  - *Arousal* scales chroma from muted (about x0.1) to vivid (about x1.8).
  - *Temperature* rotates hues up to 30 degrees toward a warm or cool pole, taking the short way round, so "warmer" is warmer for every hue.
- **Light / Dark step picker** on every role card, with sensible defaults. Success sits two steps away from Error on purpose, because the same step means the same tone, which red-green colour-blind users cannot tell apart.
- **Contrast check** for the pairs you actually use, in both themes: Text on Background and Surface, Border, Primary, On Primary on Primary, and so on. Each pair shows the WCAG 2.x ratio with its level (AAA, AA, large / UI) and the APCA Lc value (official APCA-W3 0.1.9) graded against the Bronze levels. You can add your own pairs, using roles or any hex color.
- **Colour-blind check** for Error vs Success: simulated protanopia, deuteranopia and tritanopia with a CIE76 color difference (dE). Pairs under dE 10 are flagged. This is a soft hint, not a standard.
- **Preview UI**: a sample app screen built from your selected Light and Dark steps, shown side by side or alone, optionally as seen with protanopia, deuteranopia, tritanopia or achromatopsia.
- **Harmony presets**: Complementary, Split-complementary, Triadic, Tetradic, Analogous x2, Analogous x3, Square. They rearrange the sources around the Primary hue. Click an active preset again to undo.
- **Image extraction**: dominant colors from an image via K-means in OKLCH, applied to the sources. Works for near-greyscale images too.
- **AI generation**: describe a mood in plain language (any language your model understands) and a local model picks a hue for each source and sets the sliders. Uses [LM Studio](https://lmstudio.ai) on your machine; nothing leaves it.
- **Export**: CSS variables, Tailwind config or JSON, with a one-click CSS copy. Palettes can also be saved to and loaded from a JSON file.
- **Penpot integration**: export as library colors or as design tokens (see below).
- **Persistence**: everything is kept in the browser's localStorage and restored on the next start.
- **Theme and window**: Auto / Light / Dark interface, a built-in help dialog, and in Penpot a click on the title collapses the plugin window to a small bar.

---

## Using it

### Color sources
Base brand colors. Each role takes its hue from a source, either by default or the one you choose in the role's dropdown. Click a swatch to open the color picker, rename a source by editing its name, or add more with **+ Add source**.

### Mood sliders
See the feature list above. **Reset** (the arrow next to the section title) returns the sliders to zero.

### AI generation
1. Start LM Studio, load a model and start its local server (default port `1234`).
2. Set the port in the AI panel if you changed it. The status dot turns green and the loaded models appear in the list.
3. Pick a model, describe the project ("calm science magazine", "dark SaaS dashboard") and press **Generate**. The model's one-sentence reasoning is shown below the button.

The page talks to LM Studio at `http://localhost:<port>`. If the browser blocks the request, enable CORS in LM Studio's server settings.

### Exporting

Only the **Light** and **Dark** steps selected on each role are exported. A role set to *None* for a theme is left out of that theme.

| Format | Output |
|---|---|
| CSS | `--color-<role>-light` and `--color-<role>-dark` in `:root` |
| Tailwind | `colors: { '<role>': { light, dark } }` |
| JSON | `{ "<role>": { "light": "#...", "dark": "#..." } }` |

**Save / load.** *Export* in the header downloads the whole state (sources, roles, sliders, chosen steps, custom pairs) as `palette-YYYY-MM-DD.json`, and *Import* restores it.

### Penpot

These two buttons work only when Palette Studio runs as a Penpot plugin.

- **Export as Assets** creates color assets in the file's library, named `Group/Name`. If a role has both a Light and a Dark step, the names get a `(Light)` or `(Dark)` suffix. Exporting again updates the existing colors instead of adding duplicates.
- **Export as Tokens** writes color tokens into three sets and two themes:

  | Set | Holds |
  |---|---|
  | `Universal` | tokens with the same value in both themes (or with only one theme picked) |
  | `Light` | tokens whose Light value differs from Dark |
  | `Dark` | the Dark values of those same tokens |

  Themes `Light` = `Universal` + `Light` and `Dark` = `Universal` + `Dark` (no theme group). A token name lives in only one place: if a value becomes identical in both themes, the old copies in `Light` and `Dark` are removed so they cannot override it. Existing tokens are updated in place, other tokens in these sets are left alone, and a confirmation is asked first. If Penpot does not accept a set in a theme, Palette Studio lists what to add by hand in the Tokens panel.

  Token names come from the role catalog (`token` in `js/state.js`):

  | Role | Token | Role | Token |
  |---|---|---|---|
  | Primary | `core.primary` | Error | `accent.error` |
  | Secondary | `core.secondary` | Warning | `accent.warning` |
  | Background | `neutral.background` | Success | `accent.approve` |
  | Surface | `neutral.surface` | Info | `accent.info` |
  | Border | `neutral.border` | Accent 1-3 | `accent.accent-1` ... `-3` |
  | Border Subtle | `neutral.border_light` | Highlight | `accent.highlight` |
  | Text | `neutral.text` | On Primary | `core.on-primary` |
  | Text Subtle | `neutral.text-subtle` | | |

  The set and theme names are constants at the top of `plugin.js`. Token export needs a Penpot version with the design tokens API.

---

## Installation

### As a Penpot plugin
1. Host the project as static files (see below).
2. In Penpot open the Plugin manager (`Ctrl+Alt+P`, or the main menu, then *Plugins*) and enter the URL of `manifest.json`.

The plugin asks for two permissions: `library:write` to create library colors, and `content:write`, which Penpot requires for every change to design tokens (sets, themes and token values). If you installed an earlier version that only had `library:write`, remove the plugin in the Plugin manager and add it again so Penpot registers the new permissions.

### Hosting
Palette Studio needs no build step. Serve the folder with a static server that sends CORS headers, because Penpot loads `manifest.json` and `plugin.js` from a different origin. Python's built-in `http.server` does not send them, so use for example:

```bash
npx http-server -p 8080 --cors
```

Then open `http://localhost:8080` for the standalone app, or use `http://localhost:8080/manifest.json` as the plugin URL in Penpot.

The repository includes a GitHub Pages workflow (`.github/workflows/static.yml`). It is manual: enable Pages with the *GitHub Actions* source in the repository settings, then run **Deploy to GitHub Pages** from the Actions tab. The manifest will then be served from the Pages address of the repository. GitHub Pages already sends the CORS headers Penpot needs.

---

## Project structure

```
index.html          interface markup and styles; loads the scripts below
manifest.json       Penpot plugin manifest (name, entry points, permissions)
plugin.js           Penpot side: opens the window, writes colors, token sets and themes
js/color-math.js    HCT and OKLCH math, APCA and WCAG contrast, shade engine,
                    colour-blind simulation, K-means
js/state.js         role catalog, defaults and persistence (localStorage)
js/ui.js            rendering, sliders, contrast and preview cards, picker,
                    harmony, image extraction
js/export.js        CSS / Tailwind / JSON output, file save and load, Penpot messages
js/ai.js            LM Studio connection and palette generation
```

The scripts are plain files loaded in this order: `color-math`, `state`, `ui`, `export`, `ai`. They share globals, so the order matters.

`index.html` and `plugin.js` talk through `postMessage`. The page sends `ADD_COLORS`, `RESIZE`, `GET_SIZE_AND_MINIMIZE` and `RESTORE_SIZE`; the plugin answers with `COLORS_ADDED`.

---

## Technical notes

- **Color model:** HCT (CAM16 hue and chroma with CIE L* tone) for the tone ladder, OKLCH for accents, harmony and image analysis. The HCT solver in `color-math.js` is a port of the algorithm from Google's Material Color Utilities.
- **Contrast:** WCAG 2.x ratios and APCA-W3 0.1.9 (the WCAG 3 draft algorithm). APCA is signed (negative means light text on dark); the interface shows the absolute value.
- **Colour-blind simulation:** full dichromacy matrices applied in linear RGB (Krzywinski). Partial deficiencies are not simulated.
- **Storage:** the state lives under the key `paletteStudioState` with a version number. Opening a state saved by an older engine resets the Light / Dark steps to the new defaults and says so in a notice.
- **Dependencies:** none to install. The only external resource is the IBM Plex fonts from Google Fonts; without a connection the browser falls back to system fonts.

---

## License

Apache License 2.0. See [LICENSE](LICENSE).

The HCT implementation is derived from Google Material Color Utilities, Copyright 2021 Google LLC, licensed under the Apache License 2.0. APCA is implemented from the public APCA-W3 specification.
