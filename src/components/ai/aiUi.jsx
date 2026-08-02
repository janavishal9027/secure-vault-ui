// Shared surfaces for the AI pages (knowledge graph, memory, transforms).
//
// These pages are new and there are three of them, so the alternative to a
// shared module is the same forty-line `sx` block copied nine times and
// drifting from the sixth copy onward. Everything here uses the existing CSS
// variables (`--surface`, `--text`, `--ov`) so both themes keep working.

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { glassCard } from "../theme/glass";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";

import ErrorBoundary from "../utils/ErrorBoundary";

export const surfaceSx = {
  p: 2.5,
  borderRadius: 2,
  background: "rgba(var(--ov),0.03)",
  border: "1px solid rgba(var(--ov),0.08)",
  boxShadow: "none",
};

export const subtleSx = {
  p: 1.75,
  borderRadius: 1.5,
  background: "rgba(var(--ov),0.02)",
  border: "1px solid rgba(var(--ov),0.06)",
  boxShadow: "none",
};

export const primaryButtonSx = {
  borderRadius: "999px",
  textTransform: "none",
  color: "var(--text)",
  backgroundColor: "rgba(99,102,241,0.35)",
  px: 2,
  "&:hover": { backgroundColor: "rgba(99,102,241,0.55)" },
  "&.Mui-disabled": {
    color: "var(--text-muted)",
    backgroundColor: "rgba(var(--ov),0.05)",
  },
};

export const dangerButtonSx = {
  ...primaryButtonSx,
  backgroundColor: "rgba(239,68,68,0.28)",
  "&:hover": { backgroundColor: "rgba(239,68,68,0.45)" },
};

export const quietButtonSx = {
  borderRadius: "999px",
  textTransform: "none",
  color: "rgba(var(--ov),0.75)",
  border: "1px solid rgba(var(--ov),0.14)",
  px: 2,
  "&:hover": { backgroundColor: "rgba(var(--ov),0.06)" },
};

export const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    background: "rgba(var(--ov),0.03)",
    color: "var(--text)",
    "& fieldset": { borderColor: "rgba(var(--ov),0.12)" },
    "&:hover fieldset": { borderColor: "rgba(var(--ov),0.22)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(99,102,241,0.6)" },
  },
  "& .MuiInputLabel-root": { color: "var(--text-muted)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "var(--accent-soft)" },
  "& .MuiFormHelperText-root": { color: "var(--text-muted)" },
};

/** Colour per entity type / memory kind, so a list is scannable by shape
 *  rather than only by reading every label. */
const PALETTE = {
  PERSON: "rgba(96,165,250,0.30)",
  ORGANIZATION: "rgba(45,212,191,0.28)",
  PROJECT: "rgba(129,140,248,0.32)",
  CONCEPT: "rgba(232,121,249,0.26)",
  TECHNOLOGY: "rgba(52,211,153,0.28)",
  PLACE: "rgba(251,191,36,0.26)",
  EVENT: "rgba(248,113,113,0.26)",
  DOCUMENT: "rgba(148,163,184,0.28)",
  PREFERENCE: "rgba(129,140,248,0.32)",
  FACT: "rgba(96,165,250,0.30)",
  GOAL: "rgba(52,211,153,0.28)",
  RELATIONSHIP: "rgba(45,212,191,0.28)",
  HABIT: "rgba(251,191,36,0.26)",
  PROJECT_STATE: "rgba(248,113,113,0.26)",
};

export const tintFor = (key) => PALETTE[key] || "rgba(var(--ov),0.12)";

export const TypeChip = ({ value, size = "small", ...rest }) => (
  <Chip
    size={size}
    label={String(value || "").replace(/_/g, " ").toLowerCase()}
    sx={{
      color: "var(--text)",
      backgroundColor: tintFor(value),
      fontWeight: 600,
      letterSpacing: 0.2,
      textTransform: "capitalize",
    }}
    {...rest}
  />
);

