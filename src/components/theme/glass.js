// Glassmorphism, in one place.
//
// The effect is four things that have to agree: a translucent fill, a blur of
// whatever is behind it, a hairline edge catching the light, and a shadow that
// lifts it off the page. Written out per component they drift — one panel ends
// up more frosted than the next, and the page stops looking like one material.
//
// Two rules this module encodes:
//
//  1. **Glass is for things that float.** Dialogs, menus, drawers, the app bar,
//     raised cards. A flat panel that is part of the page gets a flat surface.
//     This is partly taste and partly cost: `backdrop-filter` forces the
//     compositor to re-blur its backdrop on every paint, so putting it behind
//     every surface on a page is a real frame-rate decision, not a free one.
//
//  2. **Translucency is a contrast budget.** A glass panel takes on whatever is
//     behind it, so its worst case is the brightest point of the ambient
//     background. The alphas in index.css were measured against that worst
//     case; `contrast.test.js` asserts it. Anything that lowers them is
//     spending readability.

/** Blur radius, shared so nested glass surfaces frost identically. */
export const GLASS_BLUR = "var(--glass-blur)";

/**
 * The base recipe.
 *
 * `backdropFilter` is duplicated as `WebkitBackdropFilter` because Safari —
 * including current iOS — still only understands the prefixed form, and it is
 * the platform where the effect matters most.
 */
export const glassSurface = {
  background: "var(--glass-bg)",
  backdropFilter: `blur(${GLASS_BLUR}) saturate(160%)`,
  WebkitBackdropFilter: `blur(${GLASS_BLUR}) saturate(160%)`,
  border: "1px solid var(--glass-border)",
  // MUI paints an elevation overlay on Paper in dark mode. It is opaque, so it
  // sits *on top of* the translucency and cancels the effect entirely.
  backgroundImage: "none",
  boxShadow: "var(--glass-shadow)",
};

/**
 * The lit top edge.
 *
 * A single inset highlight along the upper border. This is the detail that
 * reads as "glass" rather than "semi-transparent box" — real glass catches
 * light on the lip facing the source.
 */
export const glassHighlight = {
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: "8%",
    right: "8%",
    height: "1px",
    background:
      "linear-gradient(90deg, transparent, var(--glass-highlight), transparent)",
    pointerEvents: "none",
  },
};

/**
 * A glass panel, ready to spread into `sx`.
 *
 * @param {object} [options]
 * @param {number|string} [options.radius=3] MUI border radius units.
 * @param {boolean} [options.highlight=true] Draw the lit top edge.
 */
export const glassCard = ({ radius = 3, highlight = true } = {}) => ({
  ...glassSurface,
  borderRadius: radius,
  ...(highlight ? glassHighlight : null),
});

/**
 * A lighter treatment for surfaces *inside* a glass panel.
 *
 * Nested glass double-blurs and turns muddy — the inner panel is frosting an
 * already-frosted backdrop. Inner surfaces get a plain overlay tint instead, so
 * hierarchy still reads without a second blur pass.
 */
export const glassInset = {
  background: "rgba(var(--ov),0.05)",
  border: "1px solid rgba(var(--ov),0.08)",
  backgroundImage: "none",
  boxShadow: "none",
};
