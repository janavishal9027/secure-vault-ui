// The processing pipeline: what ran, what it cost, what is stale, what failed.
//
// Everything here except the budget tile is admin-only, because it either
// reveals what the deployment is spending or changes what it will spend. The
// page is written for whoever is on call rather than for a first-time user:
// numbers come with the reason they matter, since a queue depth without
// "growing monotonically is the problem" is a number nobody can act on.
//
// The backfill tab is the dangerous one. Opening a campaign demands a written
// reason and starts in CANARY — a bounded slice to evaluate before committing
// to the whole corpus — because there is no rollback, and a version bump
// across thousands of notes is a four-figure operation.

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
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import { useSnackbar } from "notistack";

import {
  advanceBackfillService,
  createBackfillService,
  listBackfillsService,
  migrationStatusService,
  myBudgetService,
  retryTransformFailuresService,
  runTransformBatchService,
  setBackfillStatusService,
  transformCatalogueService,
  transformFailuresService,
  transformReconcileService,
  transformStatusService,
  transformUsageService,
} from "../store/services/TransformsService";
import { describeAiError } from "../utils/aiErrors";
import {
  AiPageShell,
  EmptyState,
  Explain,
  Loading,
  StatTile,
  formatDateTime,
  formatMicros,
  inputSx,
  primaryButtonSx,
  quietButtonSx,
  subtleSx,
  surfaceSx,
} from "../ai/aiUi";

const COST_TINT = {
  LOCAL: "rgba(52,211,153,0.28)",
  LLM_CHEAP: "rgba(96,165,250,0.30)",
  LLM_EXPENSIVE: "rgba(248,113,113,0.28)",
};

const STATE_TINT = {
  SUCCEEDED: "rgba(34,197,94,0.28)",
  SKIPPED: "rgba(var(--ov),0.10)",
  PENDING: "rgba(251,191,36,0.26)",
  DEFERRED: "rgba(129,140,248,0.28)",
  RUNNING: "rgba(45,212,191,0.28)",
  FAILED: "rgba(239,68,68,0.32)",
};

const tabSx = {
  textTransform: "none",
  fontWeight: 600,
  color: "var(--text-muted)",
  "&.Mui-selected": { color: "var(--text)" },
};

export default function TransformsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [budget, setBudget] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [unavailable, setUnavailable] = useState("");

  const notify = useCallback(
    (err, fallback) => {
      if (err?.response?.status === 403) {
        setForbidden(true);
        return;
      }
      if (err?.response?.status === 503) {
        setUnavailable(describeAiError(err, fallback).message);
        return;
      }
      enqueueSnackbar(describeAiError(err, fallback).message, { variant: "error" });
    },
    [enqueueSnackbar],
  );

  useEffect(() => {
    myBudgetService()
      .then((res) => setBudget(res.data))
      .catch(() => setBudget(null));
  }, []);

  return (
    <AiPageShell
      icon={<LayersRoundedIcon sx={{ color: "var(--accent-soft)" }} />}
      title="Processing"
      subtitle={
        <>
          Every AI job that runs over a note — indexing, tagging, summarising,
          entity extraction — goes through one ledger. This is what ran, what it
          cost, what is out of date and what needs attention.
        </>
      }
    >
      {budget?.accounting && (
        <Paper sx={{ ...surfaceSx, mb: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Your daily allowance
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(
              100,
              budget.limitMicros
                ? (budget.spentMicros / budget.limitMicros) * 100
                : 0,
            )}
            sx={{
              height: 8,
              borderRadius: 999,
              backgroundColor: "rgba(var(--ov),0.08)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                backgroundColor: budget.backgroundDeferred
                  ? "rgba(251,191,36,0.9)"
                  : "rgba(99,102,241,0.9)",
              },
            }}
          />
          <Typography sx={{ fontSize: "0.85rem", color: "rgba(var(--ov),0.6)", mt: 1 }}>
            {formatMicros(budget.spentMicros)} of{" "}
            {formatMicros(budget.limitMicros)} used today
          </Typography>
          {budget.backgroundDeferred && (
            <Explain>
              Background work has paused so the rest of today's allowance stays
              available for chat and answers. It resumes tomorrow, or sooner if
              you raise the limit.
            </Explain>
          )}
        </Paper>
      )}

      {forbidden ? (
        <EmptyState
          title="Admin only"
          hint="The operational views below need an admin role. Your own allowance is shown above."
        />
      ) : unavailable ? (
        <EmptyState title="Not enabled on this deployment" hint={unavailable} />
      ) : (
        <>
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
            <Tab label="Queue" sx={tabSx} />
            <Tab label="Freshness" sx={tabSx} />
            <Tab label="Failures" sx={tabSx} />
            <Tab label="Spend" sx={tabSx} />
            <Tab label="Backfills" sx={tabSx} />
            <Tab label="Pipeline" sx={tabSx} />
          </Tabs>

          {tab === 0 && <QueueTab notify={notify} enqueueSnackbar={enqueueSnackbar} />}
          {tab === 1 && <FreshnessTab notify={notify} />}
          {tab === 2 && <FailuresTab notify={notify} enqueueSnackbar={enqueueSnackbar} />}
          {tab === 3 && <SpendTab notify={notify} />}
          {tab === 4 && <BackfillTab notify={notify} enqueueSnackbar={enqueueSnackbar} />}
          {tab === 5 && <PipelineTab notify={notify} />}
        </>
      )}
    </AiPageShell>
  );
}

