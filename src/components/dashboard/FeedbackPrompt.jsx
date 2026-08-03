import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  IconButton,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";

import {
  getMyFeedbackStatusService,
  submitFeedbackService,
} from "../store/services/FeedbackService";
import { useMyProfile } from "../store/useMyProfile";
import { glassCard } from "../theme/glass";

/**
 * Asks each person for feedback once, and then never again.
 *
 * "Once" is enforced by the server — a unique constraint on the account id, so
 * a second submission fails at the database rather than relying on the browser
 * to remember. This component only decides *when* to ask.
 *
 * Two rules about when:
 *
 *  - Not immediately. Someone who signed in ten seconds ago has no opinion
 *    worth recording, and being asked before you have used anything is the
 *    thing that makes feedback prompts feel like nagging.
 *  - Dismissable without answering, and the dismissal is remembered locally so
 *    the same session does not ask twice. The server is still the authority on
 *    whether they ever answered.
 */

const DISMISS_KEY = "FEEDBACK_PROMPT_DISMISSED";
/** How long after mount before asking. Long enough to have done something. */
const ASK_AFTER_MS = 90_000;

export default function FeedbackPrompt() {
  const profile = useMyProfile();
  const [open, setOpen] = useState(false);
  const [eligible, setEligible] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Ask the server whether this account has already answered.
  useEffect(() => {
    if (!localStorage.getItem("JWT_TOKEN")) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch (_) {
      // storage unavailable — treat as not dismissed
    }
    if (dismissed) return;

    let cancelled = false;
    getMyFeedbackStatusService()
      .then((res) => {
        if (!cancelled && res.data?.data?.submitted === false) setEligible(true);
      })
      .catch(() => {
        // Never block the app on this. If we cannot tell, we do not ask.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!eligible) return undefined;
    const timer = setTimeout(() => setOpen(true), ASK_AFTER_MS);
    return () => clearTimeout(timer);
  }, [eligible]);

  useEffect(() => {
    if (profile?.displayName || profile?.username) {
      setDisplayName(profile.displayName || profile.username);
    }
  }, [profile]);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch (_) {
      // ignore
    }
  }, []);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError("Please write a few words.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitFeedbackService({
        displayName: displayName.trim() || "Anonymous",
        roleTitle: roleTitle.trim(),
        rating,
        comment: comment.trim(),
      });
      setDone(true);
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch (_) {
        // ignore
      }
      setTimeout(() => setOpen(false), 1800);
    } catch (err) {
      // 409 means they already answered — from another tab, most likely.
      setError(
        err?.response?.status === 409
          ? "You have already shared your feedback. Thank you!"
          : err?.response?.data?.message || "Could not send your feedback.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={dismiss}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { ...glassCard({ radius: 3 }), p: 0 } } }}
    >
      <Box sx={{ p: 3 }}>
        {done ? (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 3 }}>
            <FavoriteRoundedIcon sx={{ color: "var(--danger)", fontSize: 34 }} />
            <Typography sx={{ fontWeight: 700, color: "var(--text)" }}>
              Thank you.
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--text-2)", textAlign: "center" }}
            >
              We only ask once, so that is the last you will hear of this.
            </Typography>
          </Stack>
        ) : (
          <>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text)" }}>
                How is it going?
              </Typography>
              <IconButton onClick={dismiss} size="small" aria-label="Not now">
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Typography variant="body2" sx={{ color: "var(--text-2)", mb: 2.5 }}>
              We ask once, and only once. If you would rather not, close this and
              it will not come back.
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "var(--text-muted)", display: "block", mb: 0.5 }}
                >
                  Overall
                </Typography>
                <Rating
                  value={rating}
                  onChange={(_, v) => setRating(v || 1)}
                  sx={{ "& .MuiRating-iconFilled": { color: "var(--warning)" } }}
                />
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="In your words"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                inputProps={{ maxLength: 400 }}
                helperText={`${comment.length}/400`}
              />

              <TextField
                fullWidth
                size="small"
                label="Name to show"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                inputProps={{ maxLength: 80 }}
              />

              <TextField
                fullWidth
                size="small"
                label="What you do (optional)"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                inputProps={{ maxLength: 80 }}
                placeholder="Product designer"
              />

              {/* Stated before they write, not after they submit. Publishing
                  someone's words without telling them first is the part that
                  would be wrong, and it costs one sentence to avoid. */}
              <Alert
                severity="info"
                sx={{
                  background: "rgba(var(--ov),0.05)",
                  color: "var(--text-2)",
                  border: "1px solid rgba(var(--ov),0.10)",
                  "& .MuiAlert-icon": { color: "var(--info)" },
                }}
              >
                Your words and the name above may be shown publicly on our
                landing page. Your email and account are never included.
              </Alert>

              {error && (
                <Typography sx={{ color: "var(--danger)", fontSize: 13 }}>
                  {error}
                </Typography>
              )}

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={submitting}
                  sx={{ borderRadius: 999, textTransform: "none", px: 3 }}
                >
                  {submitting ? "Sending…" : "Send feedback"}
                </Button>
                <Button
                  onClick={dismiss}
                  sx={{ textTransform: "none", color: "var(--text-2)" }}
                >
                  Not now
                </Button>
              </Stack>
            </Stack>
          </>
        )}
      </Box>
    </Dialog>
  );
}
