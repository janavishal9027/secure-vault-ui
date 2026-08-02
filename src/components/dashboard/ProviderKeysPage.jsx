import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  IconButton,
  Link,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { glassCard } from "../theme/glass";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import {
  addProviderKeyService,
  checkProviderKeyService,
  deleteProviderKeyService,
  listProviderKeysService,
  modelChainService,
  setPremiumModelsService,
} from "../store/services/ProviderKeysService";
import { describeAiError } from "../utils/aiErrors";
import { prettyModel } from "../utils/aiModels";

const GROQ_CONSOLE_URL = "https://console.groq.com/keys";

// Reported by POST /provider-keys/{id}/check.
const STATUS_STYLES = {
  healthy: { label: "Healthy", color: "rgba(34,197,94,0.3)" },
  invalid: { label: "Invalid", color: "rgba(239,68,68,0.32)" },
  error: { label: "Unreachable", color: "rgba(245,158,11,0.3)" },
  unknown: { label: "Not checked", color: "var(--text-muted)" },
};

const surfaceSx = {
  p: 2.5,
  borderRadius: 2,
  background: "rgba(var(--ov),0.03)",
  border: "1px solid rgba(var(--ov),0.08)",
  boxShadow: "none",
};

const formatChecked = (value) => {
  if (!value) return "never checked";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "never checked";
  return `checked ${d.toLocaleString()}`;
};