// --- Queue ----------------------------------------------------------------

function QueueTab({ notify, enqueueSnackbar }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transformStatusService();
      setData(res.data);
    } catch (err) {
      notify(err, "Unable to load the queue.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const drain = async (costClass) => {
    setRunning(true);
    try {
      const res = await runTransformBatchService(costClass, 10);
      enqueueSnackbar(`Ran ${res.data?.ran ?? 0} job(s).`, { variant: "success" });
      await load();
    } catch (err) {
      notify(err, "Unable to run a batch.");
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <Loading label="Reading the ledger…" />;
  if (!data?.transforms?.length) {
    return (
      <EmptyState
        title="Nothing has run yet"
        hint="Jobs appear here as notes are saved and processed."
      />
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Button size="small" startIcon={<RefreshRoundedIcon />} onClick={load} sx={quietButtonSx}>
          Refresh
        </Button>
        {["LOCAL", "LLM_CHEAP", "LLM_EXPENSIVE"].map((costClass) => (
          <Button
            key={costClass}
            size="small"
            startIcon={<PlayArrowRoundedIcon />}
            disabled={running}
            onClick={() => drain(costClass)}
            sx={quietButtonSx}
          >
            Run {costClass.replace("LLM_", "").toLowerCase()}
          </Button>
        ))}
      </Stack>

      <Stack spacing={1.25}>
        {data.transforms.map((transform) => {
          const pending =
            (transform.states?.PENDING || 0) + (transform.states?.DEFERRED || 0);
          return (
            <Paper key={transform.name} sx={subtleSx}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography sx={{ fontWeight: 600, minWidth: 150 }}>
                  {transform.name.replace(/_/g, " ")}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {Object.entries(transform.states || {}).map(([state, count]) => (
                  <Chip
                    key={state}
                    size="small"
                    label={`${state.toLowerCase()} ${count}`}
                    sx={{
                      color: "var(--text)",
                      backgroundColor: STATE_TINT[state] || "rgba(var(--ov),0.1)",
                    }}
                  />
                ))}
                <Chip
                  size="small"
                  label={formatMicros(transform.costMicros)}
                  sx={{ color: "var(--text)", backgroundColor: "rgba(var(--ov),0.08)" }}
                />
                {transform.meanMs != null && (
                  <Chip
                    size="small"
                    label={`${Math.round(transform.meanMs)} ms`}
                    sx={{ color: "var(--text)", backgroundColor: "rgba(var(--ov),0.06)" }}
                  />
                )}
              </Stack>
              {pending > 20 && (
                <Typography sx={{ fontSize: "0.78rem", color: "rgba(251,191,36,0.9)", mt: 0.75 }}>
                  {pending} waiting — fine if it is falling, a problem if it
                  keeps climbing.
                </Typography>
              )}
            </Paper>
          );
        })}
      </Stack>
      <Explain>
        Queue depth on its own means little; the shape over time is the signal.
        Steadily growing "pending" means work is arriving faster than it is
        being done, which nothing else would ever report.
      </Explain>
    </Box>
  );
}

// --- Freshness ------------------------------------------------------------

function FreshnessTab({ notify }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transformReconcileService()
      .then((res) => setData(res.data))
      .catch((err) => notify(err, "Unable to check freshness."))
      .finally(() => setLoading(false));
  }, [notify]);

  if (loading) return <Loading label="Comparing what ran against what exists…" />;
  if (!data) return <EmptyState title="No data" />;

  const divergent = (data.transforms || []).some((t) => t.missing || t.staleVersion);

  return (
    <Box>
      <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ gap: 1.5, mb: 2.5 }}>
        <StatTile label="Notes indexed" value={data.knownNotes ?? 0} />
        <StatTile
          label="Waiting on a dependency"
          value={data.blocked ?? 0}
          hint="normal, not an error"
        />
        <StatTile
          label="Stuck mid-run"
          value={data.stuckRunning ?? 0}
          hint="recovered automatically"
          tone={data.stuckRunning > 0}
        />
      </Stack>

      <Stack spacing={1.25}>
        {(data.transforms || []).map((transform) => (
          <Paper key={transform.name} sx={subtleSx}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography sx={{ fontWeight: 600, minWidth: 150 }}>
                {transform.name.replace(/_/g, " ")}
              </Typography>
              <Chip
                size="small"
                label={`v${transform.version}`}
                sx={{ color: "var(--text)", backgroundColor: "rgba(var(--ov),0.08)" }}
              />
              <Box sx={{ flexGrow: 1 }} />
              <Chip
                size="small"
                label={`${transform.settledAtCurrentVersion} up to date`}
                sx={{ color: "var(--text)", backgroundColor: "rgba(34,197,94,0.26)" }}
              />
              {transform.missing > 0 && (
                <Chip
                  size="small"
                  label={`${transform.missing} not yet run`}
                  sx={{ color: "var(--text)", backgroundColor: "rgba(251,191,36,0.26)" }}
                />
              )}
              {transform.staleVersion > 0 && (
                <Tooltip arrow title="These ran under an older version and need a backfill to catch up.">
                  <Chip
                    size="small"
                    label={`${transform.staleVersion} outdated`}
                    sx={{ color: "var(--text)", backgroundColor: "rgba(239,68,68,0.28)" }}
                  />
                </Tooltip>
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Explain>
        This is the one check that catches work quietly never happening. A note
        that was never indexed produces no error anywhere — it is simply
        invisible to search forever. "Not yet run" is normal shortly after a
        deploy and a problem if it stays.
        {divergent && " Outdated rows are cleared by opening a backfill."}
      </Explain>
    </Box>
  );
}

// --- Failures -------------------------------------------------------------

function FailuresTab({ notify, enqueueSnackbar }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transformFailuresService({ limit: 100 });
      setRows(res.data || []);
    } catch (err) {
      notify(err, "Unable to load failures.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const retry = async () => {
    try {
      const res = await retryTransformFailuresService();
      enqueueSnackbar(`Re-queued ${res.data?.requeued ?? 0} job(s).`, {
        variant: "success",
      });
      await load();
    } catch (err) {
      notify(err, "Unable to re-queue.");
    }
  };

  if (loading) return <Loading label="Looking for failures…" />;

  if (!rows.length) {
    return <EmptyState title="Nothing has failed" hint="Jobs that exhaust their retries would appear here." />;
  }

  // Grouped by error class, because that is what makes them actionable: one
  // note failing is noise, forty failing the same way is a fixable bug.
  const grouped = rows.reduce((acc, row) => {
    const key = row.errorClass || "Unknown";
    (acc[key] = acc[key] || []).push(row);
    return acc;
  }, {});

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 2 }}>
        <Button size="small" startIcon={<ReplayRoundedIcon />} onClick={retry} sx={quietButtonSx}>
          Re-queue all
        </Button>
      </Stack>

      <Stack spacing={2}>
        {Object.entries(grouped).map(([errorClass, group]) => (
          <Paper key={errorClass} sx={surfaceSx}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip
                size="small"
                label={errorClass}
                sx={{ color: "var(--text)", backgroundColor: "rgba(239,68,68,0.3)", fontWeight: 700 }}
              />
              <Typography sx={{ fontWeight: 600 }}>
                {group.length} job{group.length === 1 ? "" : "s"}
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: "0.82rem", color: "rgba(var(--ov),0.6)", mb: 1 }}>
              {group[0].errorDetail}
            </Typography>
            <Stack spacing={0.5}>
              {group.slice(0, 6).map((row) => (
                <Typography
                  key={row.runId}
                  sx={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                >
                  {row.transformName} · {row.noteId} · attempt {row.attempt} ·{" "}
                  {formatDateTime(row.finishedAt)}
                </Typography>
              ))}
              {group.length > 6 && (
                <Typography sx={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  …and {group.length - 6} more
                </Typography>
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>
      <Explain>
        Grouped by cause rather than listed one by one. Several notes failing
        the same way is usually one bug, not several.
      </Explain>
    </Box>
  );
}

// --- Spend ----------------------------------------------------------------

function SpendTab({ notify }) {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    transformUsageService({ days })
      .then((res) => setData(res.data))
      .catch((err) => notify(err, "Unable to load spend."))
      .finally(() => setLoading(false));
  }, [days, notify]);

  if (loading) return <Loading label="Adding it up…" />;
  if (!data) return <EmptyState title="No usage recorded" />;

  const peak = Math.max(1, ...(data.byDay || []).map((d) => d.costMicros || 0));

  return (
    <Box>
      <TextField
        select
        size="small"
        label="Window"
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        sx={{ ...inputSx, minWidth: 160, mb: 2.5 }}
      >
        <MenuItem value={7}>Last 7 days</MenuItem>
        <MenuItem value={14}>Last 14 days</MenuItem>
        <MenuItem value={30}>Last 30 days</MenuItem>
      </TextField>

      <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ gap: 1.5, mb: 2.5 }}>
        <StatTile label="Total" value={formatMicros(data.totalCostMicros)} />
        <StatTile
          label="Per-user daily cap"
          value={formatMicros(data.userDailyLimitMicros)}
        />
        <StatTile
          label="Deployment daily cap"
          value={formatMicros(data.globalDailyLimitMicros)}
        />
      </Stack>

      {!data.byDay?.length ? (
        <EmptyState title="Nothing spent in this window" />
      ) : (
        <Stack spacing={0.75}>
          {data.byDay.map((day) => (
            <Stack key={day.date} direction="row" spacing={1.5} alignItems="center">
              <Typography sx={{ fontSize: "0.8rem", width: 92, color: "rgba(var(--ov),0.6)" }}>
                {day.date}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(var(--ov),0.06)",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${Math.max(2, ((day.costMicros || 0) / peak) * 100)}%`,
                    height: "100%",
                    background: "rgba(99,102,241,0.85)",
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: "0.8rem", width: 84, textAlign: "right" }}>
                {formatMicros(day.costMicros)}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", width: 64, color: "var(--text-muted)" }}>
                {day.calls} calls
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      {data.topUsers?.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Heaviest users</Typography>
          <Stack spacing={0.5}>
            {data.topUsers.map((user) => (
              <Stack key={user.ownerUserId} direction="row" spacing={1}>
                <Typography sx={{ fontSize: "0.82rem", flex: 1 }} noWrap>
                  {user.ownerUserId}
                </Typography>
                <Typography sx={{ fontSize: "0.82rem" }}>
                  {formatMicros(user.costMicros)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      <Explain>
        Estimated from published per-token prices, so treat it as a comparison
        rather than an invoice — a model with no price entry counts as zero
        rather than being guessed at.
      </Explain>
    </Box>
  );
}

// --- Backfills ------------------------------------------------------------

function BackfillTab({ notify, enqueueSnackbar }) {
  const [campaigns, setCampaigns] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    transformName: "",
    reason: "",
    rateLimitPerMin: 30,
    canarySize: 100,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, cat] = await Promise.all([
        listBackfillsService(),
        transformCatalogueService(),
      ]);
      setCampaigns((list.data?.backfills || []).filter(Boolean));
      setCatalogue(cat.data?.transforms || []);
    } catch (err) {
      notify(err, "Unable to load backfills.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    try {
      await createBackfillService(form);
      setOpen(false);
      setForm({ ...form, reason: "" });
      enqueueSnackbar("Opened, paused at the canary. Advance it, then check the results.", {
        variant: "success",
      });
      await load();
    } catch (err) {
      notify(err, "Unable to open that backfill.");
    }
  };

  const act = async (id, fn, message) => {
    try {
      await fn();
      enqueueSnackbar(message, { variant: "success" });
      await load();
    } catch (err) {
      notify(err, "That did not work.");
    }
  };

  if (loading) return <Loading label="Loading campaigns…" />;

  return (
    <Box>
      <Alert
        severity="warning"
        sx={{
          mb: 2.5,
          background: "rgba(251,191,36,0.12)",
          color: "var(--text)",
          border: "1px solid rgba(251,191,36,0.3)",
          "& .MuiAlert-icon": { color: "rgba(251,191,36,0.9)" },
        }}
      >
        A backfill re-runs a job across every note. It is the only thing here
        that can spend a lot of money quickly, so campaigns start paused at a
        small canary and there is no undo — check the canary's results before
        letting one run.
      </Alert>

      <Button startIcon={<PlayArrowRoundedIcon />} onClick={() => setOpen(true)} sx={primaryButtonSx}>
        Open a campaign
      </Button>

      {campaigns.length === 0 ? (
        <Box sx={{ mt: 2.5 }}>
          <EmptyState title="No campaigns" hint="Open one after bumping a transform's version." />
        </Box>
      ) : (
        <Stack spacing={1.5} sx={{ mt: 2.5 }}>
          {campaigns.map((campaign) => (
            <Paper key={campaign.backfillId} sx={surfaceSx}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography sx={{ fontWeight: 600 }}>
                  {campaign.transform} → v{campaign.targetVersion}
                </Typography>
                <Chip
                  size="small"
                  label={campaign.status}
                  sx={{
                    color: "var(--text)",
                    backgroundColor:
                      campaign.status === "RUNNING"
                        ? "rgba(45,212,191,0.3)"
                        : campaign.status === "DONE"
                          ? "rgba(34,197,94,0.28)"
                          : campaign.status === "ABORTED"
                            ? "rgba(239,68,68,0.3)"
                            : "rgba(251,191,36,0.28)",
                    fontWeight: 700,
                  }}
                />
                <Box sx={{ flexGrow: 1 }} />
                <Typography sx={{ fontSize: "0.85rem" }}>
                  {campaign.queued}/{campaign.estimated} queued ·{" "}
                  {formatMicros(campaign.costMicros)}
                  {campaign.failed > 0 ? ` · ${campaign.failed} failed` : ""}
                </Typography>
              </Stack>

              <Typography sx={{ fontSize: "0.85rem", color: "rgba(var(--ov),0.6)", mt: 0.5 }}>
                {campaign.reason}
              </Typography>
              {campaign.note && (
                <Typography sx={{ fontSize: "0.8rem", color: "rgba(251,191,36,0.9)", mt: 0.5 }}>
                  {campaign.note}
                </Typography>
              )}

              <LinearProgress
                variant="determinate"
                value={Math.min(
                  100,
                  campaign.estimated ? (campaign.queued / campaign.estimated) * 100 : 0,
                )}
                sx={{
                  height: 6,
                  borderRadius: 999,
                  my: 1.25,
                  backgroundColor: "rgba(var(--ov),0.08)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    backgroundColor: "rgba(99,102,241,0.85)",
                  },
                }}
              />

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                <Button
                  size="small"
                  onClick={() =>
                    act(
                      campaign.backfillId,
                      () => advanceBackfillService(campaign.backfillId),
                      "Queued the next slice.",
                    )
                  }
                  sx={quietButtonSx}
                >
                  Advance
                </Button>
                {campaign.status !== "RUNNING" && (
                  <Button
                    size="small"
                    onClick={() =>
                      act(
                        campaign.backfillId,
                        () => setBackfillStatusService(campaign.backfillId, "RUNNING"),
                        "Running.",
                      )
                    }
                    sx={quietButtonSx}
                  >
                    Let it run
                  </Button>
                )}
                {campaign.status === "RUNNING" && (
                  <Button
                    size="small"
                    onClick={() =>
                      act(
                        campaign.backfillId,
                        () => setBackfillStatusService(campaign.backfillId, "PAUSED"),
                        "Paused.",
                      )
                    }
                    sx={quietButtonSx}
                  >
                    Pause
                  </Button>
                )}
                <Button
                  size="small"
                  onClick={() =>
                    act(
                      campaign.backfillId,
                      () => setBackfillStatusService(campaign.backfillId, "ABORTED"),
                      "Aborted.",
                    )
                  }
                  sx={quietButtonSx}
                >
                  Abort
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
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
        <DialogTitle>Open a backfill</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              size="small"
              label="Job"
              value={form.transformName}
              onChange={(e) => setForm({ ...form, transformName: e.target.value })}
              sx={inputSx}
            >
              {catalogue.map((transform) => (
                <MenuItem key={transform.name} value={transform.name}>
                  {transform.name} (v{transform.version})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Why"
              placeholder="prompt v2: stricter entity typing"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              helperText="Required — this is the record of why the spend happened."
              sx={inputSx}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                size="small"
                type="number"
                label="Notes per minute"
                value={form.rateLimitPerMin}
                onChange={(e) =>
                  setForm({ ...form, rateLimitPerMin: Number(e.target.value) })
                }
                sx={{ ...inputSx, flex: 1 }}
              />
              <TextField
                size="small"
                type="number"
                label="Canary size"
                value={form.canarySize}
                onChange={(e) => setForm({ ...form, canarySize: Number(e.target.value) })}
                helperText="Stops here for review"
                sx={{ ...inputSx, flex: 1 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={quietButtonSx}>
            Cancel
          </Button>
          <Button
            onClick={create}
            disabled={!form.transformName || form.reason.trim().length < 4}
            sx={primaryButtonSx}
          >
            Open, paused
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// --- Pipeline -------------------------------------------------------------

function PipelineTab({ notify }) {
  const [catalogue, setCatalogue] = useState(null);
  const [migrations, setMigrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([transformCatalogueService(), migrationStatusService()])
      .then(([cat, mig]) => {
        setCatalogue(cat.data);
        setMigrations(mig.data?.migrations || []);
      })
      .catch((err) => notify(err, "Unable to load the pipeline."))
      .finally(() => setLoading(false));
  }, [notify]);

  if (loading) return <Loading label="Loading the pipeline…" />;

  const pendingMigrations = migrations.filter((m) => !m.applied);

  return (
    <Box>
      {catalogue?.problems?.length > 0 && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            background: "rgba(239,68,68,0.12)",
            color: "var(--text)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          {catalogue.problems.join("; ")}
        </Alert>
      )}

      <Typography sx={{ fontWeight: 600, mb: 1 }}>Jobs, in the order they run</Typography>
      <Stack spacing={1}>
        {(catalogue?.transforms || []).map((transform) => (
          <Paper key={transform.name} sx={subtleSx}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography sx={{ fontWeight: 600, minWidth: 150 }}>
                {transform.name.replace(/_/g, " ")}
              </Typography>
              <Chip
                size="small"
                label={transform.costClass.replace("LLM_", "").toLowerCase()}
                sx={{
                  color: "var(--text)",
                  backgroundColor: COST_TINT[transform.costClass],
                }}
              />
              <Chip
                size="small"
                label={`v${transform.version}`}
                sx={{ color: "var(--text)", backgroundColor: "rgba(var(--ov),0.08)" }}
              />
              {transform.userScoped && (
                <Tooltip arrow title="Runs once per user rather than per note — deciding that a name in one note is the same person as in another is inherently cross-note.">
                  <Chip
                    size="small"
                    label="per user"
                    sx={{ color: "var(--text)", backgroundColor: "rgba(232,121,249,0.24)" }}
                  />
                </Tooltip>
              )}
              <Box sx={{ flexGrow: 1 }} />
              <Chip
                size="small"
                label={transform.enabled ? "running" : "registered only"}
                sx={{
                  color: "var(--text)",
                  backgroundColor: transform.enabled
                    ? "rgba(34,197,94,0.26)"
                    : "rgba(var(--ov),0.08)",
                }}
              />
            </Stack>
            {transform.dependsOn?.length > 0 && (
              <Typography sx={{ fontSize: "0.78rem", color: "var(--text-muted)", mt: 0.5 }}>
                waits for {transform.dependsOn.join(", ")}
              </Typography>
            )}
          </Paper>
        ))}
      </Stack>

      <Typography sx={{ fontWeight: 600, mt: 3, mb: 1 }}>Database schema</Typography>
      <Paper sx={subtleSx}>
        <Typography sx={{ fontSize: "0.9rem" }}>
          {migrations.length - pendingMigrations.length} of {migrations.length} steps
          applied
        </Typography>
        {pendingMigrations.length > 0 && (
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {pendingMigrations.map((migration) => (
              <Typography
                key={migration.id}
                sx={{ fontSize: "0.8rem", color: "rgba(251,191,36,0.9)" }}
              >
                pending — {migration.id}: {migration.description}
              </Typography>
            ))}
          </Stack>
        )}
      </Paper>

      <Explain>
        A job that "waits for" another only runs once that one has finished for
        the same note. Jobs marked "registered only" are known to the system but
        are not dispatched on this deployment.
      </Explain>
    </Box>
  );
}
