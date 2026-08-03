import fs from "fs";
import path from "path";

import { PALETTE } from "./palette";

// Contrast, asserted rather than eyeballed.
//
// The icon bug these guard against was not a mistake in any one component. It
// was a palette of 300-level tints — #a5b4fc, #86efac, #fca5a5 — chosen against
// a near-black background and then reused unchanged on white, where they
// measure around 2:1. It looked deliberate everywhere it appeared, which is
// exactly why nobody caught it by reading the code.
//
// These tests encode the thresholds instead. A future colour that reads well in
// whichever mode its author happened to be using fails here.

const srgbToLinear = (channel) =>
  channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);

const relativeLuminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
};

/** WCAG 2.1 contrast ratio between two opaque colours. */
export const contrastRatio = (a, b) => {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (lighter + 0.05) / (darker + 0.05);
};

/** WCAG minimum for icons, borders and other non-text graphics. */
const GRAPHIC_MIN = 3;
/** WCAG AA minimum for body text. */
const TEXT_MIN = 4.5;

describe("contrastRatio", () => {
  test("black on white is the reference 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  test("a colour against itself is 1:1", () => {
    expect(contrastRatio("#6366f1", "#6366f1")).toBeCloseTo(1, 5);
  });

  test("order does not matter", () => {
    expect(contrastRatio("#0b1020", "#f5f7fb")).toBeCloseTo(
      contrastRatio("#f5f7fb", "#0b1020"),
      5,
    );
  });
});

describe.each(["dark", "light"])("%s theme", (mode) => {
  const p = PALETTE[mode];
  // Every foreground has to work on both the page background and the raised
  // card, because the same token is used on both.
  const surfaces = [
    ["bg", p.bg],
    ["surface", p.surface],
  ];

  describe.each(surfaces)("on %s", (_surfaceName, surface) => {
    test.each([
      ["icon", "icon"],
      ["iconMuted", "iconMuted"],
      ["accentSoft", "accentSoft"],
      ["success", "success"],
      ["warning", "warning"],
      ["danger", "danger"],
      ["info", "info"],
    ])("%s is legible as a graphic", (_label, key) => {
      expect(contrastRatio(p[key], surface)).toBeGreaterThanOrEqual(GRAPHIC_MIN);
    });

    test.each([
      ["text", "text"],
      ["text2", "text2"],
      ["textMuted", "textMuted"],
    ])("%s is legible as body text", (_label, key) => {
      expect(contrastRatio(p[key], surface)).toBeGreaterThanOrEqual(TEXT_MIN);
    });
  });
});

describe("the tokens that must differ between themes", () => {
  // If these ever converge, someone has "simplified" a per-mode pair back into
  // a single value — which is the original bug.
  test.each(["icon", "accentSoft", "success", "warning", "danger", "info"])(
    "%s is not the same value in both themes",
    (key) => {
      expect(PALETTE.dark[key]).not.toBe(PALETTE.light[key]);
    },
  );

  test("the dark-mode pale tints would fail on a white surface", () => {
    // Documents why the split exists at all, using the actual former values.
    expect(contrastRatio(PALETTE.dark.accentSoft, "#ffffff")).toBeLessThan(
      GRAPHIC_MIN,
    );
    expect(contrastRatio(PALETTE.dark.success, "#ffffff")).toBeLessThan(
      GRAPHIC_MIN,
    );
  });
});

