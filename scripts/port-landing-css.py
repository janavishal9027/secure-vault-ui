"""Ports the Figma Make landing stylesheet into the app.

Run from the frontend root:

    python scripts/port-landing-css.py

Two transformations, both of which exist because the design was authored as a
standalone dark-only Vite app:

1. **Scoping.** The source styles `:root`, `html`, `body`, `main` and bare
   `h1`/`h2`/`h3`/`p`/`button`/`a`/`blockquote`. Dropped into this app
   unscoped, those would restyle the dashboard, the note editor and every
   dialog. Everything is prefixed with `.landing-root`; the four
   document-level selectors are rewritten to target that wrapper.

2. **Theming.** The design hardcodes 132 colour literals, all chosen against a
   near-black navy. They are rewritten to `var(--l-*)` tokens so the page can
   follow the app's light/dark mode. `landing.overrides.css` defines the two
   sets of values; the dark set reproduces the design exactly.

Regenerating is safe: this writes only `landing.css`. Hand-written adjustments
live in `landing.overrides.css`, which is never touched.
"""

import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.dirname(HERE)
SRC = os.path.join(FRONTEND, "..", "..", "landingpage", "BuildLandingPage", "src", "index.css")
DST = os.path.join(FRONTEND, "src", "components", "landing", "landing.css")
ROOT = ".landing-root"

# --------------------------------------------------------------------------
# Colour map
#
# Grouped by the role each literal plays, not by its hue — the same lavender
# grey is body text in one rule and a border in another, and only the role
# tells you what it should become in light mode.
#
# Deliberately NOT mapped (see below): colours that sit on the violet-to-aqua
# gradient, which is identical in both themes, so text on it must stay dark.
# --------------------------------------------------------------------------

TEXT_PRIMARY = ["#f7f8ff", "#fbfbff", "#fff", "#ffffff", "#ebedff", "#e9ebfb", "#e4e6f7", "#d8dcf2"]
TEXT_SECONDARY = [
    "#b8bdd6", "#b9bed7", "#b4bed7", "#bcbfda", "#adb1cc", "#aeb2cf", "#aeb4d0",
    "#a9afca", "#a9afce", "#a0a6c3", "#a6abc7", "#a6acc7", "#a6acce", "#9ea5c0",
    "#9ea3c3", "#d4fffb",
]
TEXT_MUTED = ["#8389aa", "#8b91b4", "#8f94b7", "#9096b6", "#969dbd", "#706c9e"]

BACKGROUNDS = {
    "#03051c": "--l-bg",
    "#0a0d3d": "--l-bg-2",
    "#060829": "--l-bg-3",
    "#111443": "--l-surface-solid",
    "#070923": "--l-bg",
}

AQUA = [
    "#57dfd8", "#58e4dc", "#59dfe0", "#59e6dd", "#5ce0d7", "#5eece5", "#62dfdc",
    "#67e7dc", "#67e8c8", "#68e5db", "#68e9df", "#69e7df", "#70ece3", "#71e8df",
    "#77e8df", "#78ebea", "#7fe8df", "#8aeee6", "#92ece5",
]
VIOLET = [
    "#8074fd", "#8178f5", "#8a7bff", "#9b8cff", "#9b92fc", "#9c96ff", "#a79cff",
    "#a89eff", "#bdb6ff",
]
GOLD = ["#ffc75b", "#ffd26f"]
ROSE = ["#ff8aa0"]

# On the violet-to-aqua gradient, which is identical in both themes — so text
# and icons sitting on it must stay dark.
KEEP = {"#071126", "#08102e"}

