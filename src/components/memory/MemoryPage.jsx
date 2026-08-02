// What the assistant remembers about you.
//
// This page is mostly *control*, and deliberately so. A system that forms
// persistent beliefs about a person without their visibility or consent is a
// trust violation regardless of how well it works — so the inspector,
// provenance, edit, delete, pause, wipe and export all exist, and none of them
// is behind a "coming soon".
//
// Two details that carry most of the trust:
//
//   * every memory shows the exact sentence it came from. "Why do you think
//     that about me?" has to be answerable with the user's own words, not with
//     a confidence score.
//   * deleting is a standing instruction, not a one-time removal. A memory
//     that reappears next week reads as the system ignoring you, and that is
//     the fastest way to lose trust in the whole feature.

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { useSnackbar } from "notistack";

import {
  createMemoryService,
  deleteMemoryService,
  editMemoryService,
  exportMemoriesService,
  listMemoriesService,
  memoryHistoryService,
  memoryKindsService,
  memoryReviewService,
  memorySettingsService,
  memoryStatsService,
  resolveMemoryReviewService,
  updateMemorySettingsService,
  wipeMemoriesService,
} from "../store/services/MemoryService";
import { describeAiError } from "../utils/aiErrors";
import {
  AiPageShell,
  EmptyState,
  Explain,
  Loading,
  StatTile,
  TypeChip,
  dangerButtonSx,
  formatDate,
  inputSx,
  primaryButtonSx,
  quietButtonSx,
  subtleSx,
  surfaceSx,
} from "../ai/aiUi";

const KINDS = [
  "PREFERENCE",
  "FACT",
  "GOAL",
  "RELATIONSHIP",
  "HABIT",
  "PROJECT_STATE",
];

const STATUS_LABEL = {
  ACTIVE: "in use",
  SUPERSEDED: "replaced",
  ARCHIVED: "faded",
  RETRACTED: "deleted",
  PENDING_REVIEW: "needs your call",
};

const tabSx = {
  textTransform: "none",
  fontWeight: 600,
  color: "var(--text-muted)",
  "&.Mui-selected": { color: "var(--text)" },
};