describe("glass surfaces stay readable", () => {
  // Glassmorphism's characteristic failure is exactly this: a panel is
  // translucent, so its effective background is whatever happens to be behind
  // it, and text that was fine on the mock becomes marginal over a bright
  // spot. The ambient background in index.css is two bounded blooms, so the
  // worst case is knowable — and asserted here rather than eyeballed.
  //
  // If someone lowers --glass-bg to make the effect stronger, this fails.

  const AMBIENT = [
    ["plain background", null],
    ["over the indigo bloom", { rgb: [99, 102, 241], alpha: 0.22 }],
    ["over the cyan bloom", { rgb: [34, 211, 238], alpha: 0.16 }],
  ];

  const composite = (fg, alpha, bg) =>
    fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));

  const toHex = (rgb) =>
    `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

  const channels = (hex) =>
    [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));

  describe.each(["dark", "light"])("%s theme", (mode) => {
    const p = PALETTE[mode];

    describe.each(AMBIENT)("%s", (_label, bloom) => {
      // The page background, plus the bloom if there is one, then the glass.
      const backdrop = bloom
        ? composite(bloom.rgb, bloom.alpha, channels(p.bg))
        : channels(p.bg);
      const surface = toHex(composite(channels(p.glassTint), p.glassAlpha, backdrop));

      test("body text clears AA", () => {
        expect(contrastRatio(p.text, surface)).toBeGreaterThanOrEqual(TEXT_MIN);
      });

      test("secondary text clears AA", () => {
        expect(contrastRatio(p.text2, surface)).toBeGreaterThanOrEqual(TEXT_MIN);
      });

      test("muted text clears the graphic minimum", () => {
        expect(contrastRatio(p.textMuted, surface)).toBeGreaterThanOrEqual(
          GRAPHIC_MIN,
        );
      });
    });
  });

  test("light glass is far more opaque than dark glass", () => {
    // Not a style preference. A light film over a dark page reads as frost at
    // a low alpha; the same alpha over an already-light page is invisible and
    // the panel loses its edge entirely.
    expect(PALETTE.light.glassAlpha).toBeGreaterThan(PALETTE.dark.glassAlpha * 5);
  });
});

describe("index.css and palette.js agree", () => {
  // The values are duplicated on purpose — a theme that has to wait for the DOM
  // to paint cannot render the first frame, so MUI's palette cannot be read
  // back out of CSS. Deliberate duplication still drifts, so it is asserted.
  const css = fs.readFileSync(
    path.resolve(__dirname, "../../index.css"),
    "utf8",
  );

  const blockFor = (mode) => {
    const start =
      mode === "dark"
        ? css.indexOf(":root {")
        : css.indexOf(':root[data-theme="light"]');
    return css.slice(start, css.indexOf("}", start));
  };

  const cssVarFor = {
    bg: "--bg",
    surface: "--surface",
    surface2: "--surface-2",
    text: "--text",
    text2: "--text-2",
    textMuted: "--text-muted",
    accentSoft: "--accent-soft",
    icon: "--icon",
    iconMuted: "--icon-muted",
    success: "--success",
    warning: "--warning",
    danger: "--danger",
    info: "--info",
  };

  describe.each(["dark", "light"])("%s", (mode) => {
    const block = blockFor(mode);

    test.each(Object.entries(cssVarFor))(
      "%s matches %s",
      (paletteKey, cssVar) => {
        const match = block.match(
          new RegExp(`${cssVar}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`),
        );
        expect(match).not.toBeNull();
        expect(match[1].toLowerCase()).toBe(
          PALETTE[mode][paletteKey].toLowerCase(),
        );
      },
    );

    // Not a colour, so it sits outside the loop above and outside the contrast
    // checks — but it is duplicated the same way and drifts the same way.
    test("--shadow-card matches shadowCard", () => {
      const match = block.match(/--shadow-card:\s*([^;]+);/);
      expect(match).not.toBeNull();
      expect(match[1].trim()).toBe(PALETTE[mode].shadowCard);
    });
  });
});

describe("scrollbars are defined once, globally", () => {
  // The arrows came from an omission repeated six times: styling
  // `::-webkit-scrollbar` makes Chrome draw stepper buttons at both ends until
  // you explicitly remove them, and none of the six per-component copies did.
  //
  // The fix was one global rule. These assert it stays one, because the failure
  // mode is not a broken rule — it is a second rule appearing somewhere else
  // and quietly winning.
  const root = path.resolve(__dirname, "../..");
  const indexCss = fs.readFileSync(path.join(root, "index.css"), "utf8");

  test("the global rule removes the stepper arrows", () => {
    expect(indexCss).toMatch(/::-webkit-scrollbar-button\s*\{[^}]*display:\s*none/);
    // `display: none` alone is unreliable across Chrome versions; zero
    // dimensions are what actually reclaim the space.
    const block = indexCss.match(/::-webkit-scrollbar-button\s*\{([^}]*)\}/)[1];
    expect(block).toMatch(/width:\s*0/);
    expect(block).toMatch(/height:\s*0/);
  });

  test("the thumb is inset rather than flush against the edge", () => {
    // A thumb painted straight into the track rides over a card's rounded
    // corner and reads as escaping it. Transparent border + content-box clip
    // is what floats it inside.
    const thumb = indexCss.match(/::-webkit-scrollbar-thumb\s*\{([^}]*)\}/)[1];
    expect(thumb).toMatch(/border:\s*2px solid transparent/);
    expect(thumb).toMatch(/background-clip:\s*content-box/);
  });

  test("the standard properties are scoped away from Chrome", () => {
    // The trap that made every earlier fix look like it had failed.
    //
    // `scrollbar-width` / `scrollbar-color` are NOT a peer of
    // `::-webkit-scrollbar`. From Chrome 121 the standard properties win, and
    // setting either makes Chrome ignore the webkit pseudo-elements outright.
    // A global `* { scrollbar-width: thin }` therefore disables all the styling
    // below it and restores the browser's native scrollbar — arrows included —
    // while the CSS still reads as though it should work.
    //
    // So they must sit behind a query that is false in Chrome.
    const standalone = indexCss
      // Drop the @supports block, then look for any survivors.
      .replace(/@supports not selector\(::-webkit-scrollbar\)\s*\{[\s\S]*?\n\}/, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");

    expect(standalone).not.toMatch(/scrollbar-width\s*:/);
    expect(standalone).not.toMatch(/scrollbar-color\s*:/);

    // And the guarded block must still exist, or Firefox gets nothing.
    expect(indexCss).toMatch(
      /@supports not selector\(::-webkit-scrollbar\)\s*\{[\s\S]*?scrollbar-width/,
    );
    expect(indexCss).toMatch(/::-webkit-scrollbar\s*\{/);
  });

  test("nothing outside index.css re-declares scrollbar styling", () => {
    // Covers .css as well as .jsx. The landing stylesheet used to carry its own
    // copy keyed to `--l-ov`; it was redundant (the triplets are identical in
    // both modes) and, like the six component copies before it, it omitted the
    // button rule. One definition is the only arrangement where that omission
    // cannot recur.
    //
    // ChatInput is the single exemption: it *hides* the bar on a one-line
    // input, which is a different intent from styling one.
    const walk = (dir) =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return /\.(jsx|css)$/.test(entry.name) ? [full] : [];
      });

    const offenders = walk(path.join(root, "components"))
      .filter((file) => !file.endsWith("ChatInput.jsx"))
      .filter((file) => {
        // Ignore prose: these files explain the rule in comments.
        const source = fs
          .readFileSync(file, "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/^\s*\/\/.*$/gm, "");
        return /::-webkit-scrollbar/.test(source);
      })
      .map((file) => path.relative(root, file));

    expect(offenders).toEqual([]);
  });

  test("no component sets the standard scrollbar properties", () => {
    // The camelCase trap. In `sx`, the standard properties are written
    // `scrollbarWidth` / `scrollbarColor`, so a search for
    // "::-webkit-scrollbar" or "scrollbar-width" finds nothing — and two of
    // these were sitting in the chat page defeating the global styling for
    // those panels while every other scrollbar in the app looked fine.
    //
    // Setting either one on an element makes Chrome ignore the global webkit
    // rules *for that element*, so this has to be caught by name.
    //
    // ChatInput is exempt: `scrollbarWidth: "none"` hides the bar on a
    // one-line input, which is a different intent.
    const walk = (dir) =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return entry.name.endsWith(".jsx") ? [full] : [];
      });

    const offenders = walk(path.join(root, "components"))
      .filter((file) => !file.endsWith("ChatInput.jsx"))
      .filter((file) => {
        const source = fs
          .readFileSync(file, "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/^\s*\/\/.*$/gm, "");
        return /scrollbarWidth\s*:|scrollbarColor\s*:/.test(source);
      })
      .map((file) => path.relative(root, file));

    expect(offenders).toEqual([]);
  });
});