# The translucent navy fills. These are what make the design read as glass over
# a dark page, and they are the one group that cannot survive light mode: a 55%
# navy panel on a white background is a dark blot, not frosted glass.
#
# Each gets its own token so light mode can tune the pair per surface rather
# than flattening them all to one grey. The two `.app-window` fills and the
# recording strip are absent on purpose — see MOCK_FILLS.
GLASS_FILLS = {
    "rgba(30,34,90,.55)": "--l-glass-1",     # .glass, first stop
    "rgba(13,16,60,.47)": "--l-glass-2",     # .glass, second stop
    "rgba(17,21,68,.72)": "--l-nav-1",       # .glass-nav
    "rgba(19,25,71,.44)": "--l-nav-2",
    "rgba(38,43,100,.4)": "--l-footer-1",    # .glass-footer
    "rgba(13,17,57,.6)": "--l-footer-2",
    "rgba(43,41,113,.5)": "--l-panel-1",     # .role-art
    "rgba(6,9,36,.35)": "--l-panel-2",
    "rgba(16,44,84,.9)": "--l-voice-1",      # .voice
    "rgba(12,16,54,.75)": "--l-voice-2",
    "rgba(18,23,71,.82)": "--l-float",       # .role-float chips
}

# The hero's app-window mockup depicts a screen. Product shots do not follow
# the page theme — a screenshot that inverts with the site stops looking like a
# screenshot — so these stay dark in both modes, and their internal contrast
# stays exactly as designed.
MOCK_FILLS = {"rgba(25,28,84,.88)", "rgba(8,11,46,.84)", "rgba(1,5,28,.48)",
              "rgba(79,72,163,.16)"}


def build_map():
    m = {}
    for lit in TEXT_PRIMARY:
        m[lit] = "var(--l-text)"
    for lit in TEXT_SECONDARY:
        m[lit] = "var(--l-text-2)"
    for lit in TEXT_MUTED:
        m[lit] = "var(--l-text-muted)"
    for lit, token in BACKGROUNDS.items():
        m[lit] = f"var({token})"
    for lit in AQUA:
        m[lit] = "var(--l-aqua)"
    for lit in VIOLET:
        m[lit] = "var(--l-violet)"
    for lit in GOLD:
        m[lit] = "var(--l-gold)"
    for lit in ROSE:
        m[lit] = "var(--l-rose)"
    for lit in KEEP:
        m.pop(lit, None)
    return m


COLOUR_MAP = build_map()


def apply_colours(css):
    """Rewrites literals to tokens. Longest-first so #fff never eats #fff8ff."""
    # Glass fills before the generic rules, since they are exact strings.
    for lit, token in GLASS_FILLS.items():
        css = css.replace(lit, f"var({token})")

    for lit in sorted(COLOUR_MAP, key=len, reverse=True):
        if lit in KEEP:
            continue
        css = re.sub(re.escape(lit) + r"\b", COLOUR_MAP[lit], css, flags=re.I)

    # White overlays are borders, hairlines and inner highlights. Routed through
    # the overlay triplet so they invert with the theme — white-on-dark becomes
    # slate-on-light from one expression, the same trick the app already uses.
    css = re.sub(r"rgba\(255,\s*255,\s*255,\s*([\d.]+)\)", r"rgba(var(--l-ov),\1)", css)

    # The pale-lavender borders are the same thing wearing a tint: they are the
    # glass panels' edges, and at 12-20% alpha the hue is imperceptible — what
    # reads is "slightly lighter than the surface". On a light page that is
    # invisible, so they invert alongside the white ones.
    for lavender in ("190,198,255", "190,201,255", "202,208,255", "213,218,255"):
        css = re.sub(
            r"rgba\(" + lavender.replace(",", r",\s*") + r",\s*([\d.]+)\)",
            r"rgba(var(--l-ov),\1)",
            css,
        )

    # Shadows: black is right on a dark page and reads as dirt on a light one.
    css = re.sub(r"rgba\(0,\s*0,\s*0,\s*([\d.]+)\)", r"rgba(var(--l-shadow),\1)", css)
    return css


def scope_selector(sel):
    out = []
    for part in sel.split(","):
        p = " ".join(part.split())
        if not p:
            continue
        out.append(
            ROOT if p in (":root", "html", "body", "main")
            else p if p.startswith(ROOT)
            else f"{ROOT} {p}"
        )
    return ", ".join(out)