export default function MemoryPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [tab, setTab] = useState(0);
  const [memories, setMemories] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [kinds, setKinds] = useState([]);
  const [unavailable, setUnavailable] = useState("");

  const [adding, setAdding] = useState(false);
  const [newStatement, setNewStatement] = useState("");
  const [newKind, setNewKind] = useState("FACT");

  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [history, setHistory] = useState(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const notify = useCallback(
    (err, fallback) =>
      enqueueSnackbar(describeAiError(err, fallback).message, { variant: "error" }),
    [enqueueSnackbar],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMemoriesService({ status: statusFilter, limit: 500 });
      setMemories(res.data?.memories || []);
      setUnavailable("");
    } catch (err) {
      if (err?.response?.status === 503) {
        setUnavailable(describeAiError(err, "Memory is not enabled.").message);
      } else {
        notify(err, "Unable to load your memories.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, notify]);

  const loadMeta = useCallback(async () => {
    try {
      const [statsRes, settingsRes, kindsRes] = await Promise.all([
        memoryStatsService(),
        memorySettingsService(),
        memoryKindsService(),
      ]);
      setStats(statsRes.data);
      setSettings(settingsRes.data);
      setKinds(kindsRes.data?.kinds || []);
    } catch {
      // Informational only — a failure here must not hide the memories.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const halfLifeFor = (kind) =>
    kinds.find((k) => k.kind === kind)?.halfLifeDays;

  const handleAdd = async () => {
    if (newStatement.trim().length < 3) return;
    setAdding(true);
    try {
      await createMemoryService({
        statement: newStatement.trim(),
        kind: newKind,
      });
      setNewStatement("");
      enqueueSnackbar("Saved. This one never fades and is never overwritten.", {
        variant: "success",
      });
      await Promise.all([load(), loadMeta()]);
    } catch (err) {
      notify(err, "Unable to save that memory.");
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async () => {
    if (!editing || editText.trim().length < 3) return;
    try {
      await editMemoryService(editing.memoryId, editText.trim());
      // The user's wording wins permanently: an edited memory becomes explicit
      // so nothing inferred can quietly overrule it later.
      enqueueSnackbar("Updated. Your wording now takes precedence.", {
        variant: "success",
      });
      setEditing(null);
      await load();
    } catch (err) {
      notify(err, "Unable to update that memory.");
    }
  };

  const handleDelete = async (memory) => {
    try {
      await deleteMemoryService(memory.memoryId);
      enqueueSnackbar("Deleted, and it will not be formed again.", {
        variant: "success",
      });
      await Promise.all([load(), loadMeta()]);
    } catch (err) {
      notify(err, "Unable to delete that memory.");
    }
  };

  const handlePause = async (paused) => {
    try {
      const res = await updateMemorySettingsService(paused);
      setSettings(res.data);
      enqueueSnackbar(
        paused
          ? "Paused. Nothing new will be remembered; what's here stays."
          : "Resumed.",
        { variant: "success" },
      );
    } catch (err) {
      notify(err, "Unable to change that setting.");
    }
  };

  const handleExport = async () => {
    try {
      const res = await exportMemoriesService();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "secure-vault-memories.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify(err, "Unable to export your memories.");
    }
  };

  const handleWipe = async () => {
    try {
      const res = await wipeMemoriesService();
      setConfirmWipe(false);
      enqueueSnackbar(`Removed ${res.data?.removed ?? 0} memories.`, {
        variant: "success",
      });
      await Promise.all([load(), loadMeta()]);
    } catch (err) {
      notify(err, "Unable to wipe your memories.");
    }
  };

  const openHistory = async (memory) => {
    try {
      const res = await memoryHistoryService(memory.memoryId);
      setHistory(res.data);
    } catch (err) {
      notify(err, "Unable to load that history.");
    }
  };

  if (unavailable) {
    return (
      <AiPageShell
        icon={<PsychologyRoundedIcon sx={{ color: "var(--accent-soft)" }} />}
        title="Memory"
      >
        <EmptyState title="Not enabled on this deployment" hint={unavailable} />
      </AiPageShell>
    );
  }

  return (
    <AiPageShell
      icon={<PsychologyRoundedIcon sx={{ color: "var(--accent-soft)" }} />}
      title="Memory"
      subtitle={
        <>
          Chat only sees the last few turns, so without this the assistant meets
          you again every session. Everything it has concluded about you is
          listed here, with the words it came from — and you can rewrite or
          delete any of it.
        </>
      }
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<DownloadRoundedIcon />}
            onClick={handleExport}
            sx={quietButtonSx}
          >
            Export
          </Button>
        </Stack>
      }
    >
      {settings && !settings.extractionEnabled && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            background: "rgba(99,102,241,0.12)",
            color: "var(--text)",
            border: "1px solid rgba(99,102,241,0.3)",
            "& .MuiAlert-icon": { color: "var(--accent-soft)" },
          }}
        >
          Automatic memory is off on this deployment. Nothing is inferred from
          your conversations — only what you add here, or say with "remember
          that…" in chat, is kept.
        </Alert>
      )}

      {stats?.available && (
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          flexWrap="wrap"
          sx={{ gap: 1.5, mb: 3 }}
        >
          <StatTile
            label="In use"
            value={stats.active ?? 0}
            hint={`of ${stats.ceiling} maximum`}
          />
          <StatTile
            label="You said these"
            value={stats.explicit ?? 0}
            hint="never fade"
          />
          <StatTile
            label="Replaced"
            value={stats.byStatus?.SUPERSEDED ?? 0}
            hint="kept as history"
          />
          <StatTile
            label="Faded"
            value={stats.byStatus?.ARCHIVED ?? 0}
            hint="out of use, not deleted"
          />
        </Stack>
      )}

      <Tabs
        value={tab}
        onChange={(_, next) => setTab(next)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          borderBottom: "1px solid rgba(var(--ov),0.08)",
          "& .MuiTabs-indicator": { backgroundColor: "var(--accent-soft)" },
        }}
      >
        <Tab label="What it knows" sx={tabSx} />
        <Tab label="Needs your call" sx={tabSx} />
        <Tab label="Controls" sx={tabSx} />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Paper sx={{ ...surfaceSx, mb: 2.5 }}>
            <Typography sx={{ fontWeight: 600, mb: 1.5 }}>
              Tell it something directly
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                size="small"
                fullWidth
                placeholder="Prefers concise answers with code examples"
                value={newStatement}
                onChange={(e) => setNewStatement(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                sx={inputSx}
              />
              <TextField
                select
                size="small"
                label="Kind"
                value={newKind}
                onChange={(e) => setNewKind(e.target.value)}
                sx={{ ...inputSx, minWidth: 170 }}
              >
                {KINDS.map((kind) => (
                  <MenuItem key={kind} value={kind}>
                    {kind.replace(/_/g, " ").toLowerCase()}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                startIcon={<AddRoundedIcon />}
                onClick={handleAdd}
                disabled={adding || newStatement.trim().length < 3}
                sx={primaryButtonSx}
              >
                Remember
              </Button>
            </Stack>
            <Explain>
              Write it as a fact about you in the third person — "prefers
              concise answers", not "I like short answers". One fact per
              memory, so a change to your job never takes a preference with it.
            </Explain>
          </Paper>

          <TextField
            select
            size="small"
            label="Show"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ ...inputSx, minWidth: 220, mb: 2 }}
          >
            <MenuItem value="ACTIVE">In use</MenuItem>
            <MenuItem value="SUPERSEDED">Replaced (history)</MenuItem>
            <MenuItem value="ARCHIVED">Faded</MenuItem>
            <MenuItem value="ALL">Everything</MenuItem>
          </TextField>

          {loading ? (
            <Loading label="Reading what it knows…" />
          ) : memories.length === 0 ? (
            <EmptyState
              title="Nothing remembered yet"
              hint="Add something above, or say 'remember that…' in chat."
            />
          ) : (
            <Stack spacing={1.25}>
              {memories.map((memory) => (
                <Paper key={memory.memoryId} sx={subtleSx}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                    flexWrap="wrap"
                  >
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {memory.statement}
                      </Typography>
                      {memory.sourceExcerpt && (
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                            fontStyle: "italic",
                            mt: 0.5,
                          }}
                        >
                          from your words: “{memory.sourceExcerpt}”
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Tooltip
                        arrow
                        title={
                          halfLifeFor(memory.kind)
                            ? `Fades by half after about ${halfLifeFor(memory.kind)} days without use`
                            : ""
                        }
                      >
                        <span>
                          <TypeChip value={memory.kind} />
                        </span>
                      </Tooltip>
                      {memory.sourceKind === "EXPLICIT" && (
                        <Tooltip arrow title="You said this outright, so it never fades and is never overwritten automatically.">
                          <Chip
                            size="small"
                            label="yours"
                            sx={{
                              color: "var(--text)",
                              backgroundColor: "rgba(34,197,94,0.28)",
                              fontWeight: 600,
                            }}
                          />
                        </Tooltip>
                      )}
                      {memory.status !== "ACTIVE" && (
                        <Chip
                          size="small"
                          label={STATUS_LABEL[memory.status] || memory.status}
                          sx={{
                            color: "var(--text)",
                            backgroundColor: "rgba(var(--ov),0.1)",
                          }}
                        />
                      )}
                    </Stack>

                    <Stack direction="row" spacing={0.25}>
                      {memory.supersededBy || memory.status === "SUPERSEDED" ? (
                        <Tooltip arrow title="What this replaced">
                          <IconButton
                            size="small"
                            onClick={() => openHistory(memory)}
                            sx={{ color: "var(--text-muted)" }}
                          >
                            <HistoryRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      <Tooltip arrow title="Rewrite this">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditing(memory);
                            setEditText(memory.statement);
                          }}
                          sx={{ color: "var(--text-muted)" }}
                        >
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip arrow title="Delete, and never form it again">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(memory)}
                          sx={{
                            color: "var(--text-muted)",
                            "&:hover": { color: "var(--danger)" },
                          }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  <Typography
                    sx={{ fontSize: "0.72rem", color: "var(--text-muted)", mt: 0.75 }}
                  >
                    added {formatDate(memory.createdAt)} · used{" "}
                    {memory.accessCount ?? 0}×
                    {memory.validUntil
                      ? ` · replaced ${formatDate(memory.validUntil)}`
                      : ""}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {tab === 1 && <ReviewTab notify={notify} enqueueSnackbar={enqueueSnackbar} />}

      {tab === 2 && (
        <Stack spacing={2.5}>
          <Paper sx={surfaceSx}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(settings?.paused)}
                  onChange={(e) => handlePause(e.target.checked)}
                />
              }
              label={
                <Typography sx={{ fontWeight: 600 }}>
                  Pause remembering
                </Typography>
              }
            />
            <Explain>
              Stops anything new being formed. Everything already remembered
              keeps working — this is not the same as deleting.
            </Explain>
          </Paper>

          <Paper sx={surfaceSx}>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
              What is never remembered
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "rgba(var(--ov),0.6)" }}>
              Health, money, credentials, beliefs, and other people's private
              lives are refused before they are stored — including if you ask
              for them directly. "Miguel is my tech lead" is fine; "Miguel is
              going through a divorce" is not.
            </Typography>
          </Paper>

          <Paper sx={{ ...surfaceSx, borderColor: "rgba(239,68,68,0.3)" }}>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
              Forget everything
            </Typography>
            <Typography
              sx={{ fontSize: "0.85rem", color: "rgba(var(--ov),0.6)", mb: 1.5 }}
            >
              Deletes every memory and every record of what you previously
              deleted. One action, nothing kept back, and it cannot be undone.
            </Typography>
            <Button
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={() => setConfirmWipe(true)}
              sx={dangerButtonSx}
            >
              Wipe all memories
            </Button>
          </Paper>
        </Stack>
      )}

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            color: "var(--text)",
            borderRadius: 3,
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle>Rewrite this memory</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            sx={{ ...inputSx, mt: 1 }}
          />
          <Explain>
            Your version wins permanently — from now on nothing inferred can
            overwrite it.
          </Explain>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditing(null)} sx={quietButtonSx}>
            Cancel
          </Button>
          <Button onClick={handleEdit} sx={primaryButtonSx}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(history)}
        onClose={() => setHistory(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            color: "var(--text)",
            borderRadius: 3,
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle>What this replaced</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Paper sx={{ ...subtleSx, borderColor: "rgba(99,102,241,0.4)" }}>
              <Typography sx={{ fontWeight: 600 }}>
                {history?.memory?.statement}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                current
              </Typography>
            </Paper>
            {(history?.previous || []).map((item) => (
              <Paper key={item.memoryId} sx={subtleSx}>
                <Typography>{item.statement}</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  until {formatDate(item.validUntil)}
                </Typography>
              </Paper>
            ))}
            {!history?.previous?.length && (
              <Typography sx={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Nothing came before this one.
              </Typography>
            )}
          </Stack>
          <Explain>
            Replaced memories are kept rather than overwritten, so "what did I
            used to…?" still has an answer.
          </Explain>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setHistory(null)} sx={quietButtonSx}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmWipe}
        onClose={() => setConfirmWipe(false)}
        PaperProps={{
          sx: {
            color: "var(--text)",
            borderRadius: 3,
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle>Forget everything?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "rgba(var(--ov),0.7)" }}>
            This removes every memory, including the ones you added yourself,
            and cannot be undone. Your notes are not affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmWipe(false)} sx={quietButtonSx}>
            Cancel
          </Button>
          <Button onClick={handleWipe} sx={dangerButtonSx}>
            Wipe everything
          </Button>
        </DialogActions>
      </Dialog>
    </AiPageShell>
  );
}

// --- Review ---------------------------------------------------------------

function ReviewTab({ notify, enqueueSnackbar }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await memoryReviewService();
      setItems(res.data?.memories || []);
    } catch (err) {
      notify(err, "Unable to load the review queue.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (memoryId, keep) => {
    setBusyId(memoryId);
    try {
      await resolveMemoryReviewService(memoryId, keep);
      enqueueSnackbar(keep ? "Kept." : "Discarded.", { variant: "success" });
      await load();
    } catch (err) {
      notify(err, "Unable to record that.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loading label="Loading what needs deciding…" />;

  if (!items.length) {
    return (
      <EmptyState
        title="Nothing to decide"
        hint="Things land here only when two remembered facts contradict each other and neither can safely be assumed newer — a birthplace, for instance, cannot change."
      />
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontSize: "0.85rem", color: "rgba(var(--ov),0.6)" }}>
        These contradict each other and cannot both be true. Rather than guess,
        the assistant stopped using both until you say which is right.
      </Typography>
      {items.map((memory) => (
        <Paper key={memory.memoryId} sx={surfaceSx}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography sx={{ fontWeight: 600, flex: 1 }}>
              {memory.statement}
            </Typography>
            <TypeChip value={memory.kind} />
          </Stack>
          {memory.sourceExcerpt && (
            <Typography
              sx={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                fontStyle: "italic",
                mt: 0.5,
              }}
            >
              from your words: “{memory.sourceExcerpt}”
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button
              size="small"
              disabled={busyId === memory.memoryId}
              onClick={() => decide(memory.memoryId, true)}
              sx={primaryButtonSx}
            >
              This one is right
            </Button>
            <Button
              size="small"
              disabled={busyId === memory.memoryId}
              onClick={() => decide(memory.memoryId, false)}
              sx={quietButtonSx}
            >
              Discard this one
            </Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
