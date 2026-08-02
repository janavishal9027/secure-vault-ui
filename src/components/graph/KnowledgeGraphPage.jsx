// The knowledge graph: what is *in* your notes, and how it connects.
//
// Five tabs, each answering a question vector search structurally cannot:
//
//   Entities     — who and what the vault is about
//   Graph        — the neighbourhood picture (also the best extraction-quality
//                  debugger there is)
//   Connections  — "how are these two related?", answered as a path
//   Review       — pairs the resolver would not merge without a human
//   Ask          — a grounded answer citing note passages AND relationships
//
// The Ask tab is the only place `graphFacts` is surfaced. `/rag/answer`
// returns two citation lists — `[n]` for note passages and `[Gn]` for
// relationships — and both are rendered, because a fact block whose markers
// resolve to nothing is exactly the silently-lost citation the backend's
// context layer exists to prevent.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import {
  acceptMergeCandidateService,
  entityNeighborhoodService,
  graphInsightsService,
  graphPathService,
  graphStatusService,
  listEntitiesService,
  mergeCandidatesService,
  rejectMergeCandidateService,
  resolveEntitiesService,
} from "../store/services/GraphService";
import { ragAnswerService } from "../store/services/AiCoreService";
import {
  markerLabel,
  noteIdFor,
  resolveMarker,
  splitCitations,
} from "../ai/citations";
import { describeAiError, KEYS_ROUTE } from "../utils/aiErrors";
import EntityDetailDialog from "./EntityDetailDialog";
import EntityGraph from "./EntityGraph";
import {
  AiPageShell,
  EmptyState,
  ErrorNote,
  Explain,
  Loading,
  StatTile,
  TypeChip,
  formatDate,
  inputSx,
  primaryButtonSx,
  quietButtonSx,
  subtleSx,
  surfaceSx,
} from "../ai/aiUi";

const ENTITY_TYPES = [
  "PERSON",
  "ORGANIZATION",
  "PROJECT",
  "CONCEPT",
  "TECHNOLOGY",
  "PLACE",
  "EVENT",
  "DOCUMENT",
];

const tabSx = {
  textTransform: "none",
  fontWeight: 600,
  color: "var(--text-muted)",
  "&.Mui-selected": { color: "var(--text)" },
};

