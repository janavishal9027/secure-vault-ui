import { Box, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";

import { glassCard, glassInset } from "../theme/glass";
import { useThemeMode } from "../theme/ThemeModeContext";

// The shared frame for Login and Register.
//
// Adapted from a Tailwind reference design (centred glass card, logo mark,
// stacked pill inputs, full-width pill actions). Two things about that
// reference did not survive the port, both deliberately:
//
//  1. It was hardcoded dark — `bg-[#121212]`, `text-white`, `bg-white/10`,
//     `text-gray-300`. Every one of those is re-expressed here as a theme
//     token, because a login screen that ignores the mode is the first thing a
//     light-mode user sees.
//  2. Its "glass" effect came from white at low alpha over near-black. The
//     same trick inverts correctly through `--ov`, so the card reads as
//     frosted in both themes rather than as a grey smear on white.
//
// Everything below is layout and surface only. Neither page's behaviour lives
// here — they pass their own form in as children.

/** The card's frosted surface, in whichever direction the theme runs. */
const cardSx = {
  ...glassCard({ radius: "24px" }),
  zIndex: 1,
  width: "100%",
  p: { xs: 3, sm: 4 },
  color: "var(--text)",
  boxShadow: "var(--shadow-card)",
};

/**
 * Input styling shared by every field on both pages.
 *
 * Spread into a `TextField`'s `sx`. Kept here rather than repeated per field so
 * the two pages cannot drift, and so the focus ring is defined once — the
 * reference used `focus:ring-2 focus:ring-gray-400`, which is a fixed grey that
 * would disappear against one of the two backgrounds.
 */
export const authFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    ...glassInset,
    color: "var(--text)",
    transition: "background-color 0.18s ease, box-shadow 0.18s ease",
    "& fieldset": { borderColor: "rgba(var(--ov),0.12)" },
    "&:hover": { backgroundColor: "rgba(var(--ov),0.08)" },
    "&:hover fieldset": { borderColor: "rgba(var(--ov),0.20)" },
    "&.Mui-focused": { backgroundColor: "rgba(var(--ov),0.08)" },
    "&.Mui-focused fieldset": {
      borderColor: "var(--accent)",
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputLabel-root": { color: "var(--text-muted)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "var(--accent-soft)" },
  "& .MuiInputAdornment-root .MuiSvgIcon-root": { color: "var(--icon-muted)" },
};

/** The primary action. A filled accent pill — legible in both themes because
 *  its contrast comes from the accent, not from the surrounding surface. */
export const authPrimaryButtonSx = {
  width: "100%",
  borderRadius: "999px",
  py: 1.35,
  fontSize: "0.95rem",
  fontWeight: 600,
  textTransform: "none",
  // The darker accent rather than `--accent`. White on #6366f1 measures
  // 4.47:1, which misses AA for a 15px semibold label; #4f46e5 gives 6.29:1
  // for no visible change in hue.
  backgroundColor: "#4f46e5",
  color: "#ffffff",
  boxShadow: "0 8px 24px rgba(79,70,229,0.35)",
  "&:hover": {
    backgroundColor: "#4338ca",
    boxShadow: "0 10px 28px rgba(79,70,229,0.45)",
  },
  "&.Mui-disabled": {
    backgroundColor: "rgba(var(--ov),0.12)",
    color: "var(--text-muted)",
    boxShadow: "none",
  },
};

/** A provider button. Reads as a raised surface rather than a brand colour, so
 *  Google and GitHub sit together without one shouting. */
export const authProviderButtonSx = {
  flex: 1,
  borderRadius: "999px",
  py: 1.15,
  fontSize: "0.875rem",
  fontWeight: 600,
  textTransform: "none",
  color: "var(--text)",
  backgroundColor: "rgba(var(--ov),0.05)",
  border: "1px solid rgba(var(--ov),0.12)",
  boxShadow: "none",
  "& .MuiSvgIcon-root": { color: "var(--icon)" },
  "&:hover": {
    backgroundColor: "rgba(var(--ov),0.10)",
    borderColor: "rgba(var(--ov),0.20)",
    boxShadow: "none",
  },
};

/** A quiet rule. The reference used `hr` at 10% opacity; `--ov` keeps that
 *  weight in both directions instead of only over black. */
export const AuthDivider = ({ label, sx }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ my: 2.5, ...sx }}>
    <Box sx={{ flex: 1, height: "1px", background: "rgba(var(--ov),0.12)" }} />
    {label && (
      <Typography sx={{ fontSize: 12, color: "var(--text-muted)", userSelect: "none" }}>
        {label}
      </Typography>
    )}
    <Box sx={{ flex: 1, height: "1px", background: "rgba(var(--ov),0.12)" }} />
  </Stack>
);

/** Inline form-level error. `--danger` rather than a fixed red-400, which
 *  measures 1.90:1 on a light surface. */
export const AuthError = ({ children }) =>
  children ? (
    <Typography
      role="alert"
      sx={{ fontSize: 13, color: "var(--danger)", mt: 0.5, mb: 0.5 }}
    >
      {children}
    </Typography>
  ) : null;

const AuthShell = ({ title, subtitle, children, footer, maxWidth = 440 }) => {
  const { mode, toggleMode } = useThemeMode();

  return (
  <Box
    sx={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      px: 2,
      py: { xs: 4, sm: 6 },
      position: "relative",
      overflow: "hidden",
      // The reference put a flat #121212 behind the card. This keeps the same
      // "lit from off-screen" feel using the accent, over the theme's own
      // background, so it works in both modes.
      background: `
        radial-gradient(circle at 18% 18%, rgba(99,102,241,0.16), transparent 26%),
        radial-gradient(circle at 82% 78%, rgba(45,212,191,0.10), transparent 24%),
        var(--bg)
      `,
    }}
  >
    {/* Someone who arrives straight at /login — from a bookmark, an email, or
        a session-expiry redirect — never passes the landing page or the
        dashboard, which are the app's other two toggles. Without this, the
        mode they get is whatever was last stored, with no way to change it. */}
    <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
      <IconButton
        onClick={toggleMode}
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        sx={{
          position: "absolute",
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 2,
          color: "var(--icon-muted)",
          border: "1px solid rgba(var(--ov),0.14)",
          background: "rgba(var(--ov),0.04)",
          "&:hover": { color: "var(--text)", background: "rgba(var(--ov),0.09)" },
        }}
        size="small"
      >
        {mode === "dark" ? (
          <LightModeRoundedIcon fontSize="small" />
        ) : (
          <DarkModeRoundedIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>

    <Paper elevation={0} sx={{ ...cardSx, maxWidth }}>
      <Stack alignItems="center" sx={{ mb: 3 }}>
        {/* Logo mark. The reference pulled a remote logo over http; this is the
            app's own icon, already shipped as the favicon and PWA icon. */}
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            background: "rgba(var(--ov),0.08)",
            border: "1px solid rgba(var(--ov),0.12)",
            boxShadow: "none",
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src="/icon.png"
            alt=""
            sx={{ width: 30, height: 30, objectFit: "contain" }}
          />
        </Box>

        <Typography
          variant="h5"
          align="center"
          sx={{ fontWeight: 700, color: "var(--text)", letterSpacing: -0.2 }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            align="center"
            sx={{ mt: 0.75, fontSize: 14, color: "var(--text-2)" }}
          >
            {subtitle}
          </Typography>
        )}
      </Stack>

      {children}
    </Paper>

    {footer && (
      <Box sx={{ position: "relative", zIndex: 1, mt: 3, textAlign: "center" }}>
        {footer}
      </Box>
    )}
  </Box>
  );
};

export default AuthShell;
