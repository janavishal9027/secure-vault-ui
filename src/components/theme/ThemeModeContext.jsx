import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

import { ACCENT, paletteFor } from "./palette";
import { glassSurface } from "./glass";

const STORAGE_KEY = "THEME_MODE";

const ThemeModeContext = createContext({
  mode: "dark",
  toggleMode: () => {},
  setMode: () => {},
});

const getInitialMode = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch (_) {
    // localStorage unavailable — fall through
  }
  return "dark";
};

/** Build the MUI theme for a mode from the same palette the CSS uses.
 *
 *  This is what was missing. Setting `data-theme` flips the CSS custom
 *  properties, so anything with an explicit `sx` colour followed the mode — but
 *  MUI knew nothing about it and kept using its default *light* palette. Every
 *  piece of text we did not colour by hand (`Typography` with no `sx`,
 *  `color="text.secondary"`, input labels, helper text, menu items, disabled
 *  states) therefore rendered near-black, on a near-black background, in dark
 *  mode. */
const buildTheme = (mode) => {
  const colours = paletteFor(mode);

  return createTheme({
    palette: {
      mode,
      primary: { main: ACCENT.main, light: ACCENT.light, dark: ACCENT.dark },
      background: { default: colours.bg, paper: colours.surface },
      text: {
        primary: colours.text,
        secondary: colours.text2,
        disabled: colours.textMuted,
      },
      // Status colours, so a `color="success"` icon or an <Alert> is legible
      // on the surface it actually sits on. MUI's defaults are one pair of
      // values for both modes.
      success: { main: colours.success },
      warning: { main: colours.warning },
      error: { main: colours.danger },
      info: { main: colours.info },
      // `action.active` is what every uncoloured IconButton and SvgIcon
      // resolves to. MUI's dark default is pure #fff, which is heavier than
      // anything else on the page; `disabled` matters more — the default is a
      // 26%-alpha wash that disappears against either background.
      action: {
        active: colours.icon,
        disabled: `rgba(${colours.overlay}, 0.38)`,
        disabledBackground: `rgba(${colours.overlay}, 0.10)`,
      },
      divider: `rgba(${colours.overlay}, 0.12)`,
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      // Paper's default `backgroundImage` is an elevation overlay that MUI
      // paints on top of `background.paper` in dark mode. Every surface in
      // this app sets its own background, so the overlay only ever muddies
      // them.
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      // ===== Glass =====
      //
      // Applied here rather than per component, so every floating surface in
      // the app frosts identically and a new dialog inherits it without anyone
      // remembering to. The rule is "things that float": overlays and raised
      // panels get glass, flat in-page panels do not — see theme/glass.js for
      // why that line is drawn where it is.
      MuiDialog: {
        styleOverrides: {
          paper: { ...glassSurface, borderRadius: 16 },
        },
      },
      MuiPopover: {
        styleOverrides: { paper: { ...glassSurface, borderRadius: 12 } },
      },
      MuiMenu: {
        styleOverrides: { paper: { ...glassSurface, borderRadius: 12 } },
      },
      MuiDrawer: {
        styleOverrides: { paper: { ...glassSurface, borderRadius: 0 } },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            ...glassSurface,
            borderRadius: 0,
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
            boxShadow: "none",
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            // Deliberately NOT glass. A tooltip is small, appears over
            // arbitrary content, and is often a single line — frosting it puts
            // whatever it happens to be covering directly behind its text.
            // Opaque is the readable choice here.
            backgroundColor: colours.surface2,
            color: colours.text,
            border: `1px solid rgba(${colours.overlay}, 0.12)`,
            fontSize: "0.78rem",
          },
          arrow: { color: colours.surface2 },
        },
      },
      // Placeholders inherit `color` at 42% opacity by default, which is
      // legible on white and not on a dark surface.
      MuiInputBase: {
        styleOverrides: {
          input: {
            "&::placeholder": { color: colours.textMuted, opacity: 1 },
          },
        },
      },
    },
  });
};

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);

  // Reflect the mode on <html data-theme> so the CSS variables in index.css
  // switch, and persist the choice. `color-scheme` is set alongside it so the
  // browser's own chrome — scrollbars, form controls, autofill — follows too,
  // which is otherwise the one part of the page that stays light in dark mode.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    document.documentElement.style.colorScheme = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (_) {
      // ignore persistence errors
    }
  }, [mode]);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((m) => (m === "dark" ? "light" : "dark")),
    }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {/* Applies background.default and text.primary to <body>, so a page
            that renders before its own styles still shows readable text. */}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeModeContext);
