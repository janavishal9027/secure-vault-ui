// A render error must not blank the whole app.
//
// Every service call in this app is wrapped — a failed request produces a
// toast or an inline message. A bug in a component's *render* path was not
// handled at all, and React's default for an uncaught render error is to
// unmount the whole tree: a blank white page with no explanation and no way
// back except a manual reload.
//
// Two levels are used. One boundary around the router keeps the app alive if
// anything at all throws; a boundary per AI page means a broken graph view
// does not take the dashboard with it. The inner one catches first, so the
// blast radius is a panel rather than the product.
//
// Error boundaries only catch errors thrown during render, in lifecycle
// methods, and in constructors below them. They do NOT catch errors in event
// handlers, async callbacks or `setTimeout` — those still need try/catch at
// the call site, which is what the service layer already does.

import { Component } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Logged rather than reported: there is no error-reporting service wired
    // up, and inventing one here would be a silent network call to somewhere
    // the user never agreed to.
    console.error("Render error caught by boundary:", error, info?.componentStack);
  }

  handleRetry = () => {
    // Clearing the error re-renders the subtree. Enough for a transient
    // failure — a bad response shape that has since been refetched — and
    // harmless when it is not, because the boundary catches again.
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, title, compact } = this.props;

    if (!error) return children;

    const body = (
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          background: "rgba(var(--ov),0.03)",
          border: "1px solid rgba(239,68,68,0.3)",
          boxShadow: "none",
          color: "var(--text)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <ReportProblemRoundedIcon sx={{ color: "var(--danger)" }} />
          <Typography sx={{ fontWeight: 700 }}>
            {title || "This part of the page stopped working"}
          </Typography>
        </Stack>

        <Typography sx={{ fontSize: "0.9rem", color: "rgba(var(--ov),0.65)", mb: 2 }}>
          Something went wrong while displaying this. Your notes are not
          affected — nothing here writes data.
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<RefreshRoundedIcon />}
            onClick={this.handleRetry}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              color: "var(--text)",
              backgroundColor: "rgba(99,102,241,0.35)",
              px: 2,
              "&:hover": { backgroundColor: "rgba(99,102,241,0.55)" },
            }}
          >
            Try again
          </Button>
          {!compact && (
            <Button
              size="small"
              onClick={() => window.location.assign("/dashboard")}
              sx={{
                borderRadius: "999px",
                textTransform: "none",
                color: "rgba(var(--ov),0.75)",
                border: "1px solid rgba(var(--ov),0.14)",
                px: 2,
              }}
            >
              Back to dashboard
            </Button>
          )}
        </Stack>

        {process.env.NODE_ENV === "development" && (
          <Typography
            component="pre"
            sx={{
              mt: 2,
              p: 1.5,
              fontSize: "0.72rem",
              whiteSpace: "pre-wrap",
              color: "rgba(255,138,128,0.9)",
              background: "rgba(var(--ov),0.04)",
              borderRadius: 1,
            }}
          >
            {String(error?.stack || error)}
          </Typography>
        )}
      </Paper>
    );

    // Compact boundaries sit inside an existing page shell, so they render
    // bare. The top-level one owns the whole viewport and centres itself.
    if (compact) return body;

    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Box sx={{ maxWidth: 560, width: "100%" }}>{body}</Box>
      </Box>
    );
  }
}