export default function ProviderKeysPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const [chain, setChain] = useState(null);
  const [chainLoading, setChainLoading] = useState(true);

  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const [busyKeyId, setBusyKeyId] = useState(null);
  const [premiumBusy, setPremiumBusy] = useState(false);

  const activeKey = keys.find((k) => k.isActive) || null;

  const notifyError = useCallback(
    (err, fallback) => {
      enqueueSnackbar(describeAiError(err, fallback).message, {
        variant: "error",
      });
    },
    [enqueueSnackbar],
  );

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProviderKeysService();
      setKeys(res.data?.keys || []);
    } catch (err) {
      notifyError(err, "Unable to load your provider keys.");
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const loadChain = useCallback(async () => {
    setChainLoading(true);
    try {
      const res = await modelChainService();
      setChain(res.data || null);
    } catch (err) {
      // The chain is informational — a failure here should not mask the keys.
      setChain(null);
    } finally {
      setChainLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
    loadChain();
  }, [loadKeys, loadChain]);

  const handleAdd = async () => {
    const trimmed = newKey.trim();
    if (trimmed.length < 8) {
      enqueueSnackbar("Paste a full Groq API key.", { variant: "warning" });
      return;
    }
    setAdding(true);
    try {
      await addProviderKeyService({
        key: trimmed,
        label: newLabel.trim() || null,
      });
      setNewKey("");
      setNewLabel("");
      enqueueSnackbar("Key saved and set as active.", { variant: "success" });
      await Promise.all([loadKeys(), loadChain()]);
    } catch (err) {
      notifyError(err, "Unable to save that key.");
    } finally {
      setAdding(false);
    }
  };

  const handleCheck = async (keyId) => {
    setBusyKeyId(keyId);
    try {
      const res = await checkProviderKeyService(keyId);
      const { status, detail } = res.data || {};
      const variant =
        status === "healthy" ? "success" : status === "invalid" ? "error" : "warning";
      enqueueSnackbar(
        status === "healthy" ? "Key is healthy." : detail || `Key status: ${status}`,
        { variant },
      );
      await loadKeys();
    } catch (err) {
      notifyError(err, "Unable to check that key.");
    } finally {
      setBusyKeyId(null);
    }
  };

  const handleDelete = async (keyId) => {
    setBusyKeyId(keyId);
    try {
      await deleteProviderKeyService(keyId);
      enqueueSnackbar("Key removed.", { variant: "success" });
      await Promise.all([loadKeys(), loadChain()]);
    } catch (err) {
      notifyError(err, "Unable to remove that key.");
    } finally {
      setBusyKeyId(null);
    }
  };

  const handleTogglePremium = async (enabled) => {
    setPremiumBusy(true);
    try {
      const res = await setPremiumModelsService(enabled);
      setChain(res.data || null);
      await loadKeys();
      enqueueSnackbar(
        enabled
          ? "Billable models added to your fallback chain."
          : "Billable models removed — free tier only.",
        { variant: "success" },
      );
    } catch (err) {
      notifyError(err, "Unable to update your model settings.");
    } finally {
      setPremiumBusy(false);
    }
  };

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
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{ color: "var(--text-2)", textTransform: "none", mb: 2 }}
        >
          Back to dashboard
        </Button>

        <Paper
          elevation={20}
          sx={{
            ...glassCard({ radius: 4 }),
            p: { xs: 2.5, md: 4 },
            color: "var(--text)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <VpnKeyRoundedIcon sx={{ color: "var(--accent-soft)" }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              AI Provider Keys
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            sx={{ color: "rgba(var(--ov),0.6)", mb: 3 }}
          >
            Chat, RAG answers, summaries and tags run on <strong>your own Groq
            key</strong>, so usage bills your account and never another user's.
            Embeddings — semantic search and related notes — run on the server's
            key and keep working without one.
          </Typography>

          {/* ── Your keys ─────────────────────────────────────────────── */}
          <Typography sx={{ fontWeight: 600, fontSize: 18, mb: 1.5 }}>
            Your keys
          </Typography>

          {loading ? (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={18} sx={{ color: "var(--accent-soft)" }} />
              <Typography sx={{ color: "rgba(var(--ov),0.6)" }}>
                Loading keys…
              </Typography>
            </Stack>
          ) : keys.length === 0 ? (
            <Paper sx={surfaceSx}>
              <Typography
                sx={{
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                }}
              >
                No key yet. Add one below to turn on chat, summaries and tags.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.25}>
              {keys.map((k) => {
                const style = STATUS_STYLES[k.status] || STATUS_STYLES.unknown;
                const busy = busyKeyId === k.id;
                return (
                  <Paper key={k.id} sx={{ ...surfaceSx, p: 2 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 0.5, flexWrap: "wrap", gap: 0.75 }}
                        >
                          <Typography
                            sx={{ fontWeight: 600, fontFamily: "monospace" }}
                          >
                            {k.maskedKey}
                          </Typography>
                          {k.isActive && (
                            <Chip
                              size="small"
                              label="Active"
                              sx={{
                                color: "var(--text)",
                                backgroundColor: "rgba(99,102,241,0.32)",
                              }}
                            />
                          )}
                          <Chip
                            size="small"
                            label={style.label}
                            sx={{
                              color: "var(--text)",
                              backgroundColor: style.color,
                            }}
                          />
                        </Stack>
                        <Typography
                          sx={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                        >
                          {k.label ? `${k.label} · ` : ""}
                          {k.provider} · {formatChecked(k.lastCheckedAt)}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Test this key against Groq">
                          <span>
                            <IconButton
                              size="small"
                              disabled={busy}
                              onClick={() => handleCheck(k.id)}
                              sx={{ color: "rgba(var(--ov),0.7)" }}
                            >
                              {busy ? (
                                <CircularProgress size={16} />
                              ) : (
                                <RefreshRoundedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Remove this key">
                          <span>
                            <IconButton
                              size="small"
                              disabled={busy}
                              onClick={() => handleDelete(k.id)}
                              sx={{ color: "rgba(var(--ov),0.7)", "&:hover": { color: "var(--danger)" } }}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}

          <Divider sx={{ borderColor: "rgba(var(--ov),0.08)", my: 3 }} />

          {/* ── Add a key ─────────────────────────────────────────────── */}
          <Typography sx={{ fontWeight: 600, fontSize: 18, mb: 0.5 }}>
            {activeKey ? "Replace your key" : "Add a key"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "var(--text-muted)", mb: 2 }}
          >
            Create a free key at{" "}
            <Link
              href={GROQ_CONSOLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: "var(--accent-soft)", display: "inline-flex", alignItems: "center", gap: 0.4 }}
            >
              console.groq.com/keys
              <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
            </Link>
            . A new key becomes your active one — the previous key is kept but
            deactivated.
          </Typography>

          <Stack spacing={1.5}>
            <TextField
              fullWidth
              type="password"
              label="Groq API key"
              placeholder="gsk_…"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              autoComplete="off"
            />
            <TextField
              fullWidth
              label="Label (optional)"
              placeholder="e.g. personal"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              inputProps={{ maxLength: 120 }}
            />
            <Box>
              <Button
                variant="contained"
                onClick={handleAdd}
                disabled={adding || newKey.trim().length < 8}
                startIcon={
                  adding ? (
                    <CircularProgress size={14} sx={{ color: "#fff !important" }} />
                  ) : (
                    <VpnKeyRoundedIcon />
                  )
                }
                sx={{
                  borderRadius: "999px",
                  textTransform: "none",
                  px: 2.5,
                  backgroundColor: "rgba(99,102,241,0.55)",
                  "&:hover": { backgroundColor: "rgba(99,102,241,0.75)" },
                }}
              >
                {adding ? "Saving…" : "Save key"}
              </Button>
            </Box>
          </Stack>

          <Divider sx={{ borderColor: "rgba(var(--ov),0.08)", my: 3 }} />

          {/* ── Fallback chain ────────────────────────────────────────── */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <LayersRoundedIcon sx={{ color: "var(--accent-soft)" }} />
            <Typography sx={{ fontWeight: 600, fontSize: 18 }}>
              Model fallback chain
            </Typography>
            {chainLoading && <CircularProgress size={14} sx={{ color: "var(--accent-soft)" }} />}
            <Box sx={{ flexGrow: 1 }} />
            {/* The gpt-oss ids carry an "openai/" prefix that reads like a
                second provider. Every entry is served by Groq on this key. */}
            <Chip
              size="small"
              label="all via Groq"
              sx={{
                color: "var(--text)",
                backgroundColor: "rgba(99,102,241,0.28)",
                fontSize: 11,
              }}
            />
          </Stack>

          <Paper sx={surfaceSx}>
            <Typography
              variant="body2"
              sx={{ color: "var(--text-muted)", mb: 1.5 }}
            >
              A request tries these in order, moving on when one is rate-limited
              or unavailable. Groq's free tier caps requests per minute, which is
              why the chain exists.
            </Typography>

            {chain?.models?.length ? (
              <Stack spacing={0.75} sx={{ mb: 2 }}>
                {chain.models.map((m, i) => (
                  <Stack key={m} direction="row" spacing={1.25} alignItems="center">
                    <Chip
                      size="small"
                      label={i + 1}
                      sx={{
                        minWidth: 26,
                        color: "var(--text)",
                        backgroundColor: "rgba(var(--ov),0.08)",
                      }}
                    />
                    <Typography sx={{ fontSize: "0.88rem", fontWeight: 600, minWidth: 128 }}>
                      {prettyModel(m)}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {m}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              !chainLoading && (
                <Typography
                  sx={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                    mb: 2,
                  }}
                >
                  Chain unavailable.
                </Typography>
              )
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(chain?.allowPremiumModels)}
                  disabled={!activeKey || premiumBusy}
                  onChange={(e) => handleTogglePremium(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: "0.9rem" }}>
                    Allow billable models past the free tier
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                  >
                    {activeKey
                      ? "Off by default — no request spends your money unless you turn this on."
                      : "Add a key first."}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: "flex-start", ml: 0 }}
            />

            {chain?.embeddingModel && (
              <Typography
                sx={{
                  mt: 2,
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                }}
              >
                Embeddings: {chain.embeddingModel} via {chain.embeddingProvider} —
                the server's key, not yours.
              </Typography>
            )}
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
}