/** The page shell every AI page shares: gradient background, back link,
 *  titled card. */
export const AiPageShell = ({
  icon,
  title,
  subtitle,
  actions,
  maxWidth = "lg",
  backTo = "/dashboard",
  backLabel = "Back to dashboard",
  children,
}) => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(91, 100, 255, 0.12), transparent 22%), var(--bg)",
        py: 6,
        color: "var(--text)",
      }}
    >
      <Container maxWidth={maxWidth}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate(backTo)}
          sx={{ color: "var(--text-2)", textTransform: "none", mb: 2 }}
        >
          {backLabel}
        </Button>

        <Paper
          elevation={20}
          sx={{
            ...glassCard({ radius: 4 }),
            p: { xs: 2.5, md: 4 },
            color: "var(--text)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ mb: 1 }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              {icon}
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            {actions}
          </Stack>

          {subtitle && (
            <Typography
              variant="body2"
              sx={{ color: "rgba(var(--ov),0.6)", mb: 3, maxWidth: 780 }}
            >
              {subtitle}
            </Typography>
          )}

          {/* Inner boundary: a render bug in one of these pages shows a panel
              inside its own shell, with the title and the way back still
              working, instead of escalating to the app-level boundary and
              replacing the whole screen. */}
          <ErrorBoundary compact title={`${title} could not be displayed`}>
            {children}
          </ErrorBoundary>
        </Paper>
      </Container>
    </Box>
  );
};

/** One consistent empty state. `hint` explains what would make it non-empty,
 *  because "nothing here" without a reason reads as a broken screen. */
export const EmptyState = ({ title, hint }) => (
  <Paper sx={{ ...subtleSx, textAlign: "center", py: 4 }}>
    <Typography sx={{ color: "rgba(var(--ov),0.6)", fontWeight: 600 }}>
      {title}
    </Typography>
    {hint && (
      <Typography
        sx={{ mt: 0.75, fontSize: "0.85rem", color: "var(--text-muted)" }}
      >
        {hint}
      </Typography>
    )}
  </Paper>
);

export const Loading = ({ label = "Loading…" }) => (
  <Stack alignItems="center" spacing={1.5} sx={{ py: 5 }}>
    <CircularProgress size={26} sx={{ color: "var(--accent-soft)" }} />
    <Typography sx={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
      {label}
    </Typography>
  </Stack>
);

/** A labelled number. Used across all three pages for headline stats. */
export const StatTile = ({ label, value, hint, tone }) => (
  <Paper
    sx={{
      ...subtleSx,
      flex: "1 1 150px",
      minWidth: 140,
      borderColor: tone ? "rgba(99,102,241,0.35)" : "rgba(var(--ov),0.06)",
    }}
  >
    <Typography
      sx={{
        fontSize: "0.72rem",
        textTransform: "uppercase",
        letterSpacing: 0.6,
        color: "var(--text-muted)",
      }}
    >
      {label}
    </Typography>
    <Typography sx={{ fontWeight: 700, fontSize: 24, mt: 0.25 }}>
      {value}
    </Typography>
    {hint && (
      <Typography sx={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
        {hint}
      </Typography>
    )}
  </Paper>
);

/** An explanatory note. These pages surface machinery most products hide, and
 *  a number without its meaning is worse than no number. */
export const Explain = ({ children }) => (
  <Typography
    sx={{
      fontSize: "0.78rem",
      color: "var(--text-muted)",
      lineHeight: 1.6,
      mt: 1,
    }}
  >
    {children}
  </Typography>
);

export const ErrorNote = ({ children }) =>
  children ? (
    <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,138,128,0.95)", mt: 1 }}>
      {children}
    </Typography>
  ) : null;

export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

export const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

/** Micro-USD is what the ledger stores; nobody wants to read it. */
export const formatMicros = (micros) => {
  const value = Number(micros || 0) / 1_000_000;
  if (value === 0) return "$0.00";
  return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
};
