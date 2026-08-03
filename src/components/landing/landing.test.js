import fs from "fs";
import path from "path";

// The landing design ships a stylesheet written for a standalone Vite app: it
// styles `:root`, `html`, `body`, `main`, and bare `h1`/`h2`/`h3`/`p`/`button`/
// `a`/`blockquote`. Dropped into this app unscoped, those rules would restyle
// the dashboard, the note editor and every dialog — the landing page would
// look right and everything else would quietly change font, colour and margin.
//
// Scoping is what prevents that, and scoping is easy to lose: re-export the
// design from Figma, re-run the port, forget the prefix, and the damage is
// invisible until someone opens an unrelated page. So it is asserted.

const css = fs.readFileSync(path.resolve(__dirname, "landing.css"), "utf8");

/** Strips comments, then returns every selector that opens a rule block. */
const selectors = () => {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const found = [];
  const re = /([^{}]+)\{/g;
  let match;
  while ((match = re.exec(withoutComments))) {
    const sel = match[1].trim();
    // Skip at-rule preludes (@media, @supports) and declaration blocks.
    if (!sel || sel.startsWith("@")) continue;
    found.push(sel);
  }
  return found;
};

describe("landing.css is scoped", () => {
  const all = selectors();

  test("the stylesheet actually has rules", () => {
    expect(all.length).toBeGreaterThan(20);
  });

  test("every selector is scoped under .landing-root", () => {
    const unscoped = all.filter((sel) =>
      sel.split(",").some((part) => !part.trim().startsWith(".landing-root")),
    );
    expect(unscoped).toEqual([]);
  });

  test.each(["html", "body", ":root", "main"])(
    "no bare %s selector survives",
    (target) => {
      const bare = all.filter((sel) =>
        sel.split(",").some((part) => part.trim() === target),
      );
      expect(bare).toEqual([]);
    },
  );

  test("element selectors that would hit the app are all prefixed", () => {
    // These are the ones that would do real damage: they match markup the
    // dashboard renders constantly.
    const risky = ["h1", "h2", "h3", "p", "button", "a", "blockquote", "img"];
    const leaked = all.filter((sel) =>
      sel
        .split(",")
        .some((part) => risky.includes(part.trim())),
    );
    expect(leaked).toEqual([]);
  });

  test("the font import survived the port and is intact", () => {
    // The URL contains semicolons, which is what broke a naive extraction.
    expect(css).toMatch(/@import url\('https:\/\/fonts\.googleapis\.com[^']*'\);/);
    expect(css).toContain("Plus+Jakarta+Sans");
    expect(css).toContain("display=swap");
  });

  test("Tailwind is not pulled in", () => {
    // The design's markup uses hand-written classes, so importing Tailwind
    // would ship a framework that styles nothing.
    //
    // Checked against the comment-stripped stylesheet: the header comment
    // explains that the import was dropped, and naming it there should not
    // read as still importing it.
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(withoutComments).not.toContain("tailwindcss");
  });

  test("no comment is absorbed into a selector", () => {
    // A comment sitting between two rules gets swallowed into the next
    // selector by a naive prefixer, producing
    // `.landing-root /* ... */ .glass-nav {}`. Browsers tolerate it, which is
    // precisely why it would go unnoticed.
    expect(all.filter((sel) => sel.includes("/*"))).toEqual([]);
  });

  test("responsive rules survived", () => {
    expect((css.match(/@media/g) || []).length).toBeGreaterThanOrEqual(5);
  });

  test("no raw dark surface colour survives the port", () => {
    // A hardcoded dark fill is invisible in dark mode and a blot in light
    // mode. The port maps them to tokens; the only exceptions are the two
    // colours that sit on the theme-independent gradient, and the hero's
    // app-window mock, which stays dark on purpose.
    const ALLOWED = ["#071126", "#08102e", "25,28,84", "8,11,46", "1,5,28", "79,72,163"];
    const body = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const suspects = (body.match(/#[0-9a-fA-F]{6}|rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)/g) || [])
      .filter((lit) => !ALLOWED.some((a) => lit.replace(/\s/g, "").includes(a)))
      .filter((lit) => {
        const nums = lit.startsWith("#")
          ? [1, 3, 5].map((i) => parseInt(lit.substr(i, 2), 16))
          : lit.match(/\d+/g).slice(0, 3).map(Number);
        const alpha = lit.startsWith("#") ? 1 : Number(lit.match(/[\d.]+/g).slice(-1)[0]);
        const lum = (0.2126 * nums[0] + 0.7152 * nums[1] + 0.0722 * nums[2]) / 255;
        return lum < 0.28 && alpha > 0.3;
      });
    expect(suspects).toEqual([]);
  });
});

describe("landing palette works in both modes", () => {
  // The design is dark-only: its aqua measures 1.4:1 on white, its lavender
  // greys 1.5–2:1. Light mode is therefore a designed palette rather than an
  // inversion, and these assert it is actually readable — the same guard the
  // app's own tokens get in contrast.test.js.
  const overrides = fs.readFileSync(
    path.resolve(__dirname, "landing.overrides.css"),
    "utf8",
  );

  /** Pulls a token's value out of a given rule block. */
  const tokensIn = (blockSelector) => {
    const start = overrides.indexOf(blockSelector);
    if (start === -1) return {};
    const open = overrides.indexOf("{", start);
    const close = overrides.indexOf("}", open);
    const out = {};
    for (const [, name, value] of overrides
      .slice(open, close)
      .matchAll(/(--l-[a-z0-9-]+):\s*([^;]+);/g)) {
      out[name] = value.trim();
    }
    return out;
  };

  const srgb = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = ([r, g, b]) =>
    0.2126 * srgb(r / 255) + 0.7152 * srgb(g / 255) + 0.0722 * srgb(b / 255);
  const parse = (v) =>
    v.startsWith("#")
      ? [1, 3, 5].map((i) => parseInt(v.substr(i, 2), 16))
      : v.match(/[\d.]+/g).slice(0, 3).map(Number);
  const alphaOf = (v) =>
    v.startsWith("rgba") ? Number(v.match(/[\d.]+/g).slice(-1)[0]) : 1;
  const over = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  const dark = tokensIn(".landing-root {");
  const light = tokensIn(':root[data-theme="light"] .landing-root {');

  test("both palettes define the same tokens", () => {
    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort());
  });

  test("dark mode still reproduces the design exactly", () => {
    // Regression guard: the whole point of tokenising was to add light mode
    // without changing how dark mode looks.
    expect(dark["--l-bg"]).toBe("#03051c");
    expect(dark["--l-text"]).toBe("#f7f8ff");
    expect(dark["--l-aqua"]).toBe("#78ebea");
    expect(dark["--l-ov"]).toBe("255, 255, 255");
  });

  describe.each([
    ["dark", () => dark],
    ["light", () => light],
  ])("%s", (_name, get) => {
    const surfaces = ["--l-bg", "--l-bg-2", "--l-bg-3"];
    const glass = ["--l-glass-1", "--l-nav-1", "--l-footer-1", "--l-float"];

    test.each(["--l-text", "--l-text-2", "--l-text-muted"])(
      "%s is readable on every page band",
      (textToken) => {
        const p = get();
        for (const surface of surfaces) {
          expect(ratio(parse(p[textToken]), parse(p[surface]))).toBeGreaterThanOrEqual(4.5);
        }
      },
    );

    test.each(["--l-aqua", "--l-violet", "--l-gold", "--l-rose"])(
      "%s is readable on every page band",
      (accent) => {
        const p = get();
        for (const surface of surfaces) {
          expect(ratio(parse(p[accent]), parse(p[surface]))).toBeGreaterThanOrEqual(4.5);
        }
      },
    );

    test("body text is readable on the glass surfaces", () => {
      const p = get();
      const page = parse(p["--l-bg"]);
      for (const fill of glass) {
        const composited = over(parse(p[fill]), alphaOf(p[fill]), page);
        expect(ratio(parse(p["--l-text"]), composited)).toBeGreaterThanOrEqual(4.5);
        expect(ratio(parse(p["--l-text-2"]), composited)).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  test("no literal colour outside the palette blocks", () => {
    // This is a real regression. A hardcoded navy gradient was added to
    // `.glass-nav` in this file to make the fixed header denser. Because
    // landing.overrides.css loads *after* landing.css, it silently beat the
    // tokens — and the header stayed dark navy in light mode while everything
    // around it turned light.
    //
    // The rule: colour belongs in the two palette blocks and nowhere else in
    // this file. Anything else re-hardcodes what the port just tokenised.
    const withoutComments = overrides.replace(/\/\*[\s\S]*?\*\//g, "");

    // Drop the palette blocks and the light-mode overrides that legitimately
    // restate colour (the `em` gradient, the app-window pin).
    const stripped = withoutComments
      .replace(/\.landing-root\s*\{[\s\S]*?\}/, "")
      .replace(/:root\[data-theme="light"\][^{]*\{[\s\S]*?\}/g, "");

    const literals = (
      stripped.match(/#[0-9a-fA-F]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g) || []
    ).filter((lit) => !lit.includes("var("));

    expect(literals).toEqual([]);
  });

  test("the overlay triplet inverts between modes", () => {
    // Borders and inner highlights all route through it, so if it fails to
    // flip, every hairline on the light page disappears at once.
    expect(dark["--l-ov"]).toBe("255, 255, 255");
    expect(light["--l-ov"]).not.toBe(dark["--l-ov"]);
    expect(lum(parse(light["--l-ov"]))).toBeLessThan(lum(parse(dark["--l-ov"])));
  });
});

describe("security claims match the implementation", () => {
  // A marketing page is the one place an inaccurate security claim does real
  // damage — a reader is entitled to take it literally when deciding what to
  // put in the product.
  //
  // These were each checked against the code before being written: BCrypt in
  // the Authentication service, Fernet in ai-core's crypto module, and the
  // `findByNoteIdAndOwnerUserId` scoping in the notes repository. The note
  // body was read straight out of Postgres to confirm it is stored as
  // readable text.
  const page = fs.readFileSync(path.resolve(__dirname, "LandingPage.jsx"), "utf8");
  const modal = fs.readFileSync(
    path.resolve(__dirname, "landingModalContent.js"),
    "utf8",
  );

  /** Strips comments, so a comment explaining a rejected claim is not read as making it. */
  const prose = (src) =>
    src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  test("neither surface claims end-to-end encryption", () => {
    // Note bodies are readable by the server by necessity — summarising and
    // searching them requires it. Claiming otherwise would be false.
    //
    // The distinction that matters is asserting it versus denying it. The
    // modal legitimately says "Notes are *not* end-to-end encrypted" and
    // "End-to-end encryption *would rule out* every AI feature" — both explain
    // its absence and must be allowed to stay. A bare mention is a claim.
    //
    // So rather than pattern-matching negation on one side, each occurrence is
    // checked in context: it has to sit near a cue that marks it as absent.
    const ABSENCE_CUES = /\b(not|would|cannot|does not|no)\b/i;

    // The hero bullets should not raise the subject at all.
    expect(prose(page)).not.toMatch(/end-to-end encrypt/i);

    const text = prose(modal).replace(/\s+/g, " ");
    const mentions = [...text.matchAll(/end-to-end encrypt\w*/gi)];
    expect(mentions.length).toBeGreaterThan(0); // it must be addressed, not dodged

    for (const m of mentions) {
      const context = text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60);
      expect(context).toMatch(ABSENCE_CUES);
    }

    for (const src of [prose(page), prose(modal)]) {
      expect(src).not.toMatch(/zero[- ]knowledge/i);
    }
  });

  test("the limits section exists and names the encryption trade-off", () => {
    // The heading lives in the shell; the content lives in the registry.
    const shell = fs.readFileSync(
      path.resolve(__dirname, "LandingModal.jsx"),
      "utf8",
    );
    expect(shell).toContain("What this does not do");
    // The comment explains it, but the *rendered* copy must say it too.
    expect(prose(modal)).toMatch(/not end-to-end encrypted/i);
  });

  test("no absolute guarantees", () => {
    // "Unhackable", "100% secure" and friends are claims nothing can support.
    for (const src of [prose(page), prose(modal)]) {
      expect(src).not.toMatch(/unhackable|100% secure|completely secure|impenetrable/i);
    }
  });

  test("the modal names mechanisms the code actually uses", () => {
    const text = prose(modal);
    expect(text).toMatch(/BCrypt/);
    expect(text).toMatch(/Fernet/);
    expect(text).toMatch(/HMAC-SHA256/);
    expect(text).toMatch(/TOTP/);
  });

  test("two-factor is not described as mandatory", () => {
    // It defaults to false on both signup paths — local and OAuth — so it is
    // opt-in. The design's card said "Mandatory two-factor authentication",
    // which would have been the second false claim on the page.
    const text = prose(page) + prose(modal);
    expect(text).not.toMatch(/mandatory two-factor/i);
    expect(text).not.toMatch(/two-factor is (?:required|enforced) on (?:all|every)/i);
    // And it must say so plainly somewhere.
    expect(prose(modal)).toMatch(/optional, not mandatory|off by default|switched off/i);
  });

  test("voice dictation discloses that audio leaves the device", () => {
    // Chrome's speech API streams audio to Google for transcription. For a
    // product sold on privacy, omitting that would be a meaningful silence.
    expect(prose(modal)).toMatch(/not done on your device|streams audio|passed through/i);
  });

  test("every feature card has a modal entry", () => {
    // A card that opens an empty dialog is worse than one that does nothing.
    // Read from the content config rather than the component: the cards are
    // data now, so that is where a new one would be added.
    const content = fs.readFileSync(
      path.resolve(__dirname, "landingContent.js"),
      "utf8",
    );
    const titles = [...content.matchAll(/^\s*title: "([^"]+)",$/gm)].map((m) => m[1]);
    expect(titles.length).toBeGreaterThanOrEqual(4);

    // Feature cards key straight into FEATURES; posts name theirs via `modal`.
    const modalKeys = [...modal.matchAll(/^\s*"([^"]+)": \{$/gm)].map((m) => m[1]);
    const postKeys = [...content.matchAll(/^\s*modal: "([^"]+)",$/gm)].map((m) => m[1]);

    for (const key of postKeys) {
      expect(modalKeys).toContain(key);
    }
    // The four feature cards must each resolve.
    for (const card of ["2FA Protection", "Voice Commands", "Role-Based Access", "Private & Secure"]) {
      expect(modalKeys).toContain(card);
    }
  });

  test("the nav links only to sections the page renders", () => {
    // Header and page read the same list, so this asserts the list is honoured
    // rather than that two hardcoded copies happen to agree.
    const content = fs.readFileSync(
      path.resolve(__dirname, "landingContent.js"),
      "utf8",
    );
    const ids = [...content.matchAll(/\{ id: "([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(["features", "security", "community", "posts"]);

    const carousel = fs.readFileSync(
      path.resolve(__dirname, "FeedbackCarousel.jsx"),
      "utf8",
    );
    const rendered = page + carousel;
    for (const id of ids) {
      expect(rendered).toContain(`id="${id}"`);
    }
  });

  test("each modal entry names its limits", () => {
    // The limits block is what makes the claims above worth reading, so no
    // entry is allowed to ship without one.
    const entries = [...modal.matchAll(/limits:\s*\[/g)];
    expect(entries.length).toBeGreaterThanOrEqual(5); // security + 4 cards
  });
});
