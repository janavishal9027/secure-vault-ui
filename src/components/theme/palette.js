// One palette, two consumers.
//
// The app draws colour from two systems that must agree: CSS custom properties
// (`var(--text)`, `rgba(var(--ov), x)`) used by hand-written `sx`, and MUI's own
// palette used by every component we did not style — TextField labels, Menu
// backgrounds, Dialog surfaces, `color="text.secondary"`, disabled states.
//
// They were previously defined in only one place, `index.css`, and MUI was
// never told about the mode at all. Everything MUI coloured therefore stayed on
// its default *light* palette forever, which is why text that carried no
// explicit `sx` colour rendered near-black on the dark background.
//
// These values mirror index.css exactly. If one changes, change both — they are
// duplicated deliberately rather than read from `getComputedStyle`, because a
// theme that depends on the DOM having painted cannot be used to render the
// first frame.

export const PALETTE = {
  dark: {
    bg: "#0b1020",
    surface: "#1f2937",
    surface2: "#111827",
    text: "#f5f7fb",
    text2: "#cfd5e3",
    textMuted: "#98a2b3",
    // The overlay channel used by rgba(var(--ov), x) for borders and dividers.
    overlay: "255, 255, 255",
    // Icons and status. These differ per mode by necessity, not preference —
    // see the note in index.css. Every value clears 3:1 on both bg and surface.
    icon: "#e8edf7",
    iconMuted: "#98a2b3",
    accentSoft: "#a5b4fc",
    success: "#86efac",
    warning: "#fcd34d",
    danger: "#fca5a5",
    info: "#93c5fd",
    // Not a colour token — a full shadow value, so it is excluded from the
    // contrast checks. A shadow is light being blocked, so its weight has to
    // follow the surface it falls on.
    shadowCard: "0 24px 70px rgba(0, 0, 0, 0.45)",
    // Glass. `glassAlpha` is the one value contrast depends on, so it is kept
    // as a number the tests can compute with rather than only as a CSS string.
    glassAlpha: 0.055,
    glassTint: "#ffffff",
  },
  light: {
    bg: "#eef1f8",
    surface: "#ffffff",
    surface2: "#f6f8fc",
    text: "#0b1020",
    text2: "#2a3342",
    textMuted: "#5b6472",
    overlay: "17, 24, 39",
    icon: "#111827",
    iconMuted: "#5b6472",
    accentSoft: "#4f46e5",
    success: "#15803d",
    warning: "#a16207",
    danger: "#b91c1c",
    info: "#1d4ed8",
    shadowCard: "0 18px 44px rgba(15, 23, 42, 0.14)",
    glassAlpha: 0.62,
    glassTint: "#ffffff",
  },
};

/** Indigo, identical in both modes — it is the brand accent, not a surface. */
export const ACCENT = {
  main: "#6366f1",
  light: "#a5b4fc",
  dark: "#4f46e5",
};

export const paletteFor = (mode) => PALETTE[mode] || PALETTE.dark;