export default function KnowledgeGraphPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [tab, setTab] = useState(0);
  const [entities, setEntities] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [unavailable, setUnavailable] = useState("");

  const [openEntityId, setOpenEntityId] = useState(null);

  const notify = useCallback(
    (err, fallback) =>
      enqueueSnackbar(describeAiError(err, fallback).message, { variant: "error" }),
    [enqueueSnackbar],
  );

  const loadEntities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listEntitiesService({
        ...(query.trim() ? { q: query.trim() } : {}),
        ...(type ? { type } : {}),
        limit: 200,
      });
      setEntities(res.data?.entities || []);
      setTotal(res.data?.total || 0);
      setUnavailable("");
    } catch (err) {
      if (err?.response?.status === 503) {
        setUnavailable(
          describeAiError(err, "The knowledge graph is not enabled.").message,
        );
      } else {
        notify(err, "Unable to load entities.");
      }
    } finally {
      setLoading(false);
    }
  }, [query, type, notify]);

  const loadStatus = useCallback(async () => {
    try {
      const res = await graphStatusService();
      setStatus(res.data);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const timer = setTimeout(loadEntities, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadEntities, query]);

  const handleResolve = async () => {
    try {
      const res = await resolveEntitiesService();
      const { merged = 0, queued = 0, examined = 0 } = res.data || {};
      enqueueSnackbar(
        `Examined ${examined} entities — merged ${merged}, queued ${queued} for review.`,
        { variant: "success" },
      );
      await Promise.all([loadEntities(), loadStatus()]);
    } catch (err) {
      notify(err, "Unable to run the resolution sweep.");
    }
  };

  if (unavailable) {
    return (
      <AiPageShell
        icon={<AccountTreeRoundedIcon sx={{ color: "var(--accent-soft)" }} />}
        title="Knowledge Graph"
      >
        <EmptyState
          title="Not enabled on this deployment"
          hint={unavailable}
        />
      </AiPageShell>
    );
  }

  return (
    <AiPageShell
      icon={<AccountTreeRoundedIcon sx={{ color: "var(--accent-soft)" }} />}
      title="Knowledge Graph"
      subtitle={
        <>
          Semantic search answers <em>"what did I write about X?"</em>. This
          answers the questions it cannot: who works on what, how two things
          connect, which projects have gone quiet. Built automatically from
          your notes — delete a note and everything it was the only source for
          goes with it.
        </>
      }
      actions={
        <Button
          size="small"
          startIcon={<RefreshRoundedIcon />}
          onClick={handleResolve}
          sx={quietButtonSx}
        >
          Re-resolve duplicates
        </Button>
      }
    >
      {status?.available && (
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          flexWrap="wrap"
          sx={{ gap: 1.5, mb: 3 }}
        >
          <StatTile label="Entities" value={status.entities?.active ?? 0} />
          <StatTile label="Relationships" value={status.relations ?? 0} />
          <StatTile
            label="Notes processed"
            value={status.notes?.DONE ?? 0}
            hint={
              status.notes?.PENDING
                ? `${status.notes.PENDING} still queued`
                : undefined
            }
          />
          <StatTile
            label="Vague links"
            value={`${Math.round((status.relatedToRatio || 0) * 100)}%`}
            hint="over 40% means the vocabulary is too small"
            tone={status.relatedToRatio > 0.4}
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
        <Tab label="Entities" sx={tabSx} />
        <Tab label="Graph" sx={tabSx} />
        <Tab label="Connections" sx={tabSx} />
        <Tab label="Review" sx={tabSx} />
        <Tab label="Ask" sx={tabSx} />
        <Tab label="Overview" sx={tabSx} />
      </Tabs>

      {tab === 0 && (
        <EntitiesTab
          entities={entities}
          total={total}
          loading={loading}
          query={query}
          setQuery={setQuery}
          type={type}
          setType={setType}
          onOpen={setOpenEntityId}
        />
      )}
      {tab === 1 && (
        <GraphTab entities={entities} onOpen={setOpenEntityId} notify={notify} />
      )}
      {tab === 2 && <ConnectionsTab entities={entities} notify={notify} />}
      {tab === 3 && (
        <ReviewTab
          notify={notify}
          enqueueSnackbar={enqueueSnackbar}
          onChanged={loadEntities}
        />
      )}
      {tab === 4 && <AskTab notify={notify} navigate={navigate} />}
      {tab === 5 && <OverviewTab notify={notify} onOpen={setOpenEntityId} />}

      <EntityDetailDialog
        entityId={openEntityId}
        open={Boolean(openEntityId)}
        onClose={() => setOpenEntityId(null)}
        onChanged={loadEntities}
      />
    </AiPageShell>
  );
}

// --- Overview -------------------------------------------------------------

/** "What is my vault actually about?" — the corpus-shape reports.
 *
 *  Hubs answer it directly. Stale projects and note-less notes are the two
 *  quiet problems a vault accumulates: work you stopped writing about, and
 *  notes the extractor found nothing nameable in — which is usually a
 *  corpus-quality signal and occasionally an extraction bug. */
function OverviewTab({ notify, onOpen }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    graphInsightsService()
      .then((res) => setData(res.data))
      .catch((err) => notify(err, "Unable to load the overview."))
      .finally(() => setLoading(false));
  }, [notify]);

  if (loading) return <Loading label="Looking at the shape of your vault…" />;
  if (!data) return <EmptyState title="No overview available" />;

  return (
    <Box>
      <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ gap: 1.5, mb: 3 }}>
        <StatTile label="Entities" value={data.entityCount ?? 0} />
        <StatTile label="Relationships" value={data.relationCount ?? 0} />
        <StatTile
          label="Notes with nothing named"
          value={data.notesWithoutEntities ?? 0}
          hint="usually fine — sometimes a hint"
        />
      </Stack>

      <Typography sx={{ fontWeight: 600, mb: 1 }}>
        What your vault is mostly about
      </Typography>
      {!data.hubs?.length ? (
        <EmptyState title="Not enough connections yet" />
      ) : (
        <Stack spacing={1}>
          {data.hubs.map((hub) => (
            <Paper
              key={hub.entity.entityId}
              onClick={() => onOpen(hub.entity.entityId)}
              sx={{
                ...subtleSx,
                cursor: "pointer",
                "&:hover": { borderColor: "rgba(99,102,241,0.45)" },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: 600 }}>{hub.entity.name}</Typography>
                <TypeChip value={hub.entity.entityType} />
                <Box sx={{ flexGrow: 1 }} />
                <Chip
                  size="small"
                  label={`${hub.degree} connection${hub.degree === 1 ? "" : "s"}`}
                  sx={{ color: "var(--text)", backgroundColor: "rgba(99,102,241,0.25)" }}
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {data.staleProjects?.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Projects you have not written about in a while
          </Typography>
          <Stack spacing={1}>
            {data.staleProjects.map((project) => (
              <Paper
                key={project.entityId}
                onClick={() => onOpen(project.entityId)}
                sx={{
                  ...subtleSx,
                  cursor: "pointer",
                  "&:hover": { borderColor: "rgba(99,102,241,0.45)" },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontWeight: 600 }}>{project.name}</Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography sx={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    last mentioned {formatDate(project.lastSeenAt)}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
          <Explain>
            Not a problem in itself — just work that has gone quiet, which is
            often worth a look.
          </Explain>
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
          How specific the links are
        </Typography>
        <Typography sx={{ fontSize: "0.85rem", color: "rgba(var(--ov),0.6)" }}>
          {Math.round((data.relatedToRatio || 0) * 100)}% of relationships are
          only "related to" rather than something precise like "works on" or
          "depends on".
          {data.relatedToRatio > 0.4
            ? " That is high — the vocabulary is probably too narrow for what you write about."
            : " That is a healthy proportion."}
        </Typography>
      </Box>
    </Box>
  );
}

// --- Entities -------------------------------------------------------------

function EntitiesTab({
  entities,
  total,
  loading,
  query,
  setQuery,
  type,
  setType,
  onOpen,
}) {
  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search names and aliases…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchRoundedIcon
                sx={{ color: "var(--text-muted)", mr: 1, fontSize: 20 }}
              />
            ),
          }}
          sx={inputSx}
        />
        <TextField
          select
          size="small"
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          sx={{ ...inputSx, minWidth: 180 }}
        >
          <MenuItem value="">All types</MenuItem>
          {ENTITY_TYPES.map((option) => (
            <MenuItem key={option} value={option}>
              {option.toLowerCase()}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {loading ? (
        <Loading label="Reading your graph…" />
      ) : entities.length === 0 ? (
        <EmptyState
          title={query || type ? "Nothing matches that" : "No entities yet"}
          hint={
            query || type
              ? "Try a shorter fragment, or clear the type filter."
              : "Entities are extracted from notes over about 200 characters, shortly after you save them."
          }
        />
      ) : (
        <>
          <Stack spacing={1}>
            {entities.map((entity) => (
              <Paper
                key={entity.entityId}
                onClick={() => onOpen(entity.entityId)}
                sx={{
                  ...subtleSx,
                  cursor: "pointer",
                  "&:hover": {
                    background: "rgba(var(--ov),0.06)",
                    borderColor: "rgba(99,102,241,0.45)",
                  },
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
                  <Typography sx={{ fontWeight: 600 }}>{entity.name}</Typography>
                  <TypeChip value={entity.entityType} />
                  <Box sx={{ flexGrow: 1 }} />
                  <Chip
                    size="small"
                    label={`${entity.mentionCount} note${entity.mentionCount === 1 ? "" : "s"}`}
                    sx={{
                      color: "var(--text)",
                      backgroundColor: "rgba(var(--ov),0.08)",
                    }}
                  />
                </Stack>
                {entity.description && (
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      color: "rgba(var(--ov),0.6)",
                      mt: 0.5,
                    }}
                  >
                    {entity.description}
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
          <Explain>
            Showing {entities.length} of {total}. Click any entity for
            everything the vault knows about it.
          </Explain>
        </>
      )}
    </Box>
  );
}

// --- Graph ----------------------------------------------------------------

function GraphTab({ entities, onOpen, notify }) {
  const [seedId, setSeedId] = useState("");
  const [depth, setDepth] = useState(2);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Default to the most-mentioned entity: the graph around a hub is the most
  // informative first picture, and an empty canvas teaches nothing.
  const defaultSeed = useMemo(
    () => entities[0]?.entityId || "",
    [entities],
  );

  useEffect(() => {
    if (!seedId && defaultSeed) setSeedId(defaultSeed);
  }, [defaultSeed, seedId]);

  useEffect(() => {
    if (!seedId) return;
    let cancelled = false;
    setLoading(true);
    entityNeighborhoodService(seedId, depth)
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && notify(err, "Unable to draw that neighbourhood."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [seedId, depth, notify]);

  if (!entities.length) {
    return <EmptyState title="Nothing to draw yet" hint="Save a few notes first." />;
  }

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          select
          size="small"
          label="Centre on"
          value={seedId}
          onChange={(e) => setSeedId(e.target.value)}
          sx={{ ...inputSx, flex: 1 }}
        >
          {entities.map((entity) => (
            <MenuItem key={entity.entityId} value={entity.entityId}>
              {entity.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Depth"
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          sx={{ ...inputSx, minWidth: 150 }}
        >
          <MenuItem value={1}>1 hop</MenuItem>
          <MenuItem value={2}>2 hops</MenuItem>
        </TextField>
      </Stack>

      {loading ? (
        <Loading label="Walking the graph…" />
      ) : !data || !data.nodes?.length ? (
        <EmptyState
          title="This entity has no connections yet"
          hint="Relationships appear when a note says how two named things relate."
        />
      ) : (
        <>
          <EntityGraph
            nodes={data.nodes}
            edges={data.edges}
            seedId={seedId}
            onSelect={onOpen}
          />
          {data.truncated && (
            <Typography
              sx={{ fontSize: "0.8rem", color: "rgba(251,191,36,0.9)", mt: 1 }}
            >
              This neighbourhood is larger than the display cap — some edges are
              not shown. Try depth 1 for a readable picture.
            </Typography>
          )}
        </>
      )}
      <Explain>
        Depth stops at two on purpose. Three hops in a personal graph reaches
        almost everything, which turns a neighbourhood into an undifferentiated
        dump.
      </Explain>
    </Box>
  );
}

// --- Connections ----------------------------------------------------------

function ConnectionsTab({ entities, notify }) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFind = async () => {
    if (!fromId || !toId || fromId === toId) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await graphPathService(fromId, toId);
      setResult(res.data);
    } catch (err) {
      notify(err, "Unable to look for a connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          select
          size="small"
          label="From"
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
          sx={{ ...inputSx, flex: 1 }}
        >
          {entities.map((entity) => (
            <MenuItem key={entity.entityId} value={entity.entityId}>
              {entity.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="To"
          value={toId}
          onChange={(e) => setToId(e.target.value)}
          sx={{ ...inputSx, flex: 1 }}
        >
          {entities.map((entity) => (
            <MenuItem key={entity.entityId} value={entity.entityId}>
              {entity.name}
            </MenuItem>
          ))}
        </TextField>
        <Button
          startIcon={<TimelineRoundedIcon />}
          onClick={handleFind}
          disabled={!fromId || !toId || fromId === toId || loading}
          sx={primaryButtonSx}
        >
          Find the link
        </Button>
      </Stack>

      {loading ? (
        <Loading label="Looking for a path…" />
      ) : result === null ? (
        <EmptyState
          title="Pick two things"
          hint="This walks the graph for a chain of relationships between them — the question no similarity search can take."
        />
      ) : !result.found ? (
        <EmptyState
          title="No connection found"
          hint="Nothing in your notes links these two, at least not within a few hops."
        />
      ) : (
        <Stack spacing={1.25}>
          {result.steps.map((step, index) => (
            <Paper key={`${step.predicate}-${index}`} sx={subtleSx}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  size="small"
                  label={index + 1}
                  sx={{
                    color: "var(--text)",
                    backgroundColor: "rgba(99,102,241,0.3)",
                    fontWeight: 700,
                  }}
                />
                <Typography>
                  <strong>{step.from.name}</strong>{" "}
                  <span style={{ opacity: 0.65 }}>{step.label}</span>{" "}
                  <strong>{step.to.name}</strong>
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {step.noteIds?.length > 0 && (
                  <Chip
                    size="small"
                    label={`${step.noteIds.length} note${step.noteIds.length === 1 ? "" : "s"}`}
                    sx={{
                      color: "var(--text)",
                      backgroundColor: "rgba(var(--ov),0.08)",
                    }}
                  />
                )}
              </Stack>
            </Paper>
          ))}
          <Explain>
            Every step is backed by notes you wrote. Nothing here is inferred
            from outside your vault.
          </Explain>
        </Stack>
      )}
    </Box>
  );
}

// --- Review ---------------------------------------------------------------

function ReviewTab({ notify, enqueueSnackbar, onChanged }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mergeCandidatesService();
      setCandidates(res.data?.candidates || []);
    } catch (err) {
      notify(err, "Unable to load the review queue.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (candidateId, accept) => {
    setBusyId(candidateId);
    try {
      if (accept) await acceptMergeCandidateService(candidateId);
      else await rejectMergeCandidateService(candidateId);
      enqueueSnackbar(accept ? "Merged." : "Kept separate.", {
        variant: "success",
      });
      await load();
      onChanged?.();
    } catch (err) {
      notify(err, "Unable to record that decision.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loading label="Loading pairs to review…" />;

  if (!candidates.length) {
    return (
      <EmptyState
        title="Nothing waiting on you"
        hint="Pairs land here only when the resolver finds two entities similar enough to be suspicious but not similar enough to merge on its own."
      />
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontSize: "0.85rem", color: "rgba(var(--ov),0.6)" }}>
        Are these the same thing? Merging two entities that really are separate
        cannot be cleanly undone, which is why these wait for you rather than
        being decided automatically.
      </Typography>

      {candidates.map((candidate) => (
        <Paper key={candidate.candidateId} sx={surfaceSx}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: 600 }}>
                  {candidate.source.name}
                </Typography>
                <TypeChip value={candidate.source.entityType} />
              </Stack>
              {candidate.source.description && (
                <Typography sx={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {candidate.source.description}
                </Typography>
              )}
            </Box>

            <Chip
              size="small"
              label={`${Math.round(candidate.similarity * 100)}% alike`}
              sx={{
                color: "var(--text)",
                backgroundColor: "rgba(251,191,36,0.28)",
                fontWeight: 600,
              }}
            />

            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: 600 }}>
                  {candidate.target.name}
                </Typography>
                <TypeChip value={candidate.target.entityType} />
              </Stack>
              {candidate.target.description && (
                <Typography sx={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {candidate.target.description}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                disabled={busyId === candidate.candidateId}
                onClick={() => decide(candidate.candidateId, true)}
                sx={primaryButtonSx}
              >
                Same thing
              </Button>
              <Button
                size="small"
                disabled={busyId === candidate.candidateId}
                onClick={() => decide(candidate.candidateId, false)}
                sx={quietButtonSx}
              >
                Keep separate
              </Button>
            </Stack>
          </Stack>
          {candidate.reason && (
            <Explain>Flagged because: {candidate.reason}</Explain>
          )}
        </Paper>
      ))}
    </Stack>
  );
}

// --- Ask ------------------------------------------------------------------

/** Renders `[1]` and `[G1]` markers as chips wired to their source.
 *
 *  The model is given ordinals and never an id, so the worst it can do is cite
 *  a number that does not exist — detectable, and dropped server-side before
 *  it reaches here. */
export function AnswerText({ answer, citations = [], facts = [], onOpenNote }) {
  const parts = useMemo(() => splitCitations(answer), [answer]);

  return (
    <Typography component="div" sx={{ lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
      {parts.map((part, index) => {
        if (part.text !== undefined) return <span key={index}>{part.text}</span>;
        return (
          <span key={index}>
            {part.markers.map((marker, i) => {
              const source = resolveMarker(marker, citations, facts);
              // Unresolvable: render nothing. The model cited an ordinal that
              // is not in the block it was given.
              if (!source) return null;
              const noteId = noteIdFor(marker, source);
              return (
                <Tooltip
                  key={`${markerLabel(marker)}-${i}`}
                  arrow
                  title={
                    marker.graph
                      ? `${source.statement} — from ${source.supportCount} note${source.supportCount === 1 ? "" : "s"}`
                      : source.title || "note"
                  }
                >
                  <Chip
                    size="small"
                    label={markerLabel(marker)}
                    onClick={() => noteId && onOpenNote(noteId)}
                    sx={{
                      mx: 0.3,
                      height: 20,
                      cursor: "pointer",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      backgroundColor: marker.graph
                        ? "rgba(45,212,191,0.3)"
                        : "rgba(99,102,241,0.3)",
                    }}
                  />
                </Tooltip>
              );
            })}
          </span>
        );
      })}
    </Typography>
  );
}

function AskTab({ notify, navigate }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setNeedsKey(false);
    try {
      const res = await ragAnswerService({ question: question.trim() });
      setAnswer(res.data);
    } catch (err) {
      const described = describeAiError(err, "Unable to answer that.");
      setNeedsKey(described.needsKey);
      if (!described.needsKey) notify(err, "Unable to answer that.");
      else setAnswer({ answer: described.message, citations: [], graphFacts: [] });
    } finally {
      setLoading(false);
    }
  };

  const openNote = (noteId) =>
    navigate(`/dashboard/create-note?noteId=${encodeURIComponent(noteId)}`);

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Who works on the migration? What connects these two?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && ask()}
          sx={inputSx}
        />
        <Button
          startIcon={<AutoAwesomeRoundedIcon />}
          onClick={ask}
          disabled={loading || !question.trim()}
          sx={primaryButtonSx}
        >
          Ask
        </Button>
      </Stack>

      {loading ? (
        <Loading label="Retrieving and reasoning over your notes…" />
      ) : !answer ? (
        <EmptyState
          title="Ask something about your own notes"
          hint="Answers here come only from what you wrote, and every claim is linked back to the note or relationship it came from."
        />
      ) : (
        <Stack spacing={2}>
          <Paper sx={surfaceSx}>
            <AnswerText
              answer={answer.answer || ""}
              citations={answer.citations || []}
              facts={answer.graphFacts || []}
              onOpenNote={openNote}
            />
          </Paper>

          {needsKey && (
            <Button onClick={() => navigate(KEYS_ROUTE)} sx={primaryButtonSx}>
              Add a provider key
            </Button>
          )}

          {answer.graphFacts?.length > 0 && (
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Relationships used
              </Typography>
              <Stack spacing={1}>
                {answer.graphFacts.map((fact) => (
                  <Paper key={fact.n} sx={subtleSx}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip
                        size="small"
                        label={`G${fact.n}`}
                        sx={{
                          color: "var(--text)",
                          backgroundColor: "rgba(45,212,191,0.3)",
                          fontWeight: 700,
                        }}
                      />
                      <Typography sx={{ fontSize: "0.9rem" }}>
                        {fact.statement}
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <Chip
                        size="small"
                        label={`${fact.supportCount} note${fact.supportCount === 1 ? "" : "s"}`}
                        sx={{
                          color: "var(--text)",
                          backgroundColor: "rgba(var(--ov),0.08)",
                        }}
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {answer.citations?.length > 0 && (
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Notes cited
              </Typography>
              <Stack spacing={1}>
                {answer.citations.map((citation) => (
                  <Paper
                    key={citation.n}
                    onClick={() => openNote(citation.noteId)}
                    sx={{
                      ...subtleSx,
                      cursor: "pointer",
                      "&:hover": { borderColor: "rgba(99,102,241,0.45)" },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        label={citation.n}
                        sx={{
                          color: "var(--text)",
                          backgroundColor: "rgba(99,102,241,0.3)",
                          fontWeight: 700,
                        }}
                      />
                      <Typography sx={{ fontWeight: 600 }} noWrap>
                        {citation.title || "Untitled note"}
                      </Typography>
                      {citation.section && (
                        <Typography
                          sx={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                          noWrap
                        >
                          {citation.section}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {answer.rewrittenQuery && (
            <Explain>
              Searched for "{answer.rewrittenQuery}" rather than your exact
              wording, so a follow-up still finds the right notes.
            </Explain>
          )}
          <Divider sx={{ borderColor: "rgba(var(--ov),0.08)" }} />
          <Explain>
            Numbered chips link back to their source — indigo for a note
            passage, teal for a relationship drawn from the graph. If nothing
            in your notes answers the question, this says so rather than
            guessing.
          </Explain>
        </Stack>
      )}
      <ErrorNote />
    </Box>
  );
}