def scope_block(text):
    res, i, n = [], 0, len(text)
    while i < n:
        at, brace = text.find("@media", i), text.find("{", i)
        if brace == -1:
            break
        if at != -1 and at < brace:
            open_b = text.find("{", at)
            depth, j = 1, open_b + 1
            while j < n and depth:
                depth += (text[j] == "{") - (text[j] == "}")
                j += 1
            res.append(text[at:open_b + 1] + "\n")
            res.append(scope_block(text[open_b + 1:j - 1]))
            res.append("}\n")
            i = j
            continue
        close = text.find("}", brace)
        res.append(scope_selector(text[i:brace]) + "{" + text[brace + 1:close] + "}\n")
        i = close + 1
    return "".join(res)


HEADER = """/* GENERATED — do not edit. Run scripts/port-landing-css.py to rebuild.
 *
 * Ported from the Figma Make export
 * (landingpage/BuildLandingPage/src/index.css) with two transformations:
 *
 *  - Every selector is scoped under `.landing-root`, so the design's
 *    document-level and bare-element rules cannot reach the rest of the app.
 *  - Colour literals are rewritten to `var(--l-*)` tokens, so the page follows
 *    light/dark mode. `landing.overrides.css` holds both sets of values.
 *
 * Hand-written adjustments belong in landing.overrides.css, which this script
 * never touches.
 */
"""


def main():
    css = io.open(SRC, encoding="utf-8").read()
    css = re.sub(r"/\*[\s\S]*?\*/", "", css)  # comments first, or they land in selectors

    import_re = re.compile(r"@import\s+(?:url\([^)]*\)|'[^']*'|\"[^\"]*\")\s*;")
    fonts = [m.group(0) for m in import_re.finditer(css) if "tailwind" not in m.group(0)]
    css = import_re.sub("", css)

    css = apply_colours(css)
    scoped = scope_block(css)

    io.open(DST, "w", encoding="utf-8").write(
        HEADER + "\n".join(fonts) + "\n\n" + scoped.strip() + "\n"
    )

    body = re.sub(r"/\*[\s\S]*?\*/", "", io.open(DST, encoding="utf-8").read())

    # What survives on purpose: the gradient pair, the mock window's fills, and
    # low-alpha accent tints — a 15% aqua wash reads correctly over a light
    # surface as well as a dark one, so forcing it through a token would be
    # churn for no gain.
    #
    # What must NOT survive is any *opaque or near-opaque dark* colour, since
    # that is a surface, and a dark surface is exactly what light mode has to
    # replace. That is what this checks.
    allowed = {k.lower() for k in KEEP} | {m.lower() for m in MOCK_FILLS}
    offenders = []
    for lit in sorted(set(re.findall(
            r"#[0-9a-fA-F]{6}|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\)", body))):
        norm = lit.replace(" ", "").lower()
        if norm in allowed:
            continue
        nums = [int(x) for x in re.findall(r"\d+", lit)[:3]] if lit.startswith("rgba") \
            else [int(lit[i:i + 2], 16) for i in (1, 3, 5)]
        alpha = float(re.findall(r"[\d.]+", lit)[-1]) if lit.startswith("rgba") else 1.0
        luminance = (0.2126 * nums[0] + 0.7152 * nums[1] + 0.0722 * nums[2]) / 255
        if luminance < 0.28 and alpha > 0.30:
            offenders.append(f"{lit}  (lum {luminance:.2f}, alpha {alpha})")

    print(f"wrote {os.path.relpath(DST, FRONTEND)}")
    print(f"  media queries   : {body.count('@media')}")
    print(f"  tokens used     : {len(set(re.findall(r'--l-[a-z0-9-]+', body)))}")
    print(f"  dark surfaces left unmapped: {len(offenders)}")
    for c in offenders:
        print(f"    !! {c}")
    return 1 if offenders else 0


if __name__ == "__main__":
    sys.exit(main())
